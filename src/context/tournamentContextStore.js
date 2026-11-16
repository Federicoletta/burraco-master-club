import { createContext, useContext } from 'react';

export const TournamentContext = createContext(null);

export function useTournamentContext() {
  const context = useContext(TournamentContext);
  if (!context) {
    throw new Error('useTournamentContext deve essere utilizzato all\'interno di un TournamentProvider');
  }
  return context;
}
