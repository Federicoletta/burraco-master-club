import { doc, setDoc } from 'firebase/firestore';
import {
  GoogleAuthProvider,
  signInWithPopup,
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
