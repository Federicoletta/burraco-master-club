import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { getCliFirebaseDb } from './firebase-cli-config.js';

const { db } = getCliFirebaseDb();

async function updateGameNames() {
  const gameRef = doc(db, 'burraco_games', 'game_1792450259162');
  const snap = await getDoc(gameRef);
  if (!snap.exists()) {
    console.error('Game not found!');
    process.exit(1);
  }
  const current = snap.data();
  console.log('Current game:', current.id, current.team1?.name, 'vs', current.team2?.name, 'Rounds:', current.rounds?.length);

  await updateDoc(gameRef, {
    'team1.name': 'I susi',
    'team2.name': 'I bufu',
    updatedAt: new Date().toISOString(),
  });

  const updatedSnap = await getDoc(gameRef);
  console.log('Updated game:', updatedSnap.data().team1?.name, 'vs', updatedSnap.data().team2?.name, 'Rounds:', updatedSnap.data().rounds?.length);
  process.exit(0);
}

updateGameNames().catch(e => {
  console.error(e);
  process.exit(1);
});
