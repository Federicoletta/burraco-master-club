import React, { createContext, useContext } from 'react';
import { useSocialClub } from '../hooks/useSocialClub';

const SocialContext = createContext(null);

export function SocialProvider({ children }) {
  const social = useSocialClub();

  return (
    <SocialContext.Provider value={social}>
      {children}
    </SocialContext.Provider>
  );
}

export function useSocial() {
  const context = useContext(SocialContext);
  if (!context) {
    throw new Error('useSocial deve essere utilizzato all\'interno di un SocialProvider');
  }
  return context;
}