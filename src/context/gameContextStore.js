import { createContext, useContext } from 'react';

export const GameContext = createContext(null);

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
