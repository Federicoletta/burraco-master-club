import React, { useState, useMemo } from 'react';
import { useSocial } from './socialContextStore';
import { useTournamentContext } from './tournamentContextStore';
import { useBurracoGame } from '../hooks/useBurracoGame';
import { GameContext } from './gameContextStore';

export function GameProvider({ children }) {
  const { currentUser, friendsList } = useSocial();
  const { activeTournament, handleUpdateTournament } = useTournamentContext();
  const [isVictoryOpen, setIsVictoryOpen] = useState(false);

  const game = useBurracoGame({
    currentUser,
    friendsList,
    activeTournament,
    handleUpdateTournament,
    onCelebrate: () => setIsVictoryOpen(true),
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