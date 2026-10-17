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
export async function sendFriendRequest(currentUser, target) {
  if (!db || !currentUser || !target) throw new Error('Dati mancanti per inviare la richiesta');
  
  let targetUid = null;
  let targetName = '';
  let cleanEmail = '';
  let targetPhoto = null;

  if (typeof target === 'object' && target !== null) {
    targetUid = target.uid || null;
    targetName = target.displayName || target.name || '';
    cleanEmail = (target.email || '').trim().toLowerCase();
    targetPhoto = target.photoURL || null;
  } else if (typeof target === 'string') {
    const trimmed = target.trim();
    if (trimmed.includes('@')) {
      cleanEmail = trimmed.toLowerCase();
    } else {
      targetName = trimmed;
    }
  }

  // Controllo per evitare auto-richieste
  const myCleanEmail = (currentUser.email || '').trim().toLowerCase();
  if (cleanEmail && cleanEmail === myCleanEmail) {
    throw new Error('Non puoi inviare una richiesta di amicizia a te stesso');
  }
  if (targetUid && targetUid === currentUser.uid) {
    throw new Error('Non puoi inviare una richiesta di amicizia a te stesso');
  }

  // Cerca nella collezione burraco_users per completare o arricchire i dati
  try {
    const usersRef = collection(db, 'burraco_users');
    const snap = await getDocs(usersRef);
    if (!snap.empty) {
      const allUsers = snap.docs.map(d => d.data());
      let matched = null;
      if (targetUid) {
        matched = allUsers.find(u => u.uid === targetUid);
      }
      if (!matched && cleanEmail) {
        matched = allUsers.find(u => (u.email || '').trim().toLowerCase() === cleanEmail);
      }
      if (!matched && targetName) {
        matched = allUsers.find(u => (u.displayName || '').trim().toLowerCase() === targetName.toLowerCase());
      }

      if (matched) {
        targetUid = matched.uid;
        targetName = matched.displayName || targetName || cleanEmail;
        cleanEmail = (matched.email || cleanEmail).trim().toLowerCase();
        targetPhoto = matched.photoURL || targetPhoto;
      }
    }
  } catch (err) {
    console.warn('Ricerca utente registrato per amicizia:', err);
  }

  if (!cleanEmail && !targetUid) {
    throw new Error('Inserisci un indirizzo email valido o seleziona un membro del club');
  }

  if (cleanEmail === myCleanEmail || targetUid === currentUser.uid) {
    throw new Error('Non puoi inviare una richiesta di amicizia a te stesso');
  }

  // Genera ID deterministico per evitare richieste duplicate
  const targetKey = targetUid || cleanEmail.replace(/[^a-zA-Z0-9]/g, '_');
  const notifId = `req_${currentUser.uid}_${targetKey}`;
  const notifRef = doc(db, 'burraco_notifications', notifId);

  const payload = {
    id: notifId,
    type: 'friend_request',
    fromUid: currentUser.uid,
    fromName: currentUser.displayName || 'Giocatore Burraco',
    fromEmail: (currentUser.email || '').toLowerCase(),
    fromPhoto: currentUser.photoURL || null,
    toEmail: cleanEmail || null,
    toUid: targetUid || null,
    toName: targetName || cleanEmail,
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
 * Supporta sia notifiche indirizzate via toEmail che via toUid
 */
export function subscribeToMyNotifications(currentUser, onNotificationsChange) {
  if (!db || !currentUser) return () => {};

  const cleanEmail = (currentUser.email || '').trim().toLowerCase();
  const currentUid = currentUser.uid;
  const notifsRef = collection(db, 'burraco_notifications');

  let emailDocs = new Map();
  let uidDocs = new Map();

  const emit = () => {
    const merged = new Map([...emailDocs, ...uidDocs]);
    const list = Array.from(merged.values())
      .filter(item => item && item.status === 'pending');
    // Ordina dalla più recente alla più vecchia
    list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    onNotificationsChange(list);
  };

  let unsubEmail = () => {};
  if (cleanEmail) {
    const qEmail = query(notifsRef, where('toEmail', '==', cleanEmail));
    unsubEmail = onSnapshot(qEmail, (snap) => {
      emailDocs = new Map();
      snap.docs.forEach(docSnap => {
        emailDocs.set(docSnap.id, { id: docSnap.id, ...docSnap.data() });
      });
      emit();
    }, (err) => {
      console.warn('Avviso ascolto notifiche email:', err.message);
    });
  }

  let unsubUid = () => {};
  if (currentUid) {
    const qUid = query(notifsRef, where('toUid', '==', currentUid));
    unsubUid = onSnapshot(qUid, (snap) => {
      uidDocs = new Map();
      snap.docs.forEach(docSnap => {
        uidDocs.set(docSnap.id, { id: docSnap.id, ...docSnap.data() });
      });
      emit();
    }, (err) => {
      console.warn('Avviso ascolto notifiche UID:', err.message);
    });
  }

  return () => {
    unsubEmail();
    unsubUid();
  };
}

/**
 * Calcola lo stato online di un utente in base a lastSeen
 */
export function getFriendOnlineStatus(lastSeen) {
  if (!lastSeen) return { isOnline: false, label: 'Offline', color: 'slate' };
  try {
    const diffMs = Date.now() - new Date(lastSeen).getTime();
    const diffMins = Math.floor(diffMs / (60 * 1000));

    if (diffMins < 3) {
      return { isOnline: true, label: 'Online adesso', color: 'emerald' };
    } else if (diffMins < 60) {
      return { isOnline: false, label: `Attivo ${diffMins} min fa`, color: 'amber' };
    } else if (diffMins < 1440) {
      const hours = Math.floor(diffMins / 60);
      return { isOnline: false, label: `Attivo ${hours}h fa`, color: 'slate' };
    } else {
      return { isOnline: false, label: 'Offline', color: 'slate' };
    }
  } catch {
    return { isOnline: false, label: 'Offline', color: 'slate' };
  }
}

/**
 * Ascolta in tempo reale la lista degli amici confermati per l'utente, arricchita con lo stato di presenza live
 */
export function subscribeToMyFriends(currentUser, onFriendsChange) {
  if (!db || !currentUser?.uid) return () => {};

  const friendsRef = collection(db, 'burraco_friends');
  // Senza where('status', '==', 'accepted') nella query Firestore per non richiedere indici compositi
  const q = query(
    friendsRef,
    where('users', 'array-contains', currentUser.uid)
  );

  const userUnsubs = {};
  let friendsBase = [];
  const userProfiles = {};

  const notify = () => {
    const enriched = friendsBase.map(f => {
      const live = f?.uid ? userProfiles[f.uid] : null;
      return {
        ...f,
        ...(live || {})
      };
    });
    onFriendsChange(enriched);
  };

  const unsubFriends = onSnapshot(q, (snapshot) => {
    friendsBase = [];
    const activeUids = new Set();

    snapshot.docs.forEach(docSnap => {
      const data = docSnap.data();
      if (data.status !== 'accepted') return; // Filtro in memoria
      let other = null;
      if (data.user1?.uid === currentUser.uid) {
        other = { ...data.user2, friendshipId: docSnap.id };
      } else if (data.user2?.uid === currentUser.uid) {
        other = { ...data.user1, friendshipId: docSnap.id };
      }
      if (other) {
        friendsBase.push(other);
        if (other.uid) activeUids.add(other.uid);
      }
    });

    // Rimuovi listener per amici non più presenti
    Object.keys(userUnsubs).forEach(uid => {
      if (!activeUids.has(uid)) {
        if (typeof userUnsubs[uid] === 'function') userUnsubs[uid]();
        delete userUnsubs[uid];
        delete userProfiles[uid];
      }
    });

    // Iscriviti ai profili live per lastSeen e avatar in tempo reale
    activeUids.forEach(uid => {
      if (!userUnsubs[uid]) {
        const uRef = doc(db, 'burraco_users', uid);
        userUnsubs[uid] = onSnapshot(uRef, (uSnap) => {
          if (uSnap.exists()) {
            userProfiles[uid] = uSnap.data();
            notify();
          }
        }, (err) => {
          console.warn('Avviso ascolto presenza amico:', err.message);
        });
      }
    });

    notify();
  }, (err) => {
    console.warn('Avviso: ascolto amici confermati:', err.message);
  });

  return () => {
    unsubFriends();
    Object.values(userUnsubs).forEach(unsub => {
      if (typeof unsub === 'function') unsub();
    });
  };
}

/**
 * Ascolta in tempo reale l'elenco di tutti i membri registrati del Burraco Club (escluso l'utente corrente)
 */
export function subscribeToClubUsers(currentUser, onUsersChange) {
  if (!db) return () => {};
  const usersRef = collection(db, 'burraco_users');

  return onSnapshot(usersRef, (snapshot) => {
    const list = [];
    snapshot.docs.forEach(docSnap => {
      const u = docSnap.data();
      if (currentUser && u.uid === currentUser.uid) return;
      list.push(u);
    });
    // Ordina per nome alfabetico
    list.sort((a, b) => (a.displayName || a.email || '').localeCompare(b.displayName || b.email || ''));
    onUsersChange(list);
  }, (err) => {
    console.warn('Avviso ascolto membri club:', err.message);
  });
}

/**
 * Rimuove un'amicizia
 */
export async function removeFriend(friendshipId) {
  if (!db || !friendshipId) return;
  const friendRef = doc(db, 'burraco_friends', friendshipId);
  await deleteDoc(friendRef);
}
