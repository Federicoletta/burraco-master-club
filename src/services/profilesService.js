import { doc, getDoc, setDoc } from 'firebase/firestore';
import {
  db,
  auth,
  OperationType,
  isPermissionOrQuotaError,
  handleFirestoreError,
  sanitizeForFirestore,
  getCachedPublicProfile,
  setCachedPublicProfile,
} from './firebaseClient';

/**
 * Recupera in parallelo i profili pubblici degli utenti richiesti utilizzando la cache TTL in memoria
 */
export async function fetchPublicProfilesBatch(uids = []) {
  if (!db || !auth?.currentUser) return new Map();
  const uniqueUids = Array.isArray(uids) ? [...new Set(uids.filter(Boolean))] : [];
  const resultMap = new Map();
  if (uniqueUids.length === 0) return resultMap;

  const now = Date.now();
  const results = await Promise.all(
    uniqueUids.map(async (uid) => {
      const cached = getCachedPublicProfile(uid, now);
      if (cached) return cached;
      try {
        const pubRef = doc(db, 'burraco_public_profiles', uid);
        const snap = await getDoc(pubRef);
        if (snap.exists()) {
          const uData = snap.data();
          setCachedPublicProfile(uid, uData, now);
          return uData;
        }
      } catch (err) {
        console.warn('Errore lettura profilo pubblico uid:', uid, err.message);
      }
      return null;
    })
  );

  results.filter(Boolean).forEach((uData) => {
    if (uData.uid) resultMap.set(uData.uid, uData);
  });
  return resultMap;
}

/**
 * Recupera i profili pubblici degli utenti collegati al tavolo da burraco_public_profiles (zero PII leak)
 */
export async function fetchTablePlayers(uids = [], emails = []) {
  if (!db) return [];
  try {
    const profiles = [];
    const seenUids = new Set();
    const uniqueUids = Array.isArray(uids) ? [...new Set(uids.filter(Boolean))] : [];

    const fetchedMap = await fetchPublicProfilesBatch(uniqueUids);
    fetchedMap.forEach((uData, uid) => {
      if (!seenUids.has(uid)) {
        profiles.push(uData);
        seenUids.add(uid);
      }
    });

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
