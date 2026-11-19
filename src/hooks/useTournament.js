import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  getActiveTournament,
  saveActiveTournament,
  getPausedTournaments,
  savePausedTournaments,
  getTournamentsHistory,
  archiveTournament,
  deleteTournamentFromHistory,
  pauseTournamentObject,
  resumeTournamentObject,
  TOURNAMENT_STORAGE_KEYS
} from '../utils/tournament';
import { safeSetItem } from '../utils/storage';
import {
  syncTournamentToCloud,
  subscribeToCloudTournament,
  loadCloudTournamentsHistory,
  deleteTournamentFromCloud
} from '../services/firebase';

function toTimeMs(val) {
  if (!val) return 0;
  if (typeof val?.toMillis === 'function') return val.toMillis();
  if (typeof val?.seconds === 'number') return val.seconds * 1000;
  const ms = new Date(val).getTime();
  return Number.isNaN(ms) ? 0 : ms;
}

function sortByRecency(list) {
  return [...list].sort(
    (a, b) =>
      Math.max(toTimeMs(b?.pausedAt), toTimeMs(b?.updatedAt), toTimeMs(b?.createdAt)) -
      Math.max(toTimeMs(a?.pausedAt), toTimeMs(a?.updatedAt), toTimeMs(a?.createdAt))
  );
}

export function useTournament(currentUser = null) {
  const [activeTournament, setActiveTournament] = useState(() => getActiveTournament());
  const [pausedTournaments, setPausedTournaments] = useState(() => getPausedTournaments());
  const [tournamentsHistory, setTournamentsHistory] = useState(() => getTournamentsHistory());

  const currentUserRef = useRef(currentUser);
  const activeTournamentRef = useRef(activeTournament);
  const pausedTournamentsRef = useRef(pausedTournaments);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);
  useEffect(() => {
    activeTournamentRef.current = activeTournament;
  }, [activeTournament]);
  useEffect(() => {
    pausedTournamentsRef.current = pausedTournaments;
  }, [pausedTournaments]);

  const currentUid = currentUser?.uid || null;

  // Ascolto real-time del torneo attivo principale da Firestore (multi-device)
  useEffect(() => {
    if (!activeTournament?.id) return undefined;
    const targetId = activeTournament.id;
    const unsubTournament = subscribeToCloudTournament(targetId, (cloudTourn) => {
      if (!cloudTourn || cloudTourn.id !== targetId) return;
      if (cloudTourn.status === 'in_progress') {
        setActiveTournament(cloudTourn);
        saveActiveTournament(cloudTourn);
      }
    });
    return () => unsubTournament();
  }, [activeTournament?.id]);

  // Caricamento e sincronizzazione multi-torneo (attivi, in pausa e conclusi) dal cloud al login
  useEffect(() => {
    if (!currentUid) return undefined;
    let cancelled = false;
    loadCloudTournamentsHistory({ uid: currentUid }).then((cloudList) => {
      if (cancelled || !Array.isArray(cloudList)) return;

      const localActive = getActiveTournament();
      const localPaused = getPausedTournaments();
      const localHistory = getTournamentsHistory();

      // 1. Storico conclusi (Albo d'Oro)
      const historyMap = new Map();
      localHistory.forEach(t => {
        if (t && t.id && !t.ownerUid) historyMap.set(t.id, t);
      });
      cloudList.forEach(t => {
        if (t && t.id && t.status === 'completed') historyMap.set(t.id, t);
      });
      const mergedHistory = Array.from(historyMap.values()).sort(
        (a, b) => toTimeMs(b.completedAt || b.createdAt) - toTimeMs(a.completedAt || a.createdAt)
      );
      safeSetItem(TOURNAMENT_STORAGE_KEYS.HISTORY, JSON.stringify(mergedHistory));
      setTournamentsHistory(mergedHistory);

      // 2. Tornei in pausa + eventuali extra in_progress da altri dispositivi
      const cloudInProgress = cloudList.filter(t => t && t.id && t.status === 'in_progress');
      const cloudPaused = cloudList.filter(t => t && t.id && t.status === 'paused');

      let resolvedActive = localActive;
      if (resolvedActive?.id) {
        const matchedCloud = cloudList.find(t => t.id === resolvedActive.id);
        if (matchedCloud) {
          if (matchedCloud.status === 'completed' || matchedCloud.status === 'paused') {
            resolvedActive = null;
          } else {
            resolvedActive = matchedCloud;
          }
        }
      }

      if (!resolvedActive && cloudInProgress.length > 0) {
        resolvedActive = sortByRecency(cloudInProgress)[0];
      }

      saveActiveTournament(resolvedActive || null);
      setActiveTournament(resolvedActive || null);

      const pausedMap = new Map();
      // Conserva i tornei offline locali non ancora associati a un utente cloud
      localPaused.forEach(t => {
        if (t && t.id && !t.ownerUid && t.id !== resolvedActive?.id && !historyMap.has(t.id)) {
          pausedMap.set(t.id, t);
        }
      });
      cloudPaused.forEach(t => {
        if (t && t.id && t.id !== resolvedActive?.id && !historyMap.has(t.id)) {
          pausedMap.set(t.id, t);
        }
      });
      // Eventuali altri tornei rimasti in_progress su un altro dispositivo restano accessibili sotto In Pausa
      cloudInProgress.forEach(t => {
        if (t && t.id && t.id !== resolvedActive?.id && !historyMap.has(t.id) && !pausedMap.has(t.id)) {
          pausedMap.set(t.id, pauseTournamentObject(t));
        }
      });

      const mergedPaused = sortByRecency(Array.from(pausedMap.values()));
      savePausedTournaments(mergedPaused);
      setPausedTournaments(mergedPaused);
    }).catch((err) => {
      console.warn('Errore sincronizzazione tornei cloud:', err?.message || err);
    });
    return () => {
      cancelled = true;
    };
  }, [currentUid]);

  const enrichOwnership = useCallback((tournament) => {
    const user = currentUserRef.current;
    return {
      ...tournament,
      ownerUid: tournament.ownerUid !== undefined ? tournament.ownerUid : (user?.uid || null),
      ownerEmail: tournament.ownerEmail !== undefined ? tournament.ownerEmail : (user?.email || null),
      ownerName: tournament.ownerName !== undefined ? tournament.ownerName : (user?.displayName || null),
    };
  }, []);

  // Avvio nuovo torneo (se ce n'è uno attivo, lo mette automaticamente in pausa)
  const handleStartTournament = useCallback((newTournament) => {
    const user = currentUserRef.current;
    const prevActive = activeTournamentRef.current;
    let autoPausedTournament = null;

    if (prevActive && prevActive.id !== newTournament.id) {
      autoPausedTournament = enrichOwnership(
        pauseTournamentObject(prevActive, {
          resumeNote: prevActive.resumeNote || "Sospeso automaticamente all'avvio di un nuovo torneo",
        })
      );
      const nextPaused = sortByRecency([
        autoPausedTournament,
        ...pausedTournamentsRef.current.filter(t => t.id !== autoPausedTournament.id),
      ]);
      savePausedTournaments(nextPaused);
      setPausedTournaments(nextPaused);
      syncTournamentToCloud(autoPausedTournament, user);
    }

    const enriched = enrichOwnership({
      ...newTournament,
      status: 'in_progress',
      pausedAt: null,
    });

    setActiveTournament(enriched);
    saveActiveTournament(enriched);
    syncTournamentToCloud(enriched, user);

    return { activeTournament: enriched, autoPausedTournament };
  }, [enrichOwnership]);

  // Metti in pausa un torneo (attivo o aggiorna uno già in pausa con nota/data)
  const handlePauseTournament = useCallback((tournamentOrId = null, pauseDetails = {}) => {
    const user = currentUserRef.current;
    const targetId = typeof tournamentOrId === 'string'
      ? tournamentOrId
      : (tournamentOrId?.id || activeTournamentRef.current?.id);

    if (!targetId) return null;

    const currentActive = activeTournamentRef.current;
    let targetTournament = null;
    if (currentActive?.id === targetId) {
      targetTournament = currentActive;
    } else if (tournamentOrId && typeof tournamentOrId === 'object' && tournamentOrId.id) {
      targetTournament = tournamentOrId;
    } else {
      targetTournament = pausedTournamentsRef.current.find(t => t.id === targetId) || null;
    }

    if (!targetTournament) return null;

    const paused = enrichOwnership(pauseTournamentObject(targetTournament, pauseDetails));
    const nextPaused = sortByRecency([
      paused,
      ...pausedTournamentsRef.current.filter(t => t.id !== paused.id),
    ]);

    savePausedTournaments(nextPaused);
    setPausedTournaments(nextPaused);

    if (currentActive?.id === paused.id) {
      saveActiveTournament(null);
      setActiveTournament(null);
    }

    syncTournamentToCloud(paused, user);
    return paused;
  }, [enrichOwnership]);

  // Modifica nota o data di ripresa di un torneo già in pausa
  const handleUpdatePausedMetadata = useCallback((tournamentId, { resumeDate = '', resumeNote = '' } = {}) => {
    if (!tournamentId) return null;
    const user = currentUserRef.current;
    const target = pausedTournamentsRef.current.find(t => t.id === tournamentId);
    if (!target) return null;

    const updated = enrichOwnership(
      pauseTournamentObject(target, { resumeDate, resumeNote })
    );
    const nextPaused = sortByRecency([
      updated,
      ...pausedTournamentsRef.current.filter(t => t.id !== tournamentId),
    ]);

    savePausedTournaments(nextPaused);
    setPausedTournaments(nextPaused);
    syncTournamentToCloud(updated, user);
    return updated;
  }, [enrichOwnership]);

  // Riprendi un torneo dalla lista In Pausa (mettendo eventualmente in pausa quello attivo)
  const handleResumeTournament = useCallback((tournamentOrId) => {
    const user = currentUserRef.current;
    const targetId = typeof tournamentOrId === 'string' ? tournamentOrId : tournamentOrId?.id;
    if (!targetId) return null;

    const foundPaused = pausedTournamentsRef.current.find(t => t.id === targetId)
      || (typeof tournamentOrId === 'object' ? tournamentOrId : null);
    if (!foundPaused) return null;

    const prevActive = activeTournamentRef.current;
    let nextPausedList = pausedTournamentsRef.current.filter(t => t.id !== targetId);

    if (prevActive && prevActive.id !== targetId) {
      const autoPausedPrev = enrichOwnership(
        pauseTournamentObject(prevActive, {
          resumeNote: prevActive.resumeNote || 'Sospeso per riprendere un altro torneo',
        })
      );
      nextPausedList = sortByRecency([
        autoPausedPrev,
        ...nextPausedList.filter(t => t.id !== autoPausedPrev.id),
      ]);
      syncTournamentToCloud(autoPausedPrev, user);
    }

    savePausedTournaments(nextPausedList);
    setPausedTournaments(nextPausedList);

    const resumed = enrichOwnership(resumeTournamentObject(foundPaused));
    setActiveTournament(resumed);
    saveActiveTournament(resumed);
    syncTournamentToCloud(resumed, user);
    return resumed;
  }, [enrichOwnership]);

  // Aggiornamento torneo generico (attivo o in pausa)
  const handleUpdateTournament = useCallback((updatedTournament) => {
    if (!updatedTournament?.id) return;
    const user = currentUserRef.current;

    if (updatedTournament.status === 'paused' || pausedTournamentsRef.current.some(t => t.id === updatedTournament.id && activeTournamentRef.current?.id !== updatedTournament.id)) {
      const nextPaused = sortByRecency(
        pausedTournamentsRef.current.map(t => t.id === updatedTournament.id ? updatedTournament : t)
      );
      savePausedTournaments(nextPaused);
      setPausedTournaments(nextPaused);
      syncTournamentToCloud(updatedTournament, user);
      return;
    }

    setActiveTournament(updatedTournament);
    saveActiveTournament(updatedTournament);
    syncTournamentToCloud(updatedTournament, user);
  }, []);

  // Aggiorna un torneo specifico per ID (usato anche quando un match finisce al tavolo)
  const updateTournamentById = useCallback((tournamentId, updaterFn) => {
    if (!tournamentId || typeof updaterFn !== 'function') return null;
    const currentActive = activeTournamentRef.current;
    if (currentActive?.id === tournamentId) {
      const nextTourn = updaterFn(currentActive);
      if (nextTourn) handleUpdateTournament(nextTourn);
      return nextTourn;
    }

    const pausedTarget = pausedTournamentsRef.current.find(t => t.id === tournamentId);
    if (pausedTarget) {
      const nextTourn = updaterFn(pausedTarget);
      if (nextTourn) handleUpdateTournament(nextTourn);
      return nextTourn;
    }
    return null;
  }, [handleUpdateTournament]);

  // Conclusione e archiviazione torneo (attivo o in pausa)
  const handleFinishTournament = useCallback((tournamentIdOverride = null) => {
    const user = currentUserRef.current;
    const currentActive = activeTournamentRef.current;
    const targetId = typeof tournamentIdOverride === 'string'
      ? tournamentIdOverride
      : currentActive?.id;

    if (!targetId) return;

    const target = currentActive?.id === targetId
      ? currentActive
      : pausedTournamentsRef.current.find(t => t.id === targetId);

    if (!target) return;

    const finished = enrichOwnership({
      ...target,
      status: 'completed',
      pausedAt: null,
      completedAt: new Date().toISOString(),
    });

    const updatedHistory = archiveTournament(finished);
    setTournamentsHistory(updatedHistory);
    syncTournamentToCloud(finished, user);

    if (currentActive?.id === targetId) {
      saveActiveTournament(null);
      setActiveTournament(null);
    }

    if (pausedTournamentsRef.current.some(t => t.id === targetId)) {
      const remainingPaused = pausedTournamentsRef.current.filter(t => t.id !== targetId);
      savePausedTournaments(remainingPaused);
      setPausedTournaments(remainingPaused);
    }
  }, [enrichOwnership]);

  // Eliminazione torneo in pausa (locale + cloud)
  const handleDeletePausedTournament = useCallback((tournamentId) => {
    if (!tournamentId) return [];
    const updated = pausedTournamentsRef.current.filter(t => t.id !== tournamentId);
    savePausedTournaments(updated);
    setPausedTournaments(updated);
    deleteTournamentFromCloud(tournamentId).catch((err) => {
      console.warn('Errore eliminazione torneo in pausa cloud:', err?.message || err);
    });
    return updated;
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

  const allActiveAndPausedTournaments = useMemo(() => {
    const list = [];
    if (activeTournament) list.push(activeTournament);
    pausedTournaments.forEach(t => {
      if (t && t.id !== activeTournament?.id) list.push(t);
    });
    return list;
  }, [activeTournament, pausedTournaments]);

  return useMemo(() => ({
    activeTournament,
    setActiveTournament,
    pausedTournaments,
    setPausedTournaments,
    allActiveAndPausedTournaments,
    tournamentsHistory,
    setTournamentsHistory,
    handleStartTournament,
    handlePauseTournament,
    handleUpdatePausedMetadata,
    handleResumeTournament,
    handleUpdateTournament,
    updateTournamentById,
    handleFinishTournament,
    handleDeletePausedTournament,
    handleDeleteTournamentHistory,
  }), [
    activeTournament,
    pausedTournaments,
    allActiveAndPausedTournaments,
    tournamentsHistory,
    handleStartTournament,
    handlePauseTournament,
    handleUpdatePausedMetadata,
    handleResumeTournament,
    handleUpdateTournament,
    updateTournamentById,
    handleFinishTournament,
    handleDeletePausedTournament,
    handleDeleteTournamentHistory,
  ]);
}
