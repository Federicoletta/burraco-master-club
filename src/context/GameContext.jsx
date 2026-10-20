import React, { createContext, useContext, useState, useMemo } from 'react';
import { useSocial } from './SocialContext';
import { useTournament } from '../hooks/useTournament';
import { useBurracoGame } from '../hooks/useBurracoGame';

const GameContext = createContext(null);

export function GameProvider({ children }) {
  const social = useSocial();
  const tournament = useTournament();
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

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame deve essere utilizzato all\'interno di un GameProvider');
  }
  return context.game;
}

export function useTournamentContext() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useTournamentContext deve essere utilizzato all\'interno di un GameProvider');
  }
  return context.tournament;
}

export function useBurraco() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useBurraco deve essere utilizzato all\'interno di un GameProvider');
  }
  return context;
}