import {
  doc,
  setDoc,
  onSnapshot,
  collection,
  deleteDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import {
  db,
  OperationType,
  isPermissionOrQuotaError,
  handleFirestoreError,
  sanitizeForFirestore,
  getDocsWithOrderFallback,
} from './firebaseClient';

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
      status: ['in_progress', 'paused', 'completed'].includes(tournament.status) ? tournament.status : 'in_progress',
      teams: Array.isArray(tournament.teams) ? tournament.teams : [],
      rounds: Array.isArray(tournament.rounds) ? tournament.rounds : [],
      targetScore: Number(tournament.targetScore) || 2505,
      scoringSystem: ['fibur', 'classic'].includes(tournament.scoringSystem) ? tournament.scoringSystem : 'fibur',
      pausedAt: tournament.pausedAt || null,
      resumeDate: tournament.resumeDate ? String(tournament.resumeDate).trim().slice(0, 25) : null,
      resumeNote: tournament.resumeNote ? String(tournament.resumeNote).trim().slice(0, 240) : null,
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
