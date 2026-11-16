import { collection, getDocs } from 'firebase/firestore';
import { getCliFirebaseDb } from './firebase-cli-config.js';

const { db } = getCliFirebaseDb();

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
