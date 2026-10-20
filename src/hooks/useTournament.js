import { useState, useEffect, useRef } from 'react';
import {
  getActiveTournament,
  saveActiveTournament,
  archiveTournament
} from '../utils/tournament';
import {
  syncTournamentToCloud,
  subscribeToCloudTournament
} from '../services/firebase';

export function useTournament() {
  const [activeTournament, setActiveTournament] = useState(() => getActiveTournament());
  const [isTournamentOpen, setIsTournamentOpen] = useState(false);
  
  // Flag per impedire il ciclo ping-pong di riscrittura quando l'aggiornamento arriva dal listener remoto
  const isRemoteSyncRef = useRef(false);

  // 1. Sincronizzazione torneo locale col cloud (solo su modifiche locali effettive)
  useEffect(() => {
    if (activeTournament) {
      if (isRemoteSyncRef.current) {
        isRemoteSyncRef.current = false;
        return;
      }
      syncTournamentToCloud(activeTournament);
    }
  }, [activeTournament]);

  // 2. Ascolto real-time del torneo attivo da Firestore (multi-device)
  useEffect(() => {
    if (!activeTournament?.id) return;
    const unsubTournament = subscribeToCloudTournament(activeTournament.id, (cloudTourn) => {
      if (cloudTourn && cloudTourn.id === activeTournament.id) {
        isRemoteSyncRef.current = true;
        setActiveTournament(cloudTourn);
        saveActiveTournament(cloudTourn);
      }
    });
    return () => unsubTournament();
  }, [activeTournament?.id]);

  // Avvio nuovo torneo
  const handleStartTournament = (newTournament) => {
    setActiveTournament(newTournament);
    saveActiveTournament(newTournament);
    syncTournamentToCloud(newTournament);
  };

  // Aggiornamento torneo
  const handleUpdateTournament = (updatedTournament) => {
    setActiveTournament(updatedTournament);
    saveActiveTournament(updatedTournament);
    syncTournamentToCloud(updatedTournament);
  };

  // Conclusione e archiviazione torneo
  const handleFinishTournament = () => {
    if (!activeTournament) return;
    archiveTournament(activeTournament);
    const finished = {
      ...activeTournament,
      status: 'completed',
      completedAt: new Date().toISOString(),
    };
    syncTournamentToCloud(finished);
    setActiveTournament(null);
    saveActiveTournament(null);
  };

  return {
    activeTournament,
    setActiveTournament,
    isTournamentOpen,
    setIsTournamentOpen,
    handleStartTournament,
    handleUpdateTournament,
    handleFinishTournament,
  };
}
