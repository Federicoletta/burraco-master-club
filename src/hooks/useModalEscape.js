import { useEffect } from 'react';

/**
 * Chiude automaticamente i modali alla pressione del tasto Escape.
 */
export function useModalEscape(isOpen, onClose) {
  useEffect(() => {
    if (!isOpen || typeof onClose !== 'function' || typeof window === 'undefined') {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);
}
