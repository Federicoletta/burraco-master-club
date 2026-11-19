import React, { useState, useMemo, useCallback } from 'react';
import { useAuth } from './authContextStore';
import { useSocial } from './socialContextStore';
import { useTournamentContext } from './tournamentContextStore';
import { useBurracoGame } from '../hooks/useBurracoGame';
import { GameContext } from './gameContextStore';

export function GameProvider({ children }) {
  const { currentUser } = useAuth();
  const { friendsList } = useSocial();
  const {
    activeTournament,
    allActiveAndPausedTournaments,
    handleUpdateTournament,
    updateTournamentById,
  } = useTournamentContext();
  const [isVictoryOpen, setIsVictoryOpen] = useState(false);

  const handleCelebrate = useCallback(() => {
    setIsVictoryOpen(true);
  }, []);

  const game = useBurracoGame({
    currentUser,
    friendsList,
    activeTournament,
    allActiveAndPausedTournaments,
    handleUpdateTournament,
    updateTournamentById,
    onCelebrate: handleCelebrate,
  });

  const value = useMemo(() => ({
    game,
    isVictoryOpen,
    setIsVictoryOpen,
  }), [game, isVictoryOpen]);

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}