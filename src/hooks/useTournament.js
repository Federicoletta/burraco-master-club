import { useState, useEffect } from 'react';
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
  const [activeTournament, setActiveTournament] = useState(null);
  const [isTournamentOpen, setIsTournamentOpen] = useState(false);

  // 1. Caricamento iniziale torneo locale
  useEffect(() => {
    const storedTournament = getActiveTournament();
    if (storedTournament) {
      setActiveTournament(storedTournament);
      syncTournamentToCloud(storedTournament);
    }
  }, []);

  // 2. Ascolto real-time del torneo attivo da Firestore
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
