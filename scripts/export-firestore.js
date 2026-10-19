import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

const firebaseConfig = {
  projectId: "burraco-score-fedec",
  appId: "1:453081841776:web:0e44d414aad67a818b34b5",
  storageBucket: "burraco-score-fedec.firebasestorage.app",
  apiKey: "AIzaSyAto2ITLoaMtUvRkanYacdK1yrqLm48J68",
  authDomain: "burraco-score-fedec.firebaseapp.com",
  messagingSenderId: "453081841776",
  projectNumber: "453081841776",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function exportFirestore() {
  console.log('Avvio esportazione database Firestore...');
  const collections = [
    'burraco_games', 
    'burraco_tournaments', 
    'burraco_meta', 
    'burraco_users', 
    'burraco_friends', 
    'burraco_notifications'
  ];
  const exportData = {
    exportedAt: new Date().toISOString(),
    projectId: firebaseConfig.projectId,
    collections: {}
  };

  // Prova a recuperare token da firebase-tools se presente per collezioni con auth richiesta
  let cliToken = null;
  try {
    const configPath = path.join(process.env.USERPROFILE || process.env.HOME || '', '.config', 'configstore', 'firebase-tools.json');
    if (fs.existsSync(configPath)) {
      const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      cliToken = cfg?.tokens?.access_token;
    }
  } catch {}

  function parseFirestoreValue(val) {
    if (!val) return null;
    if ('stringValue' in val) return val.stringValue;
    if ('integerValue' in val) return parseInt(val.integerValue, 10);
    if ('doubleValue' in val) return parseFloat(val.doubleValue);
    if ('booleanValue' in val) return val.booleanValue;
    if ('timestampValue' in val) return val.timestampValue;
    if ('nullValue' in val) return null;
    if ('mapValue' in val) {
      const res = {};
      const fields = val.mapValue?.fields || {};
      for (const k of Object.keys(fields)) {
        res[k] = parseFirestoreValue(fields[k]);
      }
      return res;
    }
    if ('arrayValue' in val) {
      return (val.arrayValue?.values || []).map(parseFirestoreValue);
    }
    return val;
  }

  for (const colName of collections) {
    try {
      const colRef = collection(db, colName);
      const snapshot = await getDocs(colRef);
      exportData.collections[colName] = [];
      snapshot.forEach(docSnap => {
        exportData.collections[colName].push({
          id: docSnap.id,
          ...docSnap.data()
        });
      });
      console.log(`- Collezione ${colName}: ${exportData.collections[colName].length} documenti esportati.`);
    } catch (err) {
      // Se fallisce per permessi, tenta con REST API e token CLI
      if (cliToken) {
        try {
          const res = await fetch(`https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/${colName}`, {
            headers: { Authorization: `Bearer ${cliToken}` }
          });
          const data = await res.json();
          exportData.collections[colName] = [];
          if (Array.isArray(data.documents)) {
            data.documents.forEach(doc => {
              const id = doc.name.split('/').pop();
              const fields = {};
              for (const [k, v] of Object.entries(doc.fields || {})) {
                fields[k] = parseFirestoreValue(v);
              }
              exportData.collections[colName].push({ id, ...fields });
            });
          }
          console.log(`- Collezione ${colName} (tramite REST CLI): ${exportData.collections[colName].length} documenti esportati.`);
          continue;
        } catch (restErr) {
          console.error(`Errore fallback REST ${colName}:`, restErr.message);
        }
      }
      console.error(`Errore esportazione ${colName}:`, err.message);
      exportData.collections[colName] = { error: err.message };
    }
  }

  const outDir = path.resolve('backups_db');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const outPath = path.join(outDir, 'firestore_export.json');
  fs.writeFileSync(outPath, JSON.stringify(exportData, null, 2), 'utf-8');

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const timestampedPath = path.join(outDir, `firestore_backup_${timestamp}.json`);
  fs.writeFileSync(timestampedPath, JSON.stringify(exportData, null, 2), 'utf-8');

  console.log(`Esportazione completata con successo:`);
  console.log(`- ${outPath}`);
  console.log(`- ${timestampedPath}`);
  process.exit(0);
}

exportFirestore().catch(err => {
  console.error('Fatal export error:', err);
  process.exit(1);
});
