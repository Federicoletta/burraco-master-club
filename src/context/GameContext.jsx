import React, { useState, useMemo } from 'react';
import { useSocial } from './socialContextStore';
import { useTournament } from '../hooks/useTournament';
import { useBurracoGame } from '../hooks/useBurracoGame';
import { GameContext } from './gameContextStore';

export function GameProvider({ children }) {
  const social = useSocial();
  const tournament = useTournament(social.currentUser);
  const [isVictoryOpen, setIsVictoryOpen] = useState(false);

  const game = useBurracoGame({
    currentUser: social.currentUser,
    friendsList: social.friendsList,
    activeTournament: tournament.activeTournament,
    handleUpdateTournament: tournament.handleUpdateTournament,
    onCelebrate: () => setIsVictoryOpen(true),
  });

  const value = useMemo(() => ({
    game,
    tournament,
    social,
    isVictoryOpen,
    setIsVictoryOpen,
  }), [game, tournament, social, isVictoryOpen]);

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}