import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import BurracoErrorBoundary from './components/BurracoErrorBoundary';

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

// Registrazione Service Worker PWA per caching offline e caricamento istantaneo
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('Service Worker registration skipped:', err);
    });
  });
}