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
  serverTimestamp 
} from 'firebase/firestore';

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

try {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  db = getFirestore(app);
} catch (err) {
  console.error('Firebase initialization error:', err);
}

export { db };

/**
 * Salva o aggiorna una partita nel cloud database Firestore
 */
export async function syncGameToCloud(game) {
  if (!db || !game?.id) return false;
  try {
    const gameRef = doc(db, 'burraco_games', game.id);
    await setDoc(gameRef, {
      ...game,
      updatedAt: serverTimestamp(),
    }, { merge: true });
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
 * Carica tutte le partite archiviate dal cloud
 */
export async function loadCloudGamesHistory() {
  if (!db) return [];
  try {
    const snapshot = await getDocs(collection(db, 'burraco_games'));
    const games = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data && data.id && data.isFinished) {
        games.push(data);
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
 * Salva la lista dei partecipanti sul cloud
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
 * Ascolta in tempo reale le modifiche alla lista partecipanti su Firestore
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
 * Ascolta in tempo reale lo storico partite da Firestore
 */
export function subscribeToCloudGamesHistory(onUpdate) {
  if (!db) return () => {};
  try {
    const colRef = collection(db, 'burraco_games');
    return onSnapshot(colRef, (snapshot) => {
      const games = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        if (data && data.id && data.isFinished) {
          games.push(data);
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


