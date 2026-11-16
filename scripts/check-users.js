import { collection, getDocs } from 'firebase/firestore';
import { getCliFirebaseDb } from './firebase-cli-config.js';

const { db } = getCliFirebaseDb();

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
