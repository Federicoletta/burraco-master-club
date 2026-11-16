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

export function useTournament(currentUser = null) {
  const [activeTournament, setActiveTournament] = useState(() => getActiveTournament());
  const [isTournamentOpen, setIsTournamentOpen] = useState(false);

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

  // Avvio nuovo torneo
  const handleStartTournament = (newTournament) => {
    setActiveTournament(newTournament);
    saveActiveTournament(newTournament);
    syncTournamentToCloud(newTournament, currentUser);
  };

  // Aggiornamento torneo
  const handleUpdateTournament = (updatedTournament) => {
    setActiveTournament(updatedTournament);
    saveActiveTournament(updatedTournament);
    syncTournamentToCloud(updatedTournament, currentUser);
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
    syncTournamentToCloud(finished, currentUser);
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
