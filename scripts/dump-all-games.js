import { collection, getDocs } from 'firebase/firestore';
import { getCliFirebaseDb } from './firebase-cli-config.js';

const { db } = getCliFirebaseDb();

async function dump() {
  const colRef = collection(db, 'burraco_games');
  const snap = await getDocs(colRef);
  snap.forEach(d => {
    const data = d.data();
    console.log(JSON.stringify({
      id: d.id,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      isFinished: data.isFinished,
      team1: data.team1,
      team2: data.team2,
      team3: data.team3,
      rounds: data.rounds,
      ownerUid: data.ownerUid,
    }, null, 2));
  });
  process.exit(0);
}

dump().catch(e => { console.error(e); process.exit(1); });
