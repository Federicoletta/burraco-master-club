import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  collection, 
  getDocs, 
  deleteDoc,
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
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
  db = getFirestore(app);
  auth = getAuth(app);
} catch (err) {
  console.error('Firebase initialization error:', err);
}

export { db, auth };

/**
 * Accesso con Account Google (Popup)
 */
export async function loginWithGoogle() {
  if (!auth) throw new Error('Firebase Auth non inizializzato');
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result?.user;
    // Registra/aggiorna il profilo utente su Firestore in background
    if (db && user) {
      try {
        const userRef = doc(db, 'burraco_users', user.uid);
        await setDoc(userRef, {
          uid: user.uid,
          displayName: user.displayName || 'Giocatore Burraco',
          email: user.email || '',
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
      // Aggiorna ultimo accesso garantendo tutti i campi richiesti dalle regole
      try {
        const userRef = doc(db, 'burraco_users', user.uid);
        await setDoc(userRef, {
          uid: user.uid,
          displayName: user.displayName || 'Giocatore Burraco',
          email: user.email || '',
          photoURL: user.photoURL || null,
          lastSeen: new Date().toISOString()
        }, { merge: true });
      } catch (err) {
        console.warn('Errore aggiornamento lastSeen:', err);
      }
    }
  });
}

/**
 * Salva o aggiorna una partita nel cloud database Firestore con tracciamento proprietario
 */
export async function syncGameToCloud(game, currentUser = null) {
  if (!db || !game?.id) return false;
  try {
    const gameRef = doc(db, 'burraco_games', game.id);
    const payload = {
      ...game,
      ownerUid: game.ownerUid !== undefined ? game.ownerUid : (currentUser?.uid || null),
      ownerEmail: game.ownerEmail !== undefined ? game.ownerEmail : (currentUser?.email || null),
      ownerName: game.ownerName !== undefined ? game.ownerName : (currentUser?.displayName || null),
      playerUids: Array.isArray(game.playerUids) ? game.playerUids : (currentUser?.uid ? [currentUser.uid] : []),
      playerEmails: Array.isArray(game.playerEmails) ? game.playerEmails : (currentUser?.email ? [currentUser.email] : []),
      updatedAt: serverTimestamp(),
    };
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
        if (!currentUser) {
          // Se non autenticato, carica solo partite locali/senza owner
          if (!data.ownerUid) games.push(data);
        } else {
          // Se autenticato, solo le partite dell'utente o in cui è invitato
          const isMine = data.ownerUid === currentUser.uid ||
            (Array.isArray(data.playerUids) && data.playerUids.includes(currentUser.uid)) ||
            (currentUser.email && Array.isArray(data.playerEmails) && data.playerEmails.includes(currentUser.email));
          if (isMine) games.push(data);
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
          if (!currentUser) {
            // Modalità anonima / ospite: solo partite locali o senza owner
            if (!data.ownerUid) games.push(data);
          } else {
            // Modalità autenticata: mostra solo le partite appartenenti a questo utente
            const isMine = data.ownerUid === currentUser.uid ||
              (Array.isArray(data.playerUids) && data.playerUids.includes(currentUser.uid)) ||
              (currentUser.email && Array.isArray(data.playerEmails) && data.playerEmails.includes(currentUser.email));
            if (isMine) games.push(data);
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
 * Esegue la pulizia delle vecchie partite legacy e della vecchia rubrica globale
 */
export async function cleanupLegacyCloudDatabase() {
  if (!db) return false;
  try {
    const snapshot = await getDocs(collection(db, 'burraco_games'));
    const deletePromises = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      if (!data?.ownerUid) {
        deletePromises.push(deleteDoc(doc(db, 'burraco_games', docSnap.id)));
      }
    });
    await Promise.all(deletePromises);

    // Resetta la vecchia lista globale di burraco_meta/players
    const metaRef = doc(db, 'burraco_meta', 'players');
    await setDoc(metaRef, { list: [], updatedAt: serverTimestamp() }, { merge: true });

    // Rimuove chiavi locali obsolete
    localStorage.removeItem('burraco_history_v1');
    localStorage.removeItem('burraco_players_v1');
    localStorage.removeItem('burraco_active_game_v1');

    return true;
  } catch (err) {
    console.error('Errore durante pulizia legacy cloud database:', err);
    return false;
  }
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
    await setDoc(tournamentRef, {
      ...tournament,
      updatedAt: serverTimestamp(),
    }, { merge: true });
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
        } catch (e) {
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


