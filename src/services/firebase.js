import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore,
  initializeFirestore,
  memoryLocalCache,
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  collection, 
  getDocs, 
  deleteDoc,
  serverTimestamp,
  query,
  where,
  limit
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

// Pulisce vecchi frammenti di WebStorage lasciati da precedenti versioni del tab manager su Safari/iOS
if (typeof localStorage !== 'undefined') {
  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith('firestore_') || k.startsWith('firebase:'))) {
        if (k.includes('tab_manager') || k.includes('heartbeat') || k.includes('lease') || k.includes('cache') || k.includes('sequence')) {
          keysToRemove.push(k);
        }
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
  } catch {
    // ignora se localStorage non accessibile
  }
}

try {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  try {
    // Usa memoryLocalCache per evitare completamente errori QuotaExceededError su Safari/iOS/iPadOS
    db = initializeFirestore(app, {
      localCache: memoryLocalCache()
    });
  } catch {
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

    // Registra in background il PIN rapido per ricerca istantanea O(1)
    const rawDigits = (game.id || '').replace(/\D/g, '');
    const shortPin = rawDigits.length >= 6 ? rawDigits.slice(-6) : (game.id || '').slice(-6).toUpperCase();
    if (shortPin && shortPin.length >= 4) {
      registerGamePin(shortPin, game.id).catch(() => {});
    }

    return true;
  } catch (err) {
    console.warn('Errore syncGameToCloud:', err.message);
    return false;
  }
}

/**
 * Registra o aggiorna l'indice rapido del PIN per trovare il tavolo in O(1)
 */
export async function registerGamePin(pin, gameId) {
  if (!db || !pin || !gameId) return false;
  try {
    const cleanPin = String(pin).trim();
    const pinRef = doc(db, 'burraco_pins', cleanPin);
    await setDoc(pinRef, {
      pin: cleanPin,
      gameId: String(gameId).trim(),
      updatedAt: serverTimestamp(),
      createdAt: new Date().toISOString()
    }, { merge: true });
    return true;
  } catch (err) {
    console.warn('[registerGamePin] Avviso:', err.message);
    return false;
  }
}

/**
 * Cerca e recupera una partita nel Cloud per PIN a 6 cifre, ID completo o Link incollato
 */
export async function findGameByPinOrId(pinOrId) {
  if (!db || !pinOrId) return null;
  const input = String(pinOrId).trim();
  
  // 1. Se è un URL completo
  if (input.includes('game=')) {
    try {
      const match = input.match(/game=([a-zA-Z0-9_-]+)/);
      if (match && match[1]) return findGameByPinOrId(match[1]);
    } catch {
      // fallback
    }
  }

  // 2. Lookup rapido O(1) nella collezione burraco_pins
  const cleanDigits = input.replace(/\D/g, '');
  if (cleanDigits.length >= 4 && cleanDigits.length <= 10) {
    try {
      const pinRef = doc(db, 'burraco_pins', cleanDigits);
      const pinSnap = await getDoc(pinRef);
      if (pinSnap.exists()) {
        const pinData = pinSnap.data();
        if (pinData?.gameId) {
          const gameSnap = await getDoc(doc(db, 'burraco_games', pinData.gameId));
          if (gameSnap.exists()) return gameSnap.data();
        }
      }
    } catch (pinErr) {
      console.warn('Avviso lookup rapido burraco_pins:', pinErr);
    }
  }

  // 3. Se è un ID diretto (es. game_1771545600123)
  try {
    const snap = await getDoc(doc(db, 'burraco_games', input));
    if (snap.exists()) return snap.data();
  } catch (err) {
    console.warn('Avviso findGameById:', err);
  }

  // 4. Se l'utente ha inserito l'ID numerico senza prefisso game_
  if (!input.startsWith('game_')) {
    try {
      const snap = await getDoc(doc(db, 'burraco_games', `game_${input}`));
      if (snap.exists()) return snap.data();
    } catch {}
  }

  // 5. Fallback retrocompatibile: scansione partite recenti
  if (cleanDigits.length >= 4) {
    try {
      const q = query(collection(db, 'burraco_games'), limit(30));
      const querySnap = await getDocs(q);
      for (const d of querySnap.docs) {
        if (d.id.endsWith(cleanDigits)) {
          return d.data();
        }
      }
    } catch (err) {
      console.warn('Avviso scansione PIN:', err);
    }
  }

  return null;
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
  if (!db || !currentUser?.uid) return [];
  try {
    const colRef = collection(db, 'burraco_games');
    const gamesMap = new Map();

    try {
      const qOwner = query(colRef, where('ownerUid', '==', currentUser.uid), limit(60));
      const snapOwner = await getDocs(qOwner);
      snapOwner.forEach(docSnap => gamesMap.set(docSnap.id, docSnap.data()));
    } catch (e1) {
      console.warn('Errore query ownerUid:', e1.message);
    }

    try {
      const qPart = query(colRef, where('playerUids', 'array-contains', currentUser.uid), limit(40));
      const snapPart = await getDocs(qPart);
      snapPart.forEach(docSnap => gamesMap.set(docSnap.id, docSnap.data()));
    } catch (e2) {
      console.warn('Errore query playerUids:', e2.message);
    }

    const list = Array.from(gamesMap.values())
      .filter(data => data && data.id && (data.isFinished || (data.rounds && data.rounds.length > 0) || (data.createdAt && (Date.now() - new Date(data.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000))))
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    return list;
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
 * Salva la lista dei partecipanti sul cloud (disattivata: nessun archivio globale di nomi)
 */
export async function syncPlayersToCloud() {
  return true;
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
 * Ascolta in tempo reale le modifiche alla lista partecipanti su Firestore (disattivata: nessun listener globale)
 */
export function subscribeToCloudPlayers() {
  return () => {};
}

/**
 * Ascolta in tempo reale lo storico partite da Firestore con isolamento utente
 */
export function subscribeToCloudGamesHistory(currentUser, onUpdate) {
  if (!db) return () => {};
  try {
    if (!currentUser?.uid) {
      if (onUpdate) onUpdate([]);
      return () => {};
    }

    const colRef = collection(db, 'burraco_games');
    const gamesMap = new Map();

    const emitMerged = () => {
      const list = Array.from(gamesMap.values())
        .filter(data => data && data.id && (data.isFinished || (data.rounds && data.rounds.length > 0) || (data.createdAt && (Date.now() - new Date(data.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000))))
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      if (onUpdate) onUpdate(list);
    };

    // 1. Partite in cui l'utente è proprietario
    const qOwner = query(colRef, where('ownerUid', '==', currentUser.uid), limit(60));
    const unsubOwner = onSnapshot(qOwner, (snapshot) => {
      snapshot.forEach(docSnap => gamesMap.set(docSnap.id, docSnap.data()));
      emitMerged();
    }, (err) => {
      console.warn('Errore listener owner history:', err.message);
    });

    // 2. Partite in cui l'utente è registrato come partecipante
    const qPart = query(colRef, where('playerUids', 'array-contains', currentUser.uid), limit(40));
    const unsubPart = onSnapshot(qPart, (snapshot) => {
      snapshot.forEach(docSnap => gamesMap.set(docSnap.id, docSnap.data()));
      emitMerged();
    }, (err) => {
      console.warn('Errore listener participant history:', err.message);
    });

    return () => {
      unsubOwner();
      unsubPart();
    };
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

// Cache in memoria dei profili utente per evitare query ridondanti a Firestore
const userProfilesCache = new Map();
const USER_PROFILE_CACHE_TTL = 3 * 60 * 1000; // 3 minuti

/**
 * Recupera i profili pubblici degli utenti collegati al tavolo (per UID ed Email) in parallelo con cache
 */
export async function fetchTablePlayers(uids = [], emails = []) {
  if (!db) return [];
  try {
    const profiles = [];
    const seenUids = new Set();
    const seenEmails = new Set();
    const now = Date.now();

    // 1. Risolvi UID in parallelo
    const uniqueUids = Array.isArray(uids) 
      ? [...new Set(uids.filter(Boolean))] 
      : [];

    const uidPromises = uniqueUids.map(async (uid) => {
      const cached = userProfilesCache.get(uid);
      if (cached && (now - cached.timestamp < USER_PROFILE_CACHE_TTL)) {
        return cached.data;
      }
      try {
        const userRef = doc(db, 'burraco_users', uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          const uData = snap.data();
          userProfilesCache.set(uid, { data: uData, timestamp: now });
          if (uData.email) {
            userProfilesCache.set(`email_${uData.email.toLowerCase()}`, { data: uData, timestamp: now });
          }
          return uData;
        }
      } catch (err) {
        console.warn('Errore lettura profilo uid:', uid, err.message);
      }
      return null;
    });

    const uidResults = await Promise.all(uidPromises);
    uidResults.filter(Boolean).forEach(uData => {
      if (!seenUids.has(uData.uid)) {
        profiles.push(uData);
        seenUids.add(uData.uid);
        if (uData.email) seenEmails.add(uData.email.toLowerCase());
      }
    });

    // 2. Risolvi eventuali Email rimanenti non associate agli UID già trovati
    const remainingEmails = (Array.isArray(emails) ? emails : [])
      .map(e => (e || '').toLowerCase().trim())
      .filter(e => e && !seenEmails.has(e));

    if (remainingEmails.length > 0) {
      const emailPromises = [...new Set(remainingEmails)].map(async (cleanEmail) => {
        const cached = userProfilesCache.get(`email_${cleanEmail}`);
        if (cached && (now - cached.timestamp < USER_PROFILE_CACHE_TTL)) {
          return cached.data;
        }
        try {
          const usersRef = collection(db, 'burraco_users');
          const q = query(usersRef, where('email', '==', cleanEmail), limit(1));
          const snap = await getDocs(q);
          if (!snap.empty) {
            const uData = snap.docs[0].data();
            userProfilesCache.set(`email_${cleanEmail}`, { data: uData, timestamp: now });
            if (uData.uid) userProfilesCache.set(uData.uid, { data: uData, timestamp: now });
            return uData;
          }
        } catch {
          // ignore lookup error
        }
        return null;
      });

      const emailResults = await Promise.all(emailPromises);
      emailResults.filter(Boolean).forEach(uData => {
        if (!seenUids.has(uData.uid)) {
          profiles.push(uData);
          seenUids.add(uData.uid);
          if (uData.email) seenEmails.add(uData.email.toLowerCase());
        }
      });
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


