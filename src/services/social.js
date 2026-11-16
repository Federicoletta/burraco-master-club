import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  deleteDoc,
  arrayRemove,
} from 'firebase/firestore';
import {
  db,
  OperationType,
  handleFirestoreError,
  isPermissionOrQuotaError,
  isIndexMissingError,
} from './firebase';

/**
 * Invia una richiesta di amicizia a un utente tramite UID, Email o Nome Giocatore (case-insensitive)
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

  // Cerca nella directory pubblica (senza PII) per UID o Nome (case-insensitive via displayNameLower con fallback)
  try {
    const publicRef = collection(db, 'burraco_public_profiles');
    let matched = null;

    if (targetUid) {
      const pSnap = await getDoc(doc(db, 'burraco_public_profiles', targetUid));
      if (pSnap.exists()) {
        matched = pSnap.data();
      }
    } else if (targetName && !cleanEmail) {
      const qLower = query(publicRef, where('displayNameLower', '==', targetName.toLowerCase()), limit(1));
      const snapLower = await getDocs(qLower);
      if (!snapLower.empty) {
        matched = snapLower.docs[0].data();
      } else {
        const qExact = query(publicRef, where('displayName', '==', targetName), limit(1));
        const snapExact = await getDocs(qExact);
        if (!snapExact.empty) {
          matched = snapExact.docs[0].data();
        }
      }
    }

    if (matched) {
      targetUid = matched.uid || targetUid;
      targetName = matched.displayName || targetName || cleanEmail;
      targetPhoto = matched.photoURL || targetPhoto;
    }
  } catch (err) {
    if (isPermissionOrQuotaError(err)) {
      handleFirestoreError(err, OperationType.GET, 'burraco_public_profiles');
    }
    console.warn('Ricerca utente registrato per amicizia:', err);
  }

  if (!cleanEmail && !targetUid) {
    throw new Error('Inserisci un indirizzo email valido o seleziona un membro del club');
  }

  if (cleanEmail && cleanEmail === myCleanEmail) {
    throw new Error('Non puoi inviare una richiesta di amicizia a te stesso');
  }
  if (targetUid && targetUid === currentUser.uid) {
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
    fromName: (currentUser.displayName || 'Giocatore Burraco').slice(0, 100),
    fromEmail: (currentUser.email || '').toLowerCase(),
    fromPhoto: currentUser.photoURL || null,
    toEmail: cleanEmail || null,
    toUid: targetUid || null,
    toName: (targetName || cleanEmail).slice(0, 100),
    toPhoto: targetPhoto || null,
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  try {
    await setDoc(notifRef, payload, { merge: true });
    return payload;
  } catch (err) {
    if (isPermissionOrQuotaError(err)) {
      handleFirestoreError(err, OperationType.WRITE, `burraco_notifications/${notifId}`);
    }
    throw err;
  }
}

/**
 * Risponde a una richiesta di amicizia (Accetta o Rifiuta)
 */
export async function respondToFriendRequest(notification, accept, currentUser) {
  if (!db || !notification?.id) return;
  const notifRef = doc(db, 'burraco_notifications', notification.id);

  if (accept) {
    const toEmail = (currentUser?.email || '').toLowerCase();
    const fromEmail = (notification?.fromEmail || '').toLowerCase();
    const fromUid = notification?.fromUid;
    const currentUid = currentUser?.uid;

    if (!currentUid || !fromUid) {
      throw new Error('Dati utente non validi per completare l\'amicizia');
    }

    try {
      // 1. Aggiorna lo stato della notifica
      await setDoc(notifRef, {
        status: 'accepted',
        acceptedAt: new Date().toISOString(),
        toUid: currentUid,
        toName: (currentUser.displayName || 'Amico Burraco').slice(0, 100),
        toPhoto: currentUser.photoURL || null
      }, { merge: true });

      // 2. Crea il legame di amicizia bidirezionale nella collezione burraco_friends
      const uidA = currentUid < fromUid ? currentUid : fromUid;
      const uidB = currentUid < fromUid ? fromUid : currentUid;
      const friendshipId = `friend_${uidA}_${uidB}`;

      const friendRef = doc(db, 'burraco_friends', friendshipId);
      await setDoc(friendRef, {
        id: friendshipId,
        users: [currentUid, fromUid],
        emails: [toEmail, fromEmail].filter(Boolean),
        user1: {
          uid: currentUid,
          displayName: (currentUser.displayName || 'Giocatore').slice(0, 100),
          email: toEmail,
          photoURL: currentUser.photoURL || null
        },
        user2: {
          uid: fromUid,
          displayName: (notification.fromName || 'Giocatore').slice(0, 100),
          email: fromEmail,
          photoURL: notification.fromPhoto || null
        },
        status: 'accepted',
        createdAt: new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      if (isPermissionOrQuotaError(err)) {
        handleFirestoreError(err, OperationType.WRITE, `burraco_notifications/${notification.id}`);
      }
      throw err;
    }
  } else {
    try {
      await setDoc(notifRef, {
        status: 'declined',
        declinedAt: new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      if (isPermissionOrQuotaError(err)) {
        handleFirestoreError(err, OperationType.UPDATE, `burraco_notifications/${notification.id}`);
      }
      throw err;
    }
  }
}

/**
 * Invia un invito alla partita a un amico registrato
 */
export async function sendGameInvite(currentUser, friend, game, teamName) {
  if (!db || !currentUser || !friend || !game?.id) return;

  const toEmail = (friend.email || '').toLowerCase();
  const toUid = friend.uid || null;
  const targetKey = toUid || toEmail.replace(/[^a-zA-Z0-9]/g, '_');
  const notifId = `invite_${game.id}_${targetKey}`;

  const notifRef = doc(db, 'burraco_notifications', notifId);
  const payload = {
    id: notifId,
    type: 'game_invite',
    gameId: game.id,
    gameName: `Tavolo Burraco (${game.mode === 'trio' ? 'A 3' : 'A Coppie'})`,
    teamName: (teamName || 'In Partita').slice(0, 100),
    fromUid: currentUser.uid,
    fromName: (currentUser.displayName || 'Giocatore Burraco').slice(0, 100),
    fromEmail: (currentUser.email || '').toLowerCase(),
    fromPhoto: currentUser.photoURL || null,
    toEmail: toEmail || null,
    toUid,
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  try {
    await setDoc(notifRef, payload, { merge: true });
    return payload;
  } catch (err) {
    if (isPermissionOrQuotaError(err)) {
      handleFirestoreError(err, OperationType.WRITE, `burraco_notifications/${notifId}`);
    }
    throw err;
  }
}

/**
 * Risponde a un invito a una partita
 */
export async function respondToGameInvite(notification, accept) {
  if (!db || !notification?.id) return;
  const notifRef = doc(db, 'burraco_notifications', notification.id);

  try {
    await setDoc(notifRef, {
      status: accept ? 'accepted' : 'declined',
      respondedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    if (isPermissionOrQuotaError(err)) {
      handleFirestoreError(err, OperationType.UPDATE, `burraco_notifications/${notification.id}`);
    }
    throw err;
  }
}

function subscribeOrderedNotifications(orderedQ, fallbackQ, onSnap, path) {
  let activeUnsub = () => {};
  let unsubscribed = false;

  const attach = (qToUse, allowFallback) => {
    activeUnsub = onSnapshot(qToUse, onSnap, (err) => {
      if (unsubscribed) return;
      if (allowFallback && isIndexMissingError(err)) {
        activeUnsub();
        attach(fallbackQ, false);
        return;
      }
      if (isPermissionOrQuotaError(err)) {
        handleFirestoreError(err, OperationType.LIST, path);
      }
      console.warn('Avviso ascolto notifiche:', err.message);
    });
  };

  attach(orderedQ, true);

  return () => {
    unsubscribed = true;
    activeUnsub();
  };
}

/**
 * Ascolta in tempo reale le notifiche pendenti per l'utente collegato (limitate alle 50 più recenti)
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
    unsubEmail = subscribeOrderedNotifications(
      query(notifsRef, where('toEmail', '==', cleanEmail), where('status', '==', 'pending'), orderBy('createdAt', 'desc'), limit(50)),
      query(notifsRef, where('toEmail', '==', cleanEmail), where('status', '==', 'pending'), limit(50)),
      (snap) => {
        emailDocs = new Map();
        snap.docs.forEach(docSnap => {
          emailDocs.set(docSnap.id, { id: docSnap.id, ...docSnap.data() });
        });
        emit();
      },
      'burraco_notifications'
    );
  }

  let unsubUid = () => {};
  if (currentUid) {
    unsubUid = subscribeOrderedNotifications(
      query(notifsRef, where('toUid', '==', currentUid), where('status', '==', 'pending'), orderBy('createdAt', 'desc'), limit(50)),
      query(notifsRef, where('toUid', '==', currentUid), where('status', '==', 'pending'), limit(50)),
      (snap) => {
        uidDocs = new Map();
        snap.docs.forEach(docSnap => {
          uidDocs.set(docSnap.id, { id: docSnap.id, ...docSnap.data() });
        });
        emit();
      },
      'burraco_notifications'
    );
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
 * Ascolta in tempo reale la lista degli amici confermati per l'utente, arricchita con stato presenza dal profilo pubblico
 */
export function subscribeToMyFriends(currentUser, onFriendsChange) {
  if (!db || !currentUser?.uid) return () => {};

  const friendsRef = collection(db, 'burraco_friends');
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
      if (data.status !== 'accepted') return;
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

    // Iscriviti ai profili pubblici live per lastSeen, careerStats e avatar in tempo reale
    activeUids.forEach(uid => {
      if (!userUnsubs[uid]) {
        const pubRef = doc(db, 'burraco_public_profiles', uid);
        userUnsubs[uid] = onSnapshot(pubRef, (uSnap) => {
          if (uSnap.exists()) {
            userProfiles[uid] = uSnap.data();
            notify();
          }
        }, (err) => {
          if (isPermissionOrQuotaError(err)) {
            handleFirestoreError(err, OperationType.GET, `burraco_public_profiles/${uid}`);
          }
          console.warn('Avviso ascolto presenza amico:', err.message);
        });
      }
    });

    notify();
  }, (err) => {
    if (isPermissionOrQuotaError(err)) {
      handleFirestoreError(err, OperationType.LIST, 'burraco_friends');
    }
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
 * Ascolta in tempo reale l'elenco pubblico (zero PII) dei membri registrati del Burraco Club
 */
export function subscribeToClubUsers(currentUser, onUsersChange) {
  if (!db || !currentUser?.uid) return () => {};
  const publicRef = collection(db, 'burraco_public_profiles');
  const q = query(publicRef, limit(100));

  return onSnapshot(q, (snapshot) => {
    const list = [];
    snapshot.docs.forEach(docSnap => {
      const u = docSnap.data();
      if (currentUser && u.uid === currentUser.uid) return;
      list.push(u);
    });
    list.sort((a, b) => (a.displayName || '').localeCompare(b.displayName || ''));
    onUsersChange(list);
  }, (err) => {
    if (isPermissionOrQuotaError(err)) {
      handleFirestoreError(err, OperationType.LIST, 'burraco_public_profiles');
    }
    console.warn('Avviso ascolto membri club:', err.message);
  });
}

/**
 * Rimuove un'amicizia e pulisce automaticamente l'eventuale UID residuo da closeFriends
 */
export async function removeFriend(friendshipId, currentUser = null, friendUid = null) {
  if (!db || !friendshipId) return;
  const friendRef = doc(db, 'burraco_friends', friendshipId);

  try {
    let targetFriendUid = friendUid;
    if (!targetFriendUid && currentUser?.uid) {
      try {
        const snap = await getDoc(friendRef);
        if (snap.exists()) {
          const users = snap.data()?.users || [];
          targetFriendUid = users.find(uid => uid && uid !== currentUser.uid) || null;
        }
      } catch {
        // ignore pre-read failure
      }
    }

    await deleteDoc(friendRef);

    if (currentUser?.uid && targetFriendUid) {
      try {
        const userRef = doc(db, 'burraco_users', currentUser.uid);
        await setDoc(userRef, {
          closeFriends: arrayRemove(targetFriendUid),
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (cleanupErr) {
        console.warn('Avviso pulizia closeFriends dopo removeFriend:', cleanupErr?.message);
      }
    }
  } catch (err) {
    if (isPermissionOrQuotaError(err)) {
      handleFirestoreError(err, OperationType.DELETE, `burraco_friends/${friendshipId}`);
    }
    throw err;
  }
}

/**
 * Aggiunge o rimuove un amico dalla lista degli "Amici Stretti" (closeFriends)
 */
export async function toggleCloseFriend(currentUser, friendUid) {
  if (!db || !currentUser?.uid || !friendUid) return false;
  const path = `burraco_users/${currentUser.uid}`;
  try {
    const userRef = doc(db, 'burraco_users', currentUser.uid);
    const snap = await getDoc(userRef);
    let currentClose = [];
    if (snap.exists() && Array.isArray(snap.data().closeFriends)) {
      currentClose = snap.data().closeFriends;
    }
    const isClose = currentClose.includes(friendUid);
    const newClose = isClose
      ? currentClose.filter(id => id !== friendUid)
      : [...currentClose, friendUid];
    await setDoc(userRef, {
      closeFriends: newClose,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    return !isClose;
  } catch (err) {
    if (isPermissionOrQuotaError(err)) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
    console.warn('Errore toggleCloseFriend:', err.message);
    throw err;
  }
}

/**
 * Ascolta in tempo reale il profilo utente privato (inclusi closeFriends e guests)
 */
export function subscribeToMyProfile(currentUser, onProfileChange) {
  if (!db || !currentUser?.uid) return () => {};
  const path = `burraco_users/${currentUser.uid}`;
  try {
    const userRef = doc(db, 'burraco_users', currentUser.uid);
    return onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        onProfileChange(snap.data());
      }
    }, (err) => {
      if (isPermissionOrQuotaError(err)) {
        handleFirestoreError(err, OperationType.GET, path);
      }
      console.warn('Errore ascolto profilo utente:', err.message);
    });
  } catch (err) {
    console.warn('subscribeToMyProfile error:', err);
    return () => {};
  }
}
