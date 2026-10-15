import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  onSnapshot, 
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';

/**
 * Invia una richiesta di amicizia a un utente tramite la sua email
 */
export async function sendFriendRequest(currentUser, targetEmail) {
  if (!db || !currentUser || !targetEmail) throw new Error('Dati mancanti per inviare la richiesta');
  
  const cleanEmail = targetEmail.trim().toLowerCase();
  if (cleanEmail === currentUser.email?.toLowerCase()) {
    throw new Error('Non puoi inviare una richiesta di amicizia a te stesso');
  }

  // Cerca se esiste un utente registrato con questa email per recuperare il suo UID
  let targetUid = null;
  let targetName = cleanEmail;
  try {
    const usersRef = collection(db, 'burraco_users');
    const q = query(usersRef, where('email', '==', cleanEmail));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const uDoc = snap.docs[0].data();
      targetUid = uDoc.uid;
      targetName = uDoc.displayName || cleanEmail;
    }
  } catch (err) {
    console.warn('Ricerca utente per email fallita:', err);
  }

  // Genera ID deterministico per evitare richieste duplicate
  const notifId = `req_${currentUser.uid}_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;
  const notifRef = doc(db, 'burraco_notifications', notifId);

  const payload = {
    id: notifId,
    type: 'friend_request',
    fromUid: currentUser.uid,
    fromName: currentUser.displayName || 'Giocatore Burraco',
    fromEmail: (currentUser.email || '').toLowerCase(),
    fromPhoto: currentUser.photoURL || null,
    toEmail: cleanEmail,
    toUid: targetUid,
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  await setDoc(notifRef, payload, { merge: true });
  return payload;
}

/**
 * Risponde a una richiesta di amicizia (Accetta o Rifiuta)
 */
export async function respondToFriendRequest(notification, accept, currentUser) {
  if (!db || !notification?.id) return;
  const notifRef = doc(db, 'burraco_notifications', notification.id);

  if (accept) {
    // 1. Aggiorna lo stato della notifica
    await setDoc(notifRef, {
      status: 'accepted',
      acceptedAt: new Date().toISOString(),
      toUid: currentUser.uid,
      toName: currentUser.displayName || 'Amico Burraco',
      toPhoto: currentUser.photoURL || null
    }, { merge: true });

    // 2. Crea il legame di amicizia bidirezionale nella collezione burraco_friends
    const uidA = currentUser.uid < notification.fromUid ? currentUser.uid : notification.fromUid;
    const uidB = currentUser.uid < notification.fromUid ? notification.fromUid : currentUser.uid;
    const friendshipId = `friend_${uidA}_${uidB}`;

    const friendRef = doc(db, 'burraco_friends', friendshipId);
    await setDoc(friendRef, {
      id: friendshipId,
      users: [currentUser.uid, notification.fromUid],
      emails: [currentUser.email.toLowerCase(), notification.fromEmail.toLowerCase()],
      user1: {
        uid: currentUser.uid,
        displayName: currentUser.displayName || 'Giocatore',
        email: currentUser.email.toLowerCase(),
        photoURL: currentUser.photoURL || null
      },
      user2: {
        uid: notification.fromUid,
        displayName: notification.fromName || 'Giocatore',
        email: notification.fromEmail.toLowerCase(),
        photoURL: notification.fromPhoto || null
      },
      status: 'accepted',
      createdAt: new Date().toISOString()
    }, { merge: true });
  } else {
    // Rifiutata: contrassegna come rifiutata o rimuovi
    await setDoc(notifRef, {
      status: 'declined',
      declinedAt: new Date().toISOString()
    }, { merge: true });
  }
}

/**
 * Invia un invito alla partita a un amico registrato
 */
export async function sendGameInvite(currentUser, friend, game, teamName) {
  if (!db || !currentUser || !friend || !game?.id) return;

  const toEmail = (friend.email || '').toLowerCase();
  const toUid = friend.uid || null;
  const notifId = `invite_${game.id}_${toUid || toEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;

  const notifRef = doc(db, 'burraco_notifications', notifId);
  const payload = {
    id: notifId,
    type: 'game_invite',
    gameId: game.id,
    gameName: `Tavolo Burraco (${game.mode === 'trio' ? 'A 3' : 'A Coppie'})`,
    teamName: teamName || 'In Partita',
    fromUid: currentUser.uid,
    fromName: currentUser.displayName || 'Giocatore Burraco',
    fromEmail: (currentUser.email || '').toLowerCase(),
    fromPhoto: currentUser.photoURL || null,
    toEmail,
    toUid,
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  await setDoc(notifRef, payload, { merge: true });
  return payload;
}

/**
 * Risponde a un invito a una partita
 */
export async function respondToGameInvite(notification, accept) {
  if (!db || !notification?.id) return;
  const notifRef = doc(db, 'burraco_notifications', notification.id);

  await setDoc(notifRef, {
    status: accept ? 'accepted' : 'declined',
    respondedAt: new Date().toISOString()
  }, { merge: true });
}

/**
 * Ascolta in tempo reale le notifiche pendenti per l'utente collegato
 */
export function subscribeToMyNotifications(currentUser, onNotificationsChange) {
  if (!db || !currentUser?.email) return () => {};

  const cleanEmail = currentUser.email.toLowerCase();
  const notifsRef = collection(db, 'burraco_notifications');

  // Ascolta le notifiche pendenti destinate alla mia email
  const q = query(
    notifsRef,
    where('toEmail', '==', cleanEmail),
    where('status', '==', 'pending')
  );

  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    // Ordina dalla più recente alla più vecchia
    list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    onNotificationsChange(list);
  }, (err) => {
    console.warn('Avviso: ascolto notifiche pendenti:', err.message);
  });
}

/**
 * Ascolta in tempo reale la lista degli amici confermati per l'utente
 */
export function subscribeToMyFriends(currentUser, onFriendsChange) {
  if (!db || !currentUser?.uid) return () => {};

  const friendsRef = collection(db, 'burraco_friends');
  const q = query(
    friendsRef,
    where('users', 'array-contains', currentUser.uid),
    where('status', '==', 'accepted')
  );

  return onSnapshot(q, (snapshot) => {
    const friends = [];
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      // Estrai l'altro amico (non me stesso)
      if (data.user1?.uid === currentUser.uid) {
        friends.push(data.user2);
      } else if (data.user2?.uid === currentUser.uid) {
        friends.push(data.user1);
      }
    });
    onFriendsChange(friends);
  }, (err) => {
    console.warn('Avviso: ascolto amici confermati:', err.message);
  });
}
