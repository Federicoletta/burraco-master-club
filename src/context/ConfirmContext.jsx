import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import ConfirmModal from '../components/ConfirmModal';

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [config, setConfig] = useState(null);
  const resolveRef = useRef(null);

  const confirm = useCallback(({
    title = 'Conferma operazione',
    message = 'Sei sicuro di voler procedere?',
    confirmText = 'Conferma',
    cancelText = 'Annulla',
    variant = 'warning',
  }) => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setConfig({
        title,
        message,
        confirmText,
        cancelText,
        variant,
      });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    if (resolveRef.current) {
      resolveRef.current(true);
      resolveRef.current = null;
    }
    setConfig(null);
  }, []);

  const handleCancel = useCallback(() => {
    if (resolveRef.current) {
      resolveRef.current(false);
      resolveRef.current = null;
    }
    setConfig(null);
  }, []);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <ConfirmModal
        isOpen={Boolean(config)}
        title={config?.title}
        message={config?.message}
        confirmText={config?.confirmText}
        cancelText={config?.cancelText}
        variant={config?.variant}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    // Fallback sicuro se chiamato fuori da un provider
    return async ({ message }) => window.confirm(message);
  }
  return context;
}