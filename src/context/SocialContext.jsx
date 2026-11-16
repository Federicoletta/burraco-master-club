import React from 'react';
import { useSocialClub } from '../hooks/useSocialClub';
import { SocialContext } from './socialContextStore';

export function SocialProvider({ children }) {
  const social = useSocialClub();

  return (
    <SocialContext.Provider value={social}>
      {children}
    </SocialContext.Provider>
  );
}