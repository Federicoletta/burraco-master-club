import { createContext, useContext } from 'react';

export const SocialContext = createContext(null);

export function useSocial() {
  const context = useContext(SocialContext);
  if (!context) {
    throw new Error('useSocial deve essere utilizzato all\'interno di un SocialProvider');
  }
  return context;
}
