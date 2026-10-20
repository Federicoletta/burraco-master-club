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

// Registrazione Service Worker PWA per caching offline e caricamento istantaneo
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('Service Worker registration skipped:', err);
    });
  });
}