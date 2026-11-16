import { createContext, useContext } from 'react';
import { useSocial } from './socialContextStore';
import { useTournamentContext } from './tournamentContextStore';

export const GameContext = createContext(null);

export { useTournamentContext };

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame deve essere utilizzato all\'interno di un GameProvider');
  }
  return context.game;
}

export function useBurraco() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useBurraco deve essere utilizzato all\'interno di un GameProvider');
  }
  const social = useSocial();
  const tournament = useTournamentContext();
  return {
    game: context.game,
    tournament,
    social,
    isVictoryOpen: context.isVictoryOpen,
    setIsVictoryOpen: context.setIsVictoryOpen,
  };
}
