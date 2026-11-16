import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  initializeFirestore,
  memoryLocalCache,
  doc,
  getDocFromServer,
  setDoc,
  getDoc,
  onSnapshot,
  collection,
  getDocs,
  deleteDoc,
  runTransaction,
  serverTimestamp,
  query,
  where,
  orderBy,
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
import appletFirebaseConfig from '../../firebase-applet-config.json';

const rawEnvDbId = import.meta.env?.VITE_FIREBASE_DATABASE_ID;
const hasEnvProject = Boolean(import.meta.env?.VITE_FIREBASE_PROJECT_ID);
const resolvedDatabaseId = rawEnvDbId !== undefined && rawEnvDbId !== ''
  ? (rawEnvDbId === '(default)' ? '' : rawEnvDbId)
  : (hasEnvProject ? '' : (appletFirebaseConfig?.firestoreDatabaseId || ''));

// Configurazione Firebase: dà priorità alle variabili d'ambiente (.env) con fallback a firebase-applet-config.json
const firebaseConfig = {
  projectId: import.meta.env?.VITE_FIREBASE_PROJECT_ID || appletFirebaseConfig?.projectId || '',
  appId: import.meta.env?.VITE_FIREBASE_APP_ID || appletFirebaseConfig?.appId || '',
  storageBucket: import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET || appletFirebaseConfig?.storageBucket || '',
  apiKey: import.meta.env?.VITE_FIREBASE_API_KEY || appletFirebaseConfig?.apiKey || '',
  authDomain: import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN || appletFirebaseConfig?.authDomain || '',
  messagingSenderId: import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID || appletFirebaseConfig?.messagingSenderId || '',
  projectNumber: import.meta.env?.VITE_FIREBASE_PROJECT_NUMBER || '',
  firestoreDatabaseId: resolvedDatabaseId,
};

let app = null;
let db = null;
let auth = null;
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

if (firebaseConfig.apiKey && firebaseConfig.projectId) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    const databaseId = firebaseConfig.firestoreDatabaseId || undefined;
    try {
      // Usa memoryLocalCache per evitare completamente errori QuotaExceededError su Safari/iOS/iPadOS
      db = databaseId
        ? initializeFirestore(app, { localCache: memoryLocalCache() }, databaseId)
        : initializeFirestore(app, { localCache: memoryLocalCache() });
    } catch {
      db = databaseId ? getFirestore(app, databaseId) : getFirestore(app);
    }
    auth = getAuth(app);

    if (typeof window !== 'undefined' && db) {
      getDocFromServer(doc(db, 'test', 'connection')).catch((error) => {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error('Verifica la configurazione Firebase: il client risulta offline.');
        }
      });
    }
  } catch (err) {
    console.error('Firebase initialization error:', err);
  }
} else {
  console.warn('[Firebase] Variabili VITE_FIREBASE_* non configurate: esecuzione in modalità locale/offline.');
}

export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

export { db, auth };

export const OperationType = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  LIST: 'list',
  GET: 'get',
  WRITE: 'write',
};

export function isPermissionOrQuotaError(error) {
  const code = error?.code || '';
  const msg = (error?.message || '').toLowerCase();
  return (
    code === 'permission-denied' ||
    code === 'resource-exhausted' ||
    msg.includes('missing or insufficient permissions') ||
    msg.includes('quota exceeded')
  );
}

export function isIndexMissingError(error) {
  const code = error?.code || '';
  const msg = (error?.message || '').toLowerCase();
  return code === 'failed-precondition' || msg.includes('requires an index');
}

export function handleFirestoreError(error, operationType, path = null) {
  const user = auth?.currentUser || null;
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
    authInfo: {
      userId: user?.uid ?? null,
      email: user?.email ?? null,
      emailVerified: user?.emailVerified ?? null,
      isAnonymous: user?.isAnonymous ?? null,
      tenantId: user?.tenantId ?? null,
      providerInfo: Array.isArray(user?.providerData)
        ? user.providerData.map(provider => ({
            providerId: provider?.providerId ?? null,
            email: provider?.email ?? null,
          }))
        : [],
    },
  };
  const serialized = JSON.stringify(errInfo);
  console.error('Firestore Error: ', serialized);
  throw new Error(serialized);
}

export function computeGameShortPin(gameId) {
  if (!gameId) return '';
  const rawDigits = String(gameId).replace(/\D/g, '');
  return rawDigits.length >= 6 ? rawDigits.slice(-6) : String(gameId).slice(-6).toUpperCase();
}

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
 * Sincronizza profilo privato (burraco_users) e directory pubblica senza PII (burraco_public_profiles)
 */
async function syncUserProfiles(user, { includeLastLogin = false } = {}) {
  if (!db || !user?.uid) return;
  const nowIso = new Date().toISOString();
  const displayName = (user.displayName || 'Giocatore Burraco').trim().slice(0, 100) || 'Giocatore Burraco';

  const privatePayload = {
    uid: user.uid,
    displayName,
    email: (user.email || '').toLowerCase(),
    photoURL: user.photoURL || null,
    lastSeen: nowIso,
  };
  if (includeLastLogin) {
    privatePayload.lastLogin = nowIso;
  }

  const publicPayload = {
    uid: user.uid,
    displayName,
    displayNameLower: displayName.toLowerCase(),
    photoURL: user.photoURL || null,
    lastSeen: nowIso,
    updatedAt: nowIso,
  };

  await Promise.all([
    setDoc(doc(db, 'burraco_users', user.uid), privatePayload, { merge: true }),
    setDoc(doc(db, 'burraco_public_profiles', user.uid), publicPayload, { merge: true }),
  ]);
}

/**
 * Accesso con Account Google (Popup)
 */
export async function loginWithGoogle() {
  if (!auth) {
    throw new Error('Accesso con Google non disponibile: configurazione Firebase mancante in questo ambiente.');
  }
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

    // Registra/aggiorna profilo privato e profilo pubblico su Firestore
    if (db && user) {
      try {
        await syncUserProfiles(user, { includeLastLogin: true });
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem('burraco_last_seen_sync', String(Date.now()));
          sessionStorage.setItem('burraco_public_profile_synced_v1', user.uid);
        }
      } catch (firestoreErr) {
        if (isPermissionOrQuotaError(firestoreErr)) {
          handleFirestoreError(firestoreErr, OperationType.WRITE, `burraco_users/${user.uid}`);
        }
        console.warn('Avviso: impossibile salvare profilo su Firestore (offline):', firestoreErr);
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
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('burraco_last_seen_sync');
      sessionStorage.removeItem('burraco_public_profile_synced_v1');
    }
    userProfilesCache.clear();
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
      const hasPublicSync = sessionStorage.getItem('burraco_public_profile_synced_v1') === user.uid;
      if (!hasPublicSync || now - lastSynced > 15 * 60 * 1000) {
        sessionStorage.setItem('burraco_last_seen_sync', String(now));
        sessionStorage.setItem('burraco_public_profile_synced_v1', user.uid);
        try {
          await syncUserProfiles(user, { includeLastLogin: false });
        } catch (err) {
          console.warn('Errore aggiornamento lastSeen/profilo:', err);
        }
      }
    }
  });
}

// Cache in memoria per evitare riscritture ripetitive di burraco_pins (preserva createdAt e risparmia scritture)
const registeredPinsCache = new Set();

/**
 * Registra o aggiorna l'indice rapido del PIN per trovare il tavolo in O(1) senza sovrascrivere createdAt
 */
export async function registerGamePin(pin, gameId, createdAt = null) {
  if (!db || !pin || !gameId) return false;
  const cleanPin = String(pin).trim();
  const cleanGameId = String(gameId).trim();
  if (!cleanPin || !cleanGameId) return false;

  const cacheKey = `${cleanPin}:${cleanGameId}`;
  if (registeredPinsCache.has(cacheKey)) {
    return true;
  }

  const pinPath = `burraco_pins/${cleanPin}`;
  try {
    const pinRef = doc(db, 'burraco_pins', cleanPin);
    const existingSnap = await getDoc(pinRef);
    if (existingSnap.exists()) {
      const existingData = existingSnap.data();
      if (existingData?.gameId === cleanGameId) {
        registeredPinsCache.add(cacheKey);
        return true;
      }
    }

    await setDoc(pinRef, {
      pin: cleanPin,
      gameId: cleanGameId,
      updatedAt: serverTimestamp(),
      createdAt: createdAt || new Date().toISOString()
    }, { merge: true });
    registeredPinsCache.add(cacheKey);
    return true;
  } catch (err) {
    if (isPermissionOrQuotaError(err)) {
      handleFirestoreError(err, OperationType.WRITE, pinPath);
    }
    console.warn('[registerGamePin] Avviso:', err.message);
    return false;
  }
}

/**
 * Salva o aggiorna una partita nel cloud database Firestore con tracciamento proprietario
 * Con protezione salvaguardia multi-dispositivo contro sovrascritture di mani perse
 */
export async function syncGameToCloud(game, currentUser = null, force = false) {
  if (!db || !game?.id) {
    console.warn('[syncGameToCloud] Impossibile sincronizzare: db o game.id mancante:', { hasDb: Boolean(db), id: game?.id });
    return false;
  }
  const gamePath = `burraco_games/${game.id}`;
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

    const cleanTeam = (team, fallbackName) => {
      if (!team || typeof team !== 'object') return { name: fallbackName, players: [] };
      const cleaned = {
        name: String(team.name || fallbackName).trim().slice(0, 100) || fallbackName,
        players: Array.isArray(team.players)
          ? team.players.map(p => String(p || '').trim().slice(0, 100)).filter(Boolean)
          : []
      };
      if (team.id) cleaned.id = String(team.id).slice(0, 100);
      return cleaned;
    };

    const playerUids = Array.isArray(game.playerUids) ? [...game.playerUids] : [];
    if (currentUser?.uid && !playerUids.includes(currentUser.uid)) {
      playerUids.push(currentUser.uid);
    }
    const playerEmails = Array.isArray(game.playerEmails) ? [...game.playerEmails] : [];
    if (currentUser?.email && !playerEmails.includes(currentUser.email)) {
      playerEmails.push(currentUser.email);
    }

    const cleanRounds = (Array.isArray(game.rounds) ? game.rounds : []).map(r => ({ ...r }));

    // Whitelist rigorosa per rispettare firestore.rules (hasOnly allowedFields)
    const allowedGameData = {
      id: String(game.id),
      mode: ['pairs', 'singles', 'trio'].includes(game.mode) ? game.mode : 'pairs',
      allowSemipulito: Boolean(game.allowSemipulito ?? true),
      targetScore: Number(game.targetScore) || 2005,
      team1: cleanTeam(game.team1, 'Coppia 1'),
      team2: cleanTeam(game.team2, 'Coppia 2'),
      rounds: cleanRounds,
      isFinished: Boolean(game.isFinished),
      tableClosed: Boolean(game.tableClosed),
      ownerUid: game.ownerUid !== undefined ? (game.ownerUid || null) : (currentUser?.uid || null),
      ownerEmail: game.ownerEmail !== undefined ? (game.ownerEmail || null) : (currentUser?.email || null),
      ownerName: game.ownerName !== undefined ? (game.ownerName || null) : (currentUser?.displayName || null),
      playerUids: playerUids.slice(0, 10),
      playerEmails: playerEmails.slice(0, 10),
      updatedAt: serverTimestamp(),
    };

    if (game.mode === 'trio' || game.team3) {
      allowedGameData.team3 = cleanTeam(game.team3, 'Giocatore 3');
    }

    if (game.winner) allowedGameData.winner = game.winner;
    if (game.createdAt) allowedGameData.createdAt = game.createdAt;
    if (game.completedAt) allowedGameData.completedAt = game.completedAt;

    if (game.tournamentId) allowedGameData.tournamentId = String(game.tournamentId).slice(0, 100);
    if (game.tournamentName) allowedGameData.tournamentName = String(game.tournamentName).slice(0, 100);
    if (game.tournamentMatchId) allowedGameData.tournamentMatchId = String(game.tournamentMatchId).slice(0, 100);
    if (typeof game.tournamentRoundNumber === 'number') allowedGameData.tournamentRoundNumber = game.tournamentRoundNumber;
    if (typeof game.tournamentTableNumber === 'number') allowedGameData.tournamentTableNumber = game.tournamentTableNumber;

    if (Array.isArray(game.ledgerChain)) {
      allowedGameData.ledgerChain = game.ledgerChain.slice(-200);
      allowedGameData.ledgerChainLength = game.ledgerChain.length;
    } else if (typeof game.ledgerChainLength === 'number') {
      allowedGameData.ledgerChainLength = game.ledgerChainLength;
    }

    if (game.ledgerLastHash) {
      allowedGameData.ledgerLastHash = String(game.ledgerLastHash).slice(0, 64);
    }

    if (game.telemetry && typeof game.telemetry === 'object') {
      allowedGameData.telemetry = game.telemetry;
    }

    const payload = sanitizeForFirestore(allowedGameData);
    await setDoc(gameRef, payload, { merge: true });

    // Registra in background il PIN rapido per ricerca istantanea O(1) preservando createdAt
    const shortPin = computeGameShortPin(game.id);
    if (shortPin && shortPin.length >= 4) {
      registerGamePin(shortPin, game.id, game.createdAt || null).catch(() => {});
    }

    return true;
  } catch (err) {
    if (isPermissionOrQuotaError(err)) {
      handleFirestoreError(err, OperationType.WRITE, gamePath);
    }
    console.error('[syncGameToCloud] Errore salvataggio Firestore:', err?.code, err?.message, err);
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
    } catch {
      // ignore
    }
  }

  // 5. Fallback retrocompatibile sulle partite proprie (se autenticato)
  if (cleanDigits.length >= 4 && auth?.currentUser?.uid) {
    try {
      const colRef = collection(db, 'burraco_games');
      let querySnap;
      try {
        const orderedQuery = query(
          colRef,
          where('ownerUid', '==', auth.currentUser.uid),
          orderBy('createdAt', 'desc'),
          limit(30)
        );
        querySnap = await getDocs(orderedQuery);
      } catch {
        const fallbackQuery = query(
          colRef,
          where('ownerUid', '==', auth.currentUser.uid),
          limit(30)
        );
        querySnap = await getDocs(fallbackQuery);
      }
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
  const gamePath = `burraco_games/${gameId}`;
  try {
    const gameRef = doc(db, 'burraco_games', gameId);
    return onSnapshot(gameRef, (docSnap) => {
      if (docSnap.exists()) {
        onUpdate(docSnap.data());
      } else if (onNotFound) {
        onNotFound();
      }
    }, (err) => {
      if (isPermissionOrQuotaError(err)) {
        handleFirestoreError(err, OperationType.GET, gamePath);
      }
      console.warn('Errore listener Firestore:', err.message);
    });
  } catch (err) {
    console.warn('subscribeToCloudGame error:', err);
    return () => {};
  }
}

async function getDocsWithOrderFallback(orderedQuery, fallbackQuery, path) {
  try {
    return await getDocs(orderedQuery);
  } catch (err) {
    if (isIndexMissingError(err)) {
      return await getDocs(fallbackQuery);
    }
    if (isPermissionOrQuotaError(err)) {
      handleFirestoreError(err, OperationType.LIST, path);
    }
    throw err;
  }
}

/**
 * Carica le partite archiviate dal cloud per l'utente specificato (ordinate per data decrescente)
 */
export async function loadCloudGamesHistory(currentUser = null) {
  if (!db || !currentUser?.uid) return [];
  try {
    const colRef = collection(db, 'burraco_games');
    const gamesMap = new Map();

    try {
      const snapOwner = await getDocsWithOrderFallback(
        query(colRef, where('ownerUid', '==', currentUser.uid), orderBy('createdAt', 'desc'), limit(60)),
        query(colRef, where('ownerUid', '==', currentUser.uid), limit(60)),
        'burraco_games'
      );
      snapOwner.forEach(docSnap => gamesMap.set(docSnap.id, docSnap.data()));
    } catch (e1) {
      console.warn('Errore query ownerUid:', e1.message);
    }

    try {
      const snapPart = await getDocsWithOrderFallback(
        query(colRef, where('playerUids', 'array-contains', currentUser.uid), orderBy('createdAt', 'desc'), limit(40)),
        query(colRef, where('playerUids', 'array-contains', currentUser.uid), limit(40)),
        'burraco_games'
      );
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
 * Elimina una partita archiviata da Firestore e pulisce l'eventuale PIN orfano in burraco_pins
 */
export async function deleteGameFromCloud(gameId) {
  if (!db || !gameId) return false;
  const gamePath = `burraco_games/${gameId}`;
  try {
    const shortPin = computeGameShortPin(gameId);
    if (shortPin && shortPin.length >= 4) {
      try {
        const pinRef = doc(db, 'burraco_pins', shortPin);
        const pinSnap = await getDoc(pinRef);
        if (pinSnap.exists() && pinSnap.data()?.gameId === gameId) {
          await deleteDoc(pinRef);
        }
        registeredPinsCache.delete(`${shortPin}:${gameId}`);
      } catch (pinErr) {
        console.warn('Avviso rimozione PIN orfano:', pinErr?.message);
      }
    }

    const gameRef = doc(db, 'burraco_games', gameId);
    await deleteDoc(gameRef);
    return true;
  } catch (err) {
    if (isPermissionOrQuotaError(err)) {
      handleFirestoreError(err, OperationType.DELETE, gamePath);
    }
    console.warn('Errore deleteGameFromCloud:', err.message);
    return false;
  }
}

function subscribeWithOrderFallback(orderedQ, fallbackQ, onData, path) {
  let activeUnsub = () => {};
  let unsubscribed = false;

  const attach = (qToUse, allowFallback) => {
    activeUnsub = onSnapshot(qToUse, onData, (err) => {
      if (unsubscribed) return;
      if (allowFallback && isIndexMissingError(err)) {
        activeUnsub();
        attach(fallbackQ, false);
        return;
      }
      if (isPermissionOrQuotaError(err)) {
        handleFirestoreError(err, OperationType.LIST, path);
      }
      console.warn('Errore listener history:', err.message);
    });
  };

  attach(orderedQ, true);

  return () => {
    unsubscribed = true;
    activeUnsub();
  };
}

/**
 * Ascolta in tempo reale lo storico partite da Firestore con isolamento utente e propagazione eliminazioni
 */
export function subscribeToCloudGamesHistory(currentUser, onUpdate) {
  if (!db) return () => {};
  try {
    if (!currentUser?.uid) {
      if (onUpdate) onUpdate([]);
      return () => {};
    }

    const colRef = collection(db, 'burraco_games');
    let ownerMap = new Map();
    let partMap = new Map();

    const emitMerged = () => {
      const merged = new Map();
      partMap.forEach((val, key) => merged.set(key, val));
      ownerMap.forEach((val, key) => merged.set(key, val));

      const list = Array.from(merged.values())
        .filter(data => data && data.id && (data.isFinished || (data.rounds && data.rounds.length > 0) || (data.createdAt && (Date.now() - new Date(data.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000))))
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      if (onUpdate) onUpdate(list);
    };

    const unsubOwner = subscribeWithOrderFallback(
      query(colRef, where('ownerUid', '==', currentUser.uid), orderBy('createdAt', 'desc'), limit(60)),
      query(colRef, where('ownerUid', '==', currentUser.uid), limit(60)),
      (snapshot) => {
        const nextOwner = new Map();
        snapshot.forEach(docSnap => nextOwner.set(docSnap.id, docSnap.data()));
        ownerMap = nextOwner;
        emitMerged();
      },
      'burraco_games'
    );

    const unsubPart = subscribeWithOrderFallback(
      query(colRef, where('playerUids', 'array-contains', currentUser.uid), orderBy('createdAt', 'desc'), limit(40)),
      query(colRef, where('playerUids', 'array-contains', currentUser.uid), limit(40)),
      (snapshot) => {
        const nextPart = new Map();
        snapshot.forEach(docSnap => nextPart.set(docSnap.id, docSnap.data()));
        partMap = nextPart;
        emitMerged();
      },
      'burraco_games'
    );

    return () => {
      unsubOwner();
      unsubPart();
    };
  } catch (err) {
    console.warn('subscribeToCloudGamesHistory error:', err);
    return () => {};
  }
}

// ==========================================
// METODI SINCRONIZZAZIONE TORNEI CLOUD
// ==========================================

/**
 * Salva o aggiorna un torneo nel cloud database Firestore
 */
export async function syncTournamentToCloud(tournament, currentUser = null) {
  if (!db || !tournament?.id) return false;
  const path = `burraco_tournaments/${tournament.id}`;
  try {
    const tournamentRef = doc(db, 'burraco_tournaments', tournament.id);
    const allowedTournamentData = {
      id: String(tournament.id),
      name: String(tournament.name || 'Torneo Burraco').trim().slice(0, 100),
      status: ['in_progress', 'completed'].includes(tournament.status) ? tournament.status : 'in_progress',
      teams: Array.isArray(tournament.teams) ? tournament.teams : [],
      rounds: Array.isArray(tournament.rounds) ? tournament.rounds : [],
      targetScore: Number(tournament.targetScore) || 2505,
      scoringSystem: ['fibur', 'classic'].includes(tournament.scoringSystem) ? tournament.scoringSystem : 'fibur',
      createdAt: tournament.createdAt || null,
      completedAt: tournament.completedAt || null,
      ownerUid: tournament.ownerUid !== undefined ? tournament.ownerUid : (currentUser?.uid || null),
      ownerEmail: tournament.ownerEmail !== undefined ? tournament.ownerEmail : (currentUser?.email || null),
      ownerName: tournament.ownerName !== undefined ? tournament.ownerName : (currentUser?.displayName || null),
      updatedAt: serverTimestamp(),
    };
    const payload = sanitizeForFirestore(allowedTournamentData);
    await setDoc(tournamentRef, payload, { merge: true });
    return true;
  } catch (err) {
    if (isPermissionOrQuotaError(err)) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
    console.warn('Errore syncTournamentToCloud:', err.message);
    return false;
  }
}

/**
 * Ascolta in tempo reale le modifiche del torneo attivo
 */
export function subscribeToCloudTournament(tournamentId, onUpdate) {
  if (!db || !tournamentId) return () => {};
  const path = `burraco_tournaments/${tournamentId}`;
  try {
    const tournamentRef = doc(db, 'burraco_tournaments', tournamentId);
    return onSnapshot(tournamentRef, (docSnap) => {
      if (docSnap.exists()) {
        onUpdate(docSnap.data());
      }
    }, (err) => {
      if (isPermissionOrQuotaError(err)) {
        handleFirestoreError(err, OperationType.GET, path);
      }
      console.warn('Errore listener Firestore tournament:', err.message);
    });
  } catch (err) {
    console.warn('subscribeToCloudTournament error:', err);
    return () => {};
  }
}

/**
 * Carica lo storico tornei dal cloud filtrato per l'organizzatore autenticato
 */
export async function loadCloudTournamentsHistory(currentUser = null) {
  if (!db || !currentUser?.uid) return [];
  try {
    const colRef = collection(db, 'burraco_tournaments');
    const snapshot = await getDocsWithOrderFallback(
      query(colRef, where('ownerUid', '==', currentUser.uid), orderBy('createdAt', 'desc'), limit(40)),
      query(colRef, where('ownerUid', '==', currentUser.uid), limit(40)),
      'burraco_tournaments'
    );
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
  const path = `burraco_tournaments/${tournamentId}`;
  try {
    const tournamentRef = doc(db, 'burraco_tournaments', tournamentId);
    await deleteDoc(tournamentRef);
    return true;
  } catch (err) {
    if (isPermissionOrQuotaError(err)) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
    console.warn('Errore deleteTournamentFromCloud:', err.message);
    return false;
  }
}

/**
 * Registra in modo atomico (runTransaction) la presenza dell'utente autenticato nella partita cloud
 */
export async function joinCloudGame(gameId, currentUser) {
  if (!db || !gameId || !currentUser?.uid) return;
  const gamePath = `burraco_games/${gameId}`;
  try {
    const gameRef = doc(db, 'burraco_games', gameId);
    const userEmail = (currentUser.email || '').trim().toLowerCase();

    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(gameRef);
      if (!snap.exists()) return;

      const data = snap.data();
      const currentUids = Array.isArray(data.playerUids) ? data.playerUids : [];
      const currentEmails = Array.isArray(data.playerEmails) ? data.playerEmails : [];

      const needsUid = !currentUids.includes(currentUser.uid);
      const needsEmail = Boolean(userEmail) && !currentEmails.includes(userEmail);

      if (!needsUid && !needsEmail) return;

      const updatedUids = needsUid ? [...currentUids, currentUser.uid].slice(0, 10) : currentUids.slice(0, 10);
      const updatedEmails = needsEmail ? [...currentEmails, userEmail].slice(0, 10) : currentEmails.slice(0, 10);

      transaction.set(gameRef, {
        playerUids: updatedUids,
        playerEmails: updatedEmails,
        updatedAt: serverTimestamp()
      }, { merge: true });
    });
  } catch (err) {
    if (isPermissionOrQuotaError(err)) {
      handleFirestoreError(err, OperationType.UPDATE, gamePath);
    }
    console.warn('Errore joinCloudGame:', err.message);
  }
}

// Cache in memoria dei profili pubblici utente per evitare query ridondanti a Firestore
const userProfilesCache = new Map();
const USER_PROFILE_CACHE_TTL = 3 * 60 * 1000; // 3 minuti

/**
 * Recupera i profili pubblici degli utenti collegati al tavolo da burraco_public_profiles (zero PII leak)
 */
export async function fetchTablePlayers(uids = [], emails = []) {
  if (!db) return [];
  try {
    const profiles = [];
    const seenUids = new Set();
    const now = Date.now();

    const uniqueUids = Array.isArray(uids)
      ? [...new Set(uids.filter(Boolean))]
      : [];

    if (auth?.currentUser) {
      const uidPromises = uniqueUids.map(async (uid) => {
        const cached = userProfilesCache.get(uid);
        if (cached && (now - cached.timestamp < USER_PROFILE_CACHE_TTL)) {
          return cached.data;
        }
        try {
          const pubRef = doc(db, 'burraco_public_profiles', uid);
          const snap = await getDoc(pubRef);
          if (snap.exists()) {
            const uData = snap.data();
            userProfilesCache.set(uid, { data: uData, timestamp: now });
            return uData;
          }
        } catch (err) {
          console.warn('Errore lettura profilo pubblico uid:', uid, err.message);
        }
        return null;
      });

      const uidResults = await Promise.all(uidPromises);
      uidResults.filter(Boolean).forEach(uData => {
        if (!seenUids.has(uData.uid)) {
          profiles.push(uData);
          seenUids.add(uData.uid);
        }
      });
    }

    // Assicura che eventuali partecipanti non ancora su burraco_public_profiles abbiano comunque un entry visiva dal contesto del tavolo
    const canMatchEmailByIndex = Array.isArray(emails) && emails.length === uniqueUids.length;
    uniqueUids.forEach((uid, idx) => {
      if (!seenUids.has(uid)) {
        const fallbackEmail = canMatchEmailByIndex && emails[idx] ? String(emails[idx]).toLowerCase() : null;
        profiles.push({
          uid,
          displayName: fallbackEmail ? fallbackEmail.split('@')[0] : 'Giocatore al Tavolo',
          email: fallbackEmail,
          photoURL: null
        });
        seenUids.add(uid);
      }
    });

    return profiles;
  } catch (err) {
    console.warn('Errore fetchTablePlayers:', err.message);
    return [];
  }
}

/**
 * Salva o aggiorna le statistiche globali di carriera dell'utente sul profilo privato e pubblico
 */
export async function updateUserCareerStats(userId, stats) {
  if (!db || !userId || !stats) return false;
  const path = `burraco_users/${userId}`;
  try {
    const careerStatsPayload = sanitizeForFirestore({
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

    const userRef = doc(db, 'burraco_users', userId);
    const pubRef = doc(db, 'burraco_public_profiles', userId);

    const fallbackName = (auth?.currentUser?.uid === userId && auth?.currentUser?.displayName)
      ? auth.currentUser.displayName.trim().slice(0, 100)
      : 'Giocatore Burraco';

    await Promise.all([
      setDoc(userRef, careerStatsPayload, { merge: true }),
      setDoc(pubRef, {
        uid: userId,
        displayName: fallbackName,
        displayNameLower: fallbackName.toLowerCase(),
        ...careerStatsPayload,
        updatedAt: new Date().toISOString(),
      }, { merge: true }),
    ]);
    return true;
  } catch (err) {
    if (isPermissionOrQuotaError(err)) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
    console.warn('Errore updateUserCareerStats:', err.message);
    return false;
  }
}
