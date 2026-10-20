import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, orderBy } from 'firebase/firestore';

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
