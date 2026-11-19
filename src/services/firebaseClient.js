import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  initializeFirestore,
  memoryLocalCache,
  doc,
  getDocFromServer,
  getDocs,
  onSnapshot,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
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
 * rimuovendo campi `undefined` e mantenendo integri FieldValue, Date e primitivi.
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

export async function getDocsWithOrderFallback(orderedQuery, fallbackQuery, path) {
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

export function subscribeWithOrderFallback(orderedQ, fallbackQ, onData, path, onError = null) {
  let activeUnsub = () => {};
  let unsubscribed = false;

  const safeUnsub = () => {
    try {
      activeUnsub();
    } catch {
      // ignore double unsubscribe
    }
    activeUnsub = () => {};
  };

  const attach = (qToUse, allowFallback) => {
    if (unsubscribed) return;
    const unsub = onSnapshot(
      qToUse,
      (snapshot) => {
        if (unsubscribed) return;
        onData(snapshot);
      },
      (err) => {
        if (unsubscribed) return;
        if (allowFallback && isIndexMissingError(err)) {
          safeUnsub();
          attach(fallbackQ, false);
          return;
        }
        if (typeof onError === 'function') {
          onError(err);
        }
        if (isPermissionOrQuotaError(err)) {
          handleFirestoreError(err, OperationType.LIST, path);
        }
        console.warn('Errore listener Firestore:', err.message);
      }
    );
    if (unsubscribed) {
      try {
        unsub();
      } catch {
        // ignore
      }
    } else {
      activeUnsub = unsub;
    }
  };

  attach(orderedQ, true);

  return () => {
    unsubscribed = true;
    safeUnsub();
  };
}

// Cache in memoria condivisa dei profili pubblici utente (TTL 3 minuti)
const userProfilesCache = new Map();
const USER_PROFILE_CACHE_TTL = 3 * 60 * 1000;

export function getCachedPublicProfile(uid, now = Date.now()) {
  const cached = userProfilesCache.get(uid);
  if (cached && (now - cached.timestamp < USER_PROFILE_CACHE_TTL)) {
    return cached.data;
  }
  return null;
}

export function setCachedPublicProfile(uid, data, now = Date.now()) {
  if (uid && data) {
    userProfilesCache.set(uid, { data, timestamp: now });
  }
}

export function clearPublicProfileCache() {
  userProfilesCache.clear();
}
