import { collection, getDocs } from 'firebase/firestore';
import { getCliFirebaseDb } from './firebase-cli-config.js';

const { db } = getCliFirebaseDb();

async function checkTournaments() {
  const colRef = collection(db, 'burraco_tournaments');
  const snap = await getDocs(colRef);
  console.log('Total tournaments in Firestore:', snap.size);
  snap.forEach(docSnap => {
    const t = docSnap.data();
    console.log(`- Tourn: ${docSnap.id} | Name: ${t.name} | Teams: ${t.teams?.length} | Rounds: ${t.rounds?.length}`);
  });
  process.exit(0);
}

checkTournaments().catch(err => {
  console.error(err);
  process.exit(1);
});
