import React, { createContext, useContext, useState, useRef, useCallback, useMemo } from 'react';
import ConfirmModal from '../components/ConfirmModal';

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [config, setConfig] = useState(null);
  const resolveRef = useRef(null);

  /**
   * Richiede una conferma modale personalizzata all'utente.
   * Ritorna una Promise che si risolve in true (confermato) o false (annullato).
   */
  const confirm = useCallback(({
    title = 'Conferma Operazione',
    message,
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

  /**
   * Mostra un messaggio di avviso o notifica a singolo pulsante ("OK").
   */
  const alert = useCallback(({
    title = 'Avviso',
    message,
    confirmText = 'OK',
    variant = 'info',
  }) => {
    return new Promise((resolve) => {
      resolveRef.current = () => resolve(true);
      setConfig({
        title,
        message,
        confirmText,
        cancelText: null, // nasconde il tasto annulla
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

  const value = useMemo(() => ({
    confirm,
    alert,
  }), [confirm, alert]);

  return (
    <ConfirmContext.Provider value={value}>
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
    return async ({ message }) => window.confirm(message);
  }
  return context.confirm;
}

export function useAlert() {
  const context = useContext(ConfirmContext);
  if (!context) {
    return async ({ message }) => window.alert(message);
  }
  return context.alert;
}
