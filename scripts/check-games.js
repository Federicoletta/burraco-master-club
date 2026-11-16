import { collection, getDocs } from 'firebase/firestore';
import { getCliFirebaseDb } from './firebase-cli-config.js';

const { db } = getCliFirebaseDb();

async function check() {
  const colRef = collection(db, 'burraco_games');
  const snap = await getDocs(colRef);
  console.log('Total games in Firestore:', snap.size);
  snap.forEach(docSnap => {
    const g = docSnap.data();
    console.log(`- Game: ${docSnap.id} | Mode: ${g.mode} | Rounds: ${g.rounds?.length} | T1: ${g.team1?.name} (${g.rounds?.reduce((a,r)=>a+(r.team1Score||0),0)}) vs T2: ${g.team2?.name} (${g.rounds?.reduce((a,r)=>a+(r.team2Score||0),0)}) | Created: ${g.createdAt} | isFinished: ${g.isFinished}`);
  });
  process.exit(0);
}

check().catch(err => {
  console.error(err);
  process.exit(1);
});
