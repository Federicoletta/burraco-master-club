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
