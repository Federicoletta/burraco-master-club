import fs from 'fs';
import path from 'path';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

function loadEnvFallback() {
  const envPaths = ['.env.local', '.env'];
  for (const file of envPaths) {
    const fullPath = path.resolve(process.cwd(), file);
    if (!fs.existsSync(fullPath)) continue;
    try {
      const content = fs.readFileSync(fullPath, 'utf8');
      for (const rawLine of content.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line || line.startsWith('#')) continue;
        const eqIdx = line.indexOf('=');
        if (eqIdx === -1) continue;
        const key = line.slice(0, eqIdx).trim();
        const val = line.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
        if (key && !(key in process.env)) {
          process.env[key] = val;
        }
      }
    } catch {
      // ignora errori di lettura opzionali
    }
  }
}

function loadAppletConfigFallback() {
  try {
    const fullPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(fullPath)) {
      return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    }
  } catch {
    // ignora errori opzionali
  }
  return {};
}

export function getCliFirebaseDb() {
  loadEnvFallback();
  const appletCfg = loadAppletConfigFallback();

  const firebaseConfig = {
    projectId: process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || appletCfg.projectId || '',
    appId: process.env.VITE_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID || appletCfg.appId || '',
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET || appletCfg.storageBucket || '',
    apiKey: process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || appletCfg.apiKey || '',
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN || appletCfg.authDomain || '',
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID || appletCfg.messagingSenderId || '',
    projectNumber: process.env.VITE_FIREBASE_PROJECT_NUMBER || process.env.FIREBASE_PROJECT_NUMBER || '',
  };

  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.error('[Firebase CLI] Configurazione mancante: imposta VITE_FIREBASE_API_KEY e VITE_FIREBASE_PROJECT_ID in .env o firebase-applet-config.json.');
    process.exit(1);
  }

  const databaseId = process.env.VITE_FIREBASE_DATABASE_ID || appletCfg.firestoreDatabaseId || '';
  firebaseConfig.firestoreDatabaseId = databaseId === '(default)' ? '' : databaseId;

  const app = initializeApp(firebaseConfig);
  const db = firebaseConfig.firestoreDatabaseId
    ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
    : getFirestore(app);
  return { app, db, firebaseConfig };
}
