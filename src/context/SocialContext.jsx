import React from 'react';
import { useAuth } from './authContextStore';
import { useSocialClub } from '../hooks/useSocialClub';
import { SocialContext } from './socialContextStore';

export function SocialProvider({ children }) {
  const auth = useAuth();
  const social = useSocialClub(auth);

  return (
    <SocialContext.Provider value={social}>
      {children}
    </SocialContext.Provider>
  );
}