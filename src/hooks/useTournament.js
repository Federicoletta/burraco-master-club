import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  getActiveTournament,
  saveActiveTournament,
  getTournamentsHistory,
  archiveTournament,
  deleteTournamentFromHistory,
  TOURNAMENT_STORAGE_KEYS
} from '../utils/tournament';
import { safeSetItem } from '../utils/storage';
import {
  syncTournamentToCloud,
  subscribeToCloudTournament,
  loadCloudTournamentsHistory,
  deleteTournamentFromCloud
} from '../services/firebase';

export function useTournament(currentUser = null) {
  const [activeTournament, setActiveTournament] = useState(() => getActiveTournament());
  const [tournamentsHistory, setTournamentsHistory] = useState(() => getTournamentsHistory());
  const [isTournamentOpen, setIsTournamentOpen] = useState(false);

  const currentUserRef = useRef(currentUser);
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  const currentUid = currentUser?.uid || null;

  // Ascolto real-time del torneo attivo da Firestore (multi-device)
  useEffect(() => {
    if (!activeTournament?.id) return;
    const unsubTournament = subscribeToCloudTournament(activeTournament.id, (cloudTourn) => {
      if (cloudTourn && cloudTourn.id === activeTournament.id) {
        setActiveTournament(cloudTourn);
        saveActiveTournament(cloudTourn);
      }
    });
    return () => unsubTournament();
  }, [activeTournament?.id]);

  // Caricamento e sincronizzazione storico tornei dal cloud al login
  useEffect(() => {
    if (!currentUid) return;
    let cancelled = false;
    loadCloudTournamentsHistory({ uid: currentUid }).then((cloudList) => {
      if (cancelled || !Array.isArray(cloudList)) return;
      const localList = getTournamentsHistory();
      const map = new Map();
      // Conserva solo i tornei offline senza ownerUid; per quelli cloud fa fede Firestore
      localList.forEach(t => {
        if (t && t.id && !t.ownerUid) map.set(t.id, t);
      });
      cloudList.forEach(t => {
        if (t && t.id && t.status === 'completed') map.set(t.id, t);
      });
      const merged = Array.from(map.values()).sort(
        (a, b) => new Date(b.completedAt || b.createdAt || 0) - new Date(a.completedAt || a.createdAt || 0)
      );
      safeSetItem(TOURNAMENT_STORAGE_KEYS.HISTORY, JSON.stringify(merged));
      setTournamentsHistory(merged);
    }).catch((err) => {
      console.warn('Errore sincronizzazione storico tornei cloud:', err?.message || err);
    });
    return () => {
      cancelled = true;
    };
  }, [currentUid]);

  // Avvio nuovo torneo
  const handleStartTournament = useCallback((newTournament) => {
    const user = currentUserRef.current;
    const enriched = {
      ...newTournament,
      ownerUid: newTournament.ownerUid !== undefined ? newTournament.ownerUid : (user?.uid || null),
      ownerEmail: newTournament.ownerEmail !== undefined ? newTournament.ownerEmail : (user?.email || null),
      ownerName: newTournament.ownerName !== undefined ? newTournament.ownerName : (user?.displayName || null),
    };
    setActiveTournament(enriched);
    saveActiveTournament(enriched);
    syncTournamentToCloud(enriched, user);
  }, []);

  // Aggiornamento torneo
  const handleUpdateTournament = useCallback((updatedTournament) => {
    setActiveTournament(updatedTournament);
    saveActiveTournament(updatedTournament);
    syncTournamentToCloud(updatedTournament, currentUserRef.current);
  }, []);

  // Conclusione e archiviazione torneo
  const handleFinishTournament = useCallback(() => {
    setActiveTournament(prev => {
      if (!prev) return null;
      const user = currentUserRef.current;
      const finished = {
        ...prev,
        status: 'completed',
        completedAt: new Date().toISOString(),
        ownerUid: prev.ownerUid !== undefined ? prev.ownerUid : (user?.uid || null),
        ownerEmail: prev.ownerEmail !== undefined ? prev.ownerEmail : (user?.email || null),
        ownerName: prev.ownerName !== undefined ? prev.ownerName : (user?.displayName || null),
      };
      const updatedHistory = archiveTournament(finished);
      setTournamentsHistory(updatedHistory);
      syncTournamentToCloud(finished, user);
      saveActiveTournament(null);
      return null;
    });
  }, []);

  // Eliminazione torneo storico (locale + cloud)
  const handleDeleteTournamentHistory = useCallback((tournamentId) => {
    if (!tournamentId) return [];
    const updated = deleteTournamentFromHistory(tournamentId);
    setTournamentsHistory(updated);
    deleteTournamentFromCloud(tournamentId).catch((err) => {
      console.warn('Errore eliminazione torneo cloud:', err?.message || err);
    });
    return updated;
  }, []);

  return useMemo(() => ({
    activeTournament,
    setActiveTournament,
    tournamentsHistory,
    setTournamentsHistory,
    isTournamentOpen,
    setIsTournamentOpen,
    handleStartTournament,
    handleUpdateTournament,
    handleFinishTournament,
    handleDeleteTournamentHistory,
  }), [
    activeTournament,
    tournamentsHistory,
    isTournamentOpen,
    handleStartTournament,
    handleUpdateTournament,
    handleFinishTournament,
    handleDeleteTournamentHistory,
  ]);
}
