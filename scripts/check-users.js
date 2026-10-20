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

async function checkUsers() {
  const colRef = collection(db, 'burraco_users');
  const snap = await getDocs(colRef);
  console.log('Total users in Firestore:', snap.size);
  snap.forEach(docSnap => {
    const u = docSnap.data();
    console.log(`- User: ${docSnap.id} | Name: ${u.displayName} | Email: ${u.email} | LastLogin: ${u.lastLogin || u.lastSeen} | Guests: ${JSON.stringify(u.guests || [])}`);
  });
  process.exit(0);
}

checkUsers().catch(err => {
  console.error(err);
  process.exit(1);
});
