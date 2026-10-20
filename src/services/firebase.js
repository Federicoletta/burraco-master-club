import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  collection, 
  getDocs, 
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  getAdditionalUserInfo
} from 'firebase/auth';

// Configurazione Firebase del progetto dedicato "burraco-score-fedec"
const firebaseConfig = {
  projectId: "burraco-score-fedec",
  appId: "1:453081841776:web:0e44d414aad67a818b34b5",
  storageBucket: "burraco-score-fedec.firebasestorage.app",
  apiKey: "AIzaSyAto2ITLoaMtUvRkanYacdK1yrqLm48J68",
  authDomain: "burraco-score-fedec.firebaseapp.com",
  messagingSenderId: "453081841776",
  projectNumber: "453081841776",
};

let app;
let db;
let auth;
const googleProvider = new GoogleAuthProvider();

try {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  try {
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    });
  } catch (_cacheErr) {
    db = getFirestore(app);
  }
  auth = getAuth(app);
} catch (err) {
  console.error('Firebase initialization error:', err);
}

export { db, auth };

/**
 * Sanitizza ricorsivamente oggetti prima di inviarli a Firestore,
 * rimuovendo campi `undefined` e prevenendo eccezioni "Unsupported field value: undefined".
 * Mantiene integri i FieldValue speciali (es. serverTimestamp), Date e tipi primitivi.
 */
export function sanitizeForFirestore(val) {
  if (val === undefined) return null;
  if (val === null || typeof val !== 'object') return val;
  if (val instanceof Date) return val.toISOString();
  if (val?.constructor?.name === 'FieldValue' || val?._methodName || typeof val.isEqual === 'function') {
    return val;
  }
  if (Array.isArray(val)) {
    return val.filter(item => item !== undefined).map(sanitizeForFirestore);
  }
  const cleanObj = {};
  for (const [key, value] of Object.entries(val)) {
    if (value !== undefined) {
      cleanObj[key] = sanitizeForFirestore(value);
    }
  }
  return cleanObj;
}

/**
 * Accesso con Account Google (Popup)
 */
export async function loginWithGoogle() {
  if (!auth) throw new Error('Firebase Auth non inizializzato');
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result?.user;

    let isNewUser = false;
    try {
      const additionalInfo = getAdditionalUserInfo(result);
      isNewUser = Boolean(additionalInfo?.isNewUser);
    } catch {
      // fallback
    }

    const wasWelcomed = localStorage.getItem('burraco_welcomed_' + user?.uid) === 'true';
    if (user) {
      user.isFirstLogin = Boolean(isNewUser || !wasWelcomed);
    }

    // Registra/aggiorna il profilo utente su Firestore in background
    if (db && user) {
      try {
        const userRef = doc(db, 'burraco_users', user.uid);
        await setDoc(userRef, {
          uid: user.uid,
          displayName: user.displayName || 'Giocatore Burraco',
          email: (user.email || '').toLowerCase(),
          photoURL: user.photoURL || null,
          lastLogin: new Date().toISOString(),
          lastSeen: new Date().toISOString()
        }, { merge: true });
      } catch (firestoreErr) {
        console.warn('Avviso: impossibile salvare profilo su Firestore (regole di sicurezza o offline):', firestoreErr);
      }
    }
    return user;
  } catch (err) {
    console.error('Errore login Google:', err);
    throw err;
  }
}

/**
 * Disconnessione utente
 */
export async function logoutUser() {
  if (!auth) return;
  try {
    await signOut(auth);
  } catch (err) {
    console.error('Errore logout:', err);
    throw err;
  }
}

/**
 * Ascolta lo stato di autenticazione dell'utente
 */
export function subscribeToAuth(onUserChange) {
  if (!auth) return () => {};
  return onAuthStateChanged(auth, async (user) => {
    onUserChange(user);
    if (user && db) {
      const now = Date.now();
      const lastSynced = Number(sessionStorage.getItem('burraco_last_seen_sync') || 0);
      if (now - lastSynced > 15 * 60 * 1000) {
        sessionStorage.setItem('burraco_last_seen_sync', String(now));
        try {
          const userRef = doc(db, 'burraco_users', user.uid);
          await setDoc(userRef, {
            uid: user.uid,
            displayName: user.displayName || 'Giocatore Burraco',
            email: (user.email || '').toLowerCase(),
            photoURL: user.photoURL || null,
            lastSeen: new Date().toISOString()
          }, { merge: true });
        } catch (err) {
          console.warn('Errore aggiornamento lastSeen:', err);
        }
      }
    }
  });
}

/**
 * Salva o aggiorna una partita nel cloud database Firestore con tracciamento proprietario
 * Con protezione salvaguardia multi-dispositivo contro sovrascritture di mani perse
 */
export async function syncGameToCloud(game, currentUser = null, force = false) {
  if (!db || !game?.id) return false;
  try {
    const gameRef = doc(db, 'burraco_games', game.id);

    // Salvaguardia multi-dispositivo: se non forzato, controlliamo che un client con meno round
    // non sovrascriva un documento cloud che ha già più round registrati
    if (!force) {
      try {
        const snap = await getDoc(gameRef);
        if (snap.exists()) {
          const remoteData = snap.data();
          const remoteRounds = Array.isArray(remoteData.rounds) ? remoteData.rounds : [];
          const localRounds = Array.isArray(game.rounds) ? game.rounds : [];
          
          if (remoteRounds.length > localRounds.length) {
            console.warn(`[syncGameToCloud] Documento remoto ha ${remoteRounds.length} mani, locale ne ha ${localRounds.length}. Sovrascrittura bloccata per salvaguardia.`);
            return false;
          }
        }
      } catch (err) {
        console.warn('Controllo versione remota non riuscito:', err);
      }
    }

    const payload = sanitizeForFirestore({
      ...game,
      ownerUid: game.ownerUid !== undefined ? game.ownerUid : (currentUser?.uid || null),
      ownerEmail: game.ownerEmail !== undefined ? game.ownerEmail : (currentUser?.email || null),
      ownerName: game.ownerName !== undefined ? game.ownerName : (currentUser?.displayName || null),
      playerUids: Array.isArray(game.playerUids) ? game.playerUids : (currentUser?.uid ? [currentUser.uid] : []),
      playerEmails: Array.isArray(game.playerEmails) ? game.playerEmails : (currentUser?.email ? [currentUser.email] : []),
      updatedAt: serverTimestamp(),
    });
    await setDoc(gameRef, payload, { merge: true });
    return true;
  } catch (err) {
    console.warn('Errore syncGameToCloud:', err.message);
    return false;
  }
}

/**
 * Ascolta in tempo reale le modifiche di una partita (Real-time listener)
 */
export function subscribeToCloudGame(gameId, onUpdate, onNotFound) {
  if (!db || !gameId) return () => {};
  try {
    const gameRef = doc(db, 'burraco_games', gameId);
    return onSnapshot(gameRef, (docSnap) => {
      if (docSnap.exists()) {
        onUpdate(docSnap.data());
      } else if (onNotFound) {
        onNotFound();
      }
    }, (err) => {
      console.warn('Errore listener Firestore:', err.message);
    });
  } catch (err) {
    console.warn('subscribeToCloudGame error:', err);
    return () => {};
  }
}

/**
/**
 * Verifica in modo robusto (UID, email case-insensitive o nome giocatore) se una partita appartiene all'utente
 */
export function isGameAssociatedWithUser(data, currentUser) {
  if (!data) return false;
  if (!currentUser) {
    return !data.ownerUid;
  }
  const userUid = (currentUser.uid || '').trim();
  const userEmail = (currentUser.email || '').trim().toLowerCase();
  const userName = (currentUser.displayName || '').trim().toLowerCase();

  if (userUid && data.ownerUid === userUid) return true;
  if (userUid && Array.isArray(data.playerUids) && data.playerUids.includes(userUid)) return true;
  if (userEmail && Array.isArray(data.playerEmails) && data.playerEmails.some(e => (e || '').trim().toLowerCase() === userEmail)) return true;

  if (userName) {
    const checkNames = (players) => (players || []).some(p => typeof p === 'string' && p.trim().toLowerCase() === userName);
    if (checkNames(data.team1?.players) || checkNames(data.team2?.players) || checkNames(data.team3?.players)) {
      return true;
    }
  }
  return false;
}

/**
 * Carica le partite archiviate dal cloud per l'utente specificato
 */
export async function loadCloudGamesHistory(currentUser = null) {
  if (!db) return [];
  try {
    const snapshot = await getDocs(collection(db, 'burraco_games'));
    const games = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      if (data && data.id && (data.isFinished || (data.rounds && data.rounds.length > 0))) {
        if (isGameAssociatedWithUser(data, currentUser)) {
          games.push(data);
        }
      }
    });
    games.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    return games;
  } catch (err) {
    console.warn('Errore caricamento partite da Firestore:', err.message);
    return [];
  }
}

/**
 * Elimina una partita archiviata da Firestore
 */
export async function deleteGameFromCloud(gameId) {
  if (!db || !gameId) return false;
  try {
    const gameRef = doc(db, 'burraco_games', gameId);
    await deleteDoc(gameRef);
    return true;
  } catch (err) {
    console.warn('Errore deleteGameFromCloud:', err.message);
    return false;
  }
}

/**
 * Salva la lista dei partecipanti sul cloud (globale/fallback)
 */
export async function syncPlayersToCloud(players) {
  if (!db || !players) return false;
  try {
    const docRef = doc(db, 'burraco_meta', 'players');
    await setDoc(docRef, { list: players, updatedAt: serverTimestamp() }, { merge: true });
    return true;
  } catch (err) {
    console.warn('Errore syncPlayersToCloud:', err.message);
    return false;
  }
}

/**
 * Salva la rubrica ospiti specifica per l'utente loggato nel suo documento profilo
 */
export async function syncUserGuestsToCloud(userId, guests) {
  if (!db || !userId) return false;
  try {
    const userRef = doc(db, 'burraco_users', userId);
    await setDoc(userRef, { guests: guests || [] }, { merge: true });
    return true;
  } catch (err) {
    console.warn('Errore syncUserGuestsToCloud:', err.message);
    return false;
  }
}

/**
 * Ascolta in tempo reale la rubrica ospiti dell'utente
 */
export function subscribeToUserGuests(userId, onUpdate) {
  if (!db || !userId) return () => {};
  try {
    const userRef = doc(db, 'burraco_users', userId);
    return onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists() && Array.isArray(docSnap.data().guests)) {
        onUpdate(docSnap.data().guests);
      } else {
        onUpdate([]);
      }
    }, (err) => {
      console.warn('Errore subscribeToUserGuests:', err.message);
    });
  } catch (err) {
    console.warn('subscribeToUserGuests error:', err);
    return () => {};
  }
}

/**
 * Ascolta in tempo reale le modifiche alla lista partecipanti su Firestore (fallback ospite)
 */
export function subscribeToCloudPlayers(onUpdate) {
  if (!db) return () => {};
  try {
    const docRef = doc(db, 'burraco_meta', 'players');
    return onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists() && Array.isArray(docSnap.data().list)) {
        onUpdate(docSnap.data().list);
      }
    }, (err) => {
      console.warn('Errore listener Firestore players:', err.message);
    });
  } catch (err) {
    console.warn('subscribeToCloudPlayers error:', err);
    return () => {};
  }
}

/**
 * Ascolta in tempo reale lo storico partite da Firestore con isolamento utente
 */
export function subscribeToCloudGamesHistory(currentUser, onUpdate) {
  if (!db) return () => {};
  try {
    const colRef = collection(db, 'burraco_games');
    return onSnapshot(colRef, (snapshot) => {
      const games = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        if (data && data.id && (data.isFinished || (data.rounds && data.rounds.length > 0))) {
          if (isGameAssociatedWithUser(data, currentUser)) {
            games.push(data);
          }
        }
      });
      games.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      onUpdate(games);
    }, (err) => {
      console.warn('Errore listener Firestore history:', err.message);
    });
  } catch (err) {
    console.warn('subscribeToCloudGamesHistory error:', err);
    return () => {};
  }
}

/**
 * Funzione disattivata per salvaguardia: nessuna pulizia distruttiva di partite o localStorage
 */
export async function cleanupLegacyCloudDatabase() {
  return true;
}

// ==========================================
// METODI SINCRONIZZAZIONE TORNEI CLOUD
// ==========================================

/**
 * Salva o aggiorna un torneo nel cloud database Firestore
 */
export async function syncTournamentToCloud(tournament) {
  if (!db || !tournament?.id) return false;
  try {
    const tournamentRef = doc(db, 'burraco_tournaments', tournament.id);
    const payload = sanitizeForFirestore({
      ...tournament,
      updatedAt: serverTimestamp(),
    });
    await setDoc(tournamentRef, payload, { merge: true });
    return true;
  } catch (err) {
    console.warn('Errore syncTournamentToCloud:', err.message);
    return false;
  }
}

/**
 * Ascolta in tempo reale le modifiche del torneo attivo
 */
export function subscribeToCloudTournament(tournamentId, onUpdate) {
  if (!db || !tournamentId) return () => {};
  try {
    const tournamentRef = doc(db, 'burraco_tournaments', tournamentId);
    return onSnapshot(tournamentRef, (docSnap) => {
      if (docSnap.exists()) {
        onUpdate(docSnap.data());
      }
    }, (err) => {
      console.warn('Errore listener Firestore tournament:', err.message);
    });
  } catch (err) {
    console.warn('subscribeToCloudTournament error:', err);
    return () => {};
  }
}

/**
 * Carica lo storico tornei dal cloud
 */
export async function loadCloudTournamentsHistory() {
  if (!db) return [];
  try {
    const snapshot = await getDocs(collection(db, 'burraco_tournaments'));
    const list = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      if (data && data.id) list.push(data);
    });
    list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    return list;
  } catch (err) {
    console.warn('Errore loadCloudTournamentsHistory:', err.message);
    return [];
  }
}

/**
 * Elimina un torneo dal cloud
 */
export async function deleteTournamentFromCloud(tournamentId) {
  if (!db || !tournamentId) return false;
  try {
    const tournamentRef = doc(db, 'burraco_tournaments', tournamentId);
    await deleteDoc(tournamentRef);
    return true;
  } catch (err) {
    console.warn('Errore deleteTournamentFromCloud:', err.message);
    return false;
  }
}

/**
 * Registra la presenza dell'utente autenticato nella partita cloud (se non già presente)
 */
export async function joinCloudGame(gameId, currentUser) {
  if (!db || !gameId || !currentUser?.uid) return;
  try {
    const gameRef = doc(db, 'burraco_games', gameId);
    const snap = await getDoc(gameRef);
    if (!snap.exists()) return;
    const data = snap.data();
    const currentUids = Array.isArray(data.playerUids) ? data.playerUids : [];
    const currentEmails = Array.isArray(data.playerEmails) ? data.playerEmails : [];
    
    const needsUid = !currentUids.includes(currentUser.uid);
    const userEmail = (currentUser.email || '').toLowerCase();
    const needsEmail = userEmail && !currentEmails.includes(userEmail);
    
    if (needsUid || needsEmail) {
      const updatedUids = needsUid ? [...currentUids, currentUser.uid] : currentUids;
      const updatedEmails = (needsEmail && userEmail) ? [...currentEmails, userEmail] : currentEmails;
      await setDoc(gameRef, {
        playerUids: updatedUids.slice(0, 10),
        playerEmails: updatedEmails.slice(0, 10),
        updatedAt: serverTimestamp()
      }, { merge: true });
    }
  } catch (err) {
    console.warn('Errore joinCloudGame:', err.message);
  }
}

/**
 * Recupera i profili pubblici degli utenti collegati al tavolo (per UID ed Email)
 */
export async function fetchTablePlayers(uids = [], emails = []) {
  if (!db) return [];
  try {
    const profiles = [];
    const seenUids = new Set();
    const seenEmails = new Set();

    if (Array.isArray(uids)) {
      for (const uid of uids) {
        if (!uid || seenUids.has(uid)) continue;
        const userRef = doc(db, 'burraco_users', uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          const uData = snap.data();
          profiles.push(uData);
          seenUids.add(uData.uid);
          if (uData.email) seenEmails.add(uData.email.toLowerCase());
        }
      }
    }

    if (Array.isArray(emails)) {
      for (const email of emails) {
        if (!email) continue;
        const clean = email.toLowerCase().trim();
        if (seenEmails.has(clean)) continue;
        try {
          const usersRef = collection(db, 'burraco_users');
          const q = query(usersRef, where('email', '==', clean));
          const snap = await getDocs(q);
          if (!snap.empty) {
            const uData = snap.docs[0].data();
            if (!seenUids.has(uData.uid)) {
              profiles.push(uData);
              seenUids.add(uData.uid);
              seenEmails.add(clean);
            }
          }
        } catch (_e) {
          // ignore lookup error
        }
      }
    }

    return profiles;
  } catch (err) {
    console.warn('Errore fetchTablePlayers:', err.message);
    return [];
  }
}

/**
 * Salva o aggiorna le statistiche globali di carriera dell'utente sul suo profilo Firestore
 */
export async function updateUserCareerStats(userId, stats) {
  if (!db || !userId || !stats) return false;
  try {
    const userRef = doc(db, 'burraco_users', userId);
    const payload = sanitizeForFirestore({
      careerStats: {
        totalPoints: Number(stats.totalPoints) || 0,
        gamesPlayed: Number(stats.gamesPlayed) || 0,
        gamesWon: Number(stats.gamesWon) || 0,
        winRate: Number(stats.winRate) || 0,
        cleanBurrachi: Number(stats.cleanBurrachi) || 0,
        semiCleanBurrachi: Number(stats.semiCleanBurrachi) || 0,
        dirtyBurrachi: Number(stats.dirtyBurrachi) || 0,
        closures: Number(stats.closures) || 0,
        bestHandScore: Number(stats.bestHandScore) || 0,
        trophiesCount: Number(stats.trophiesCount) || 0,
        updatedAt: new Date().toISOString()
      }
    });
    await setDoc(userRef, payload, { merge: true });
    return true;
  } catch (err) {
    console.warn('Errore updateUserCareerStats:', err.message);
    return false;
  }
}

/**
 * Ascolta in tempo reale i profili e le statistiche di carriera di tutti i propri amici
 */
export function subscribeToFriendsLiveProfiles(friendsList, onUpdate) {
  if (!db || !Array.isArray(friendsList) || friendsList.length === 0) {
    if (onUpdate) onUpdate([]);
    return () => {};
  }

  const unsubs = [];
  const profilesMap = {};

  friendsList.forEach(friend => {
    const uid = friend.uid;
    if (!uid) return;
    try {
      const uRef = doc(db, 'burraco_users', uid);
      const unsub = onSnapshot(uRef, (snap) => {
        if (snap.exists()) {
          profilesMap[uid] = {
            ...friend,
            ...snap.data()
          };
        } else {
          profilesMap[uid] = friend;
        }
        if (onUpdate) onUpdate(Object.values(profilesMap));
      }, (err) => {
        console.warn('Errore listener amico:', uid, err.message);
      });
      unsubs.push(unsub);
    } catch (e) {
      console.warn('Errore subscription amico:', uid, e);
    }
  });

  return () => {
    unsubs.forEach(unsub => unsub());
  };
}


