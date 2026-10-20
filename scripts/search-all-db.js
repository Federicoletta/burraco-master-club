import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

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

async function searchAll() {
  const collections = ['burraco_games', 'burraco_tournaments', 'burraco_meta', 'burraco_users', 'burraco_friends', 'burraco_notifications'];
  for (const c of collections) {
    const snap = await getDocs(collection(db, c));
    snap.forEach(d => {
      const str = JSON.stringify(d.data());
      if (/susi|bufu|bufi/i.test(str)) {
        console.log(`FOUND in collection ${c}, doc ${d.id}:`, str);
      }
    });
  }
  process.exit(0);
}

searchAll().catch(e => { console.error(e); process.exit(1); });
