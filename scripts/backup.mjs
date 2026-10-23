import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from '../src/services/firebase.js';
import { collection, getDocs } from 'firebase/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const backupsDir = path.resolve(projectRoot, 'backups');

if (!fs.existsSync(backupsDir)) {
  fs.mkdirSync(backupsDir, { recursive: true });
}

async function exportFirestore() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const collections = [
    'burraco_games',
    'burraco_tournaments',
    'burraco_users',
    'burraco_meta',
    'burraco_pins',
    'burraco_friends',
    'burraco_notifications'
  ];

  console.log(`[Backup Firestore] Inizio esportazione database su Cloud Firestore (${timestamp})...`);
  const exportData = {
    exportedAt: new Date().toISOString(),
    collections: {}
  };

  for (const colName of collections) {
    try {
      const snap = await getDocs(collection(db, colName));
      exportData.collections[colName] = [];
      snap.forEach(docSnap => {
        exportData.collections[colName].push({
          _id: docSnap.id,
          ...docSnap.data()
        });
      });
      console.log(`✓ ${colName}: ${exportData.collections[colName].length} documenti esportati`);
    } catch (err) {
      console.warn(`! ${colName}: impossibile leggere (${err.message})`);
      exportData.collections[colName] = { error: err.message };
    }
  }

  const fileName = `firestore_export_${timestamp}.json`;
  const filePath = path.join(backupsDir, fileName);
  fs.writeFileSync(filePath, JSON.stringify(exportData, null, 2), 'utf-8');
  console.log(`✓ Snapshot Firestore salvato con successo in:\n  ${filePath}`);
  return filePath;
}

exportFirestore().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('[Backup Firestore] Errore critico:', err);
  process.exit(1);
});
