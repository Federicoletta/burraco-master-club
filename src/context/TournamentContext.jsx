import React from 'react';
import { useSocial } from './socialContextStore';
import { useTournament } from '../hooks/useTournament';
import { TournamentContext } from './tournamentContextStore';

export function TournamentProvider({ children }) {
  const { currentUser } = useSocial();
  const tournament = useTournament(currentUser);

  return (
    <TournamentContext.Provider value={tournament}>
      {children}
    </TournamentContext.Provider>
  );
}
