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
