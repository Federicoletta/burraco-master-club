import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import BurracoErrorBoundary from './components/BurracoErrorBoundary';
import { notifyWaitingServiceWorker } from './utils/versionCheck';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BurracoErrorBoundary>
      <App />
    </BurracoErrorBoundary>
  </StrictMode>,
);

// Attiva Persistent Storage API per impedire al browser/Safari di svuotare i dati durante la pulizia della cache
if (typeof navigator !== 'undefined' && navigator.storage && typeof navigator.storage.persist === 'function') {
  navigator.storage.persist().then((isPersisted) => {
    if (isPersisted) {
      console.log('[StorageManager] Persistent Storage accordato con successo: i dati di gioco sono protetti da pulizia cache.');
    }
  }).catch(() => {});
}

// Registrazione Service Worker PWA con gestione non distruttiva degli aggiornamenti
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((registration) => {
      if (registration.waiting) {
        notifyWaitingServiceWorker(registration.waiting);
      }

      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            notifyWaitingServiceWorker(newWorker);
          }
        });
      });

      // Ricontrolla periodicamente quando l'app torna in primo piano
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          registration.update().catch(() => {});
        }
      });
    }).catch((err) => {
      console.warn('Service Worker registration skipped:', err);
    });
  });
}