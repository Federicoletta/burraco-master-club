import React from 'react';
import { useAuth } from './authContextStore';
import { useTournament } from '../hooks/useTournament';
import { TournamentContext } from './tournamentContextStore';

export function TournamentProvider({ children }) {
  const { currentUser } = useAuth();
  const tournament = useTournament(currentUser);

  return (
    <TournamentContext.Provider value={tournament}>
      {children}
    </TournamentContext.Provider>
  );
}
