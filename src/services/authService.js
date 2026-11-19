import { doc, setDoc } from 'firebase/firestore';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  getAdditionalUserInfo,
} from 'firebase/auth';
import {
  db,
  auth,
  OperationType,
  isPermissionOrQuotaError,
  handleFirestoreError,
  clearPublicProfileCache,
} from './firebaseClient';

const googleProvider = new GoogleAuthProvider();
const REDIRECT_FALLBACK_CODES = new Set([
  'auth/popup-blocked',
  'auth/operation-not-supported-in-this-environment',
  'auth/cancelled-popup-request',
]);

/**
 * Rileva se l'app è in esecuzione dentro un iframe (es. preview embedded).
 * Negli iframe signInWithRedirect non è supportato dai browser, quindi si usa sempre popup.
 */
export function isInsideIframe() {
  if (typeof window === 'undefined') return false;
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

/**
 * Rileva iPhone/iPad in modalità PWA standalone (Home Screen), dove WebKit spesso blocca i popup OAuth.
 */
export function isStandaloneIOS() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const isIOS = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isStandalone =
    window.navigator.standalone === true ||
    Boolean(window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
  return Boolean(isIOS && isStandalone);
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

async function finalizeAuthResult(result) {
  const user = result?.user;
  if (!user) return null;

  let isNewUser = false;
  try {
    const additionalInfo = getAdditionalUserInfo(result);
    isNewUser = Boolean(additionalInfo?.isNewUser);
  } catch {
    // fallback
  }

  let wasWelcomed = false;
  try {
    wasWelcomed = typeof localStorage !== 'undefined' && localStorage.getItem('burraco_welcomed_' + user.uid) === 'true';
  } catch {
    // ignore
  }
  user.isFirstLogin = Boolean(isNewUser || !wasWelcomed);

  if (db) {
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
}

/**
 * Risolve un eventuale accesso Google completato tramite signInWithRedirect (usato su iOS PWA standalone).
 */
export async function resolvePendingRedirectLogin() {
  if (!auth) return null;
  try {
    const result = await getRedirectResult(auth);
    if (!result?.user) return null;
    return await finalizeAuthResult(result);
  } catch (err) {
    console.warn('Errore risoluzione redirect Google:', err?.code || err?.message || err);
    throw err;
  }
}

/**
 * Accesso con Account Google:
 * - Usa signInWithPopup come flusso primario (desktop, Android e iframe preview).
 * - Su iOS PWA standalone (fuori da iframe) o se il popup viene bloccato da WebKit,
 *   attiva il fallback affidabile signInWithRedirect.
 */
export async function loginWithGoogle() {
  if (!auth) {
    throw new Error('Accesso con Google non disponibile: configurazione Firebase mancante in questo ambiente.');
  }

  const inIframe = isInsideIframe();
  if (isStandaloneIOS() && !inIframe) {
    await signInWithRedirect(auth, googleProvider);
    return null;
  }

  try {
    const result = await signInWithPopup(auth, googleProvider);
    return await finalizeAuthResult(result);
  } catch (err) {
    if (!inIframe && REDIRECT_FALLBACK_CODES.has(err?.code)) {
      try {
        await signInWithRedirect(auth, googleProvider);
        return null;
      } catch (redirectErr) {
        console.error('Fallback redirect Google fallito:', redirectErr);
        throw redirectErr;
      }
    }
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
    clearPublicProfileCache();
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
      let lastSynced = 0;
      let hasPublicSync = false;
      try {
        lastSynced = Number(sessionStorage.getItem('burraco_last_seen_sync') || 0);
        hasPublicSync = sessionStorage.getItem('burraco_public_profile_synced_v1') === user.uid;
      } catch {
        // ignore
      }
      if (!hasPublicSync || now - lastSynced > 15 * 60 * 1000) {
        try {
          sessionStorage.setItem('burraco_last_seen_sync', String(now));
          sessionStorage.setItem('burraco_public_profile_synced_v1', user.uid);
        } catch {
          // ignore
        }
        try {
          await syncUserProfiles(user, { includeLastLogin: false });
        } catch (err) {
          console.warn('Errore aggiornamento lastSeen/profilo:', err);
        }
      }
    }
  });
}
