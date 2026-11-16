import { createContext, useContext } from 'react';

export const ConfirmContext = createContext(null);

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    return async ({ message }) => (
      typeof window !== 'undefined' && typeof window.confirm === 'function'
        ? window.confirm(message)
        : false
    );
  }
  return context.confirm;
}

export function useAlert() {
  const context = useContext(ConfirmContext);
  if (!context) {
    return async ({ message }) => {
      if (message) console.warn('[Alert]', message);
      return true;
    };
  }
  return context.alert;
}
