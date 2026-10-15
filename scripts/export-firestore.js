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
  const collections = ['burraco_games', 'burraco_tournaments', 'burraco_meta'];
  const exportData = {
    exportedAt: new Date().toISOString(),
    projectId: firebaseConfig.projectId,
    collections: {}
  };

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
  console.log(`Esportazione completata con successo: ${outPath}`);
  process.exit(0);
}

exportFirestore().catch(err => {
  console.error('Fatal export error:', err);
  process.exit(1);
});
