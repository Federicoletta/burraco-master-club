import React, { createContext, useContext, useState, useCallback, useRef, useMemo } from 'react';
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

  const alert = useCallback(({
    title = 'Avviso',
    message,
    confirmText = 'OK',
    variant = 'info',
  }) => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setConfig({
        title,
        message,
        confirmText,
        cancelText: null,
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

  const value = useMemo(() => {
    const fn = (opts) => confirm(opts);
    fn.confirm = confirm;
    fn.alert = alert;
    return fn;
  }, [confirm, alert]);

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
    const fallback = async ({ message }) => window.confirm(message);
    fallback.confirm = async ({ message }) => window.confirm(message);
    fallback.alert = async ({ message }) => window.alert(message);
    return fallback;
  }
  return context;
}

export function useAlert() {
  const api = useConfirm();
  return api?.alert || (async ({ message }) => window.alert(message));
}
