import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useAlert } from '../context/confirmContextStore';
import { joinCloudGame } from '../services/firebase';
import {
  sendFriendRequest,
  respondToFriendRequest,
  sendGameInvite,
  respondToGameInvite,
  subscribeToMyNotifications,
  subscribeToMyFriends,
  subscribeToFriendsPresence,
  subscribeToClubUsers,
  removeFriend,
  toggleCloseFriend,
  subscribeToMyProfile,
  getFriendOnlineStatus
} from '../services/social';
import { sound } from '../utils/soundEffects';

const NOOP = () => {};
const ASYNC_NOOP = async () => {};
const EMPTY_ARRAY = [];

export function useSocialClub(authState = null) {
  const customAlert = useAlert();
  const currentUser = authState?.currentUser ?? null;
  const welcomeUser = authState?.welcomeUser ?? null;
  const setWelcomeUser = authState?.setWelcomeUser ?? NOOP;
  const authHandleLogin = authState?.handleLogin ?? ASYNC_NOOP;
  const authHandleLogout = authState?.handleLogout ?? ASYNC_NOOP;

  const [rawFriendsList, setRawFriendsList] = useState([]);
  const [liveFriendProfiles, setLiveFriendProfiles] = useState({});
  const [closeFriends, setCloseFriends] = useState([]);
  const [clubUsers, setClubUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [toastNotification, setToastNotification] = useState(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileInitialTab, setProfileInitialTab] = useState('profile');

  const prevNotifIdsRef = useRef([]);
  const currentUserRef = useRef(currentUser);
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  const currentUid = currentUser?.uid || null;
  const currentEmail = currentUser?.email || '';

  const handleOpenProfile = useCallback((tab = 'profile') => {
    setProfileInitialTab(tab);
    setIsProfileOpen(true);
  }, []);

  // 1. Ascolto real-time Notifiche, Amici e Profilo (dipende da UID/email stabili)
  useEffect(() => {
    if (!currentUid) {
      prevNotifIdsRef.current = [];
      return undefined;
    }

    const userIdentity = { uid: currentUid, email: currentEmail };

    const unsubProfile = subscribeToMyProfile(userIdentity, (profileData) => {
      if (profileData && Array.isArray(profileData.closeFriends)) {
        setCloseFriends(profileData.closeFriends);
      }
    });

    const unsubNotifs = subscribeToMyNotifications(userIdentity, (notifs) => {
      if (Array.isArray(notifs)) {
        setToastNotification(prevToast => {
          if (!prevToast) return null;
          const isStillPending = notifs.some(n => n.id === prevToast.id && n.status === 'pending');
          return isStillPending ? prevToast : null;
        });

        const newPendings = notifs.filter(
          n => !prevNotifIdsRef.current.includes(n.id) && n.status === 'pending'
        );
        if (newPendings.length > 0) {
          sound.playNotification();
          setToastNotification(newPendings[0]);
        }
        prevNotifIdsRef.current = notifs.map(n => n.id);
      }
      setNotifications(notifs);
    });

    const unsubFriends = subscribeToMyFriends(userIdentity, (friends) => {
      setRawFriendsList(friends);
    });

    return () => {
      unsubProfile();
      unsubNotifs();
      unsubFriends();
    };
  }, [currentUid, currentEmail]);

  const activeRawFriends = currentUid ? rawFriendsList : EMPTY_ARRAY;
  const activeCloseFriends = currentUid ? closeFriends : EMPTY_ARRAY;
  const activeClubUsers = currentUid ? clubUsers : EMPTY_ARRAY;
  const activeNotifications = currentUid ? notifications : EMPTY_ARRAY;
  const activeToastNotification = currentUid ? toastNotification : null;

  const friendUidsKey = useMemo(
    () => (activeRawFriends || []).map(f => f?.uid).filter(Boolean).sort().join(','),
    [activeRawFriends]
  );

  // Arricchisce gli amici con il flag isCloseFriend, presenza live (se profilo aperto) e ordina gli Amici Stretti in cima
  const friendsList = useMemo(() => {
    if (!currentUid) return EMPTY_ARRAY;
    return (activeRawFriends || []).map(f => {
      const liveProfile = isProfileOpen && f?.uid ? liveFriendProfiles[f.uid] : null;
      const merged = liveProfile ? { ...f, ...liveProfile } : f;
      return {
        ...merged,
        isOnline: getFriendOnlineStatus(merged?.lastSeen).isOnline,
        isCloseFriend: activeCloseFriends.includes(merged.uid)
      };
    }).sort((a, b) => {
      if (a.isCloseFriend && !b.isCloseFriend) return -1;
      if (!a.isCloseFriend && b.isCloseFriend) return 1;
      return (a.displayName || a.email || '').localeCompare(b.displayName || b.email || '');
    });
  }, [currentUid, activeRawFriends, liveFriendProfiles, isProfileOpen, activeCloseFriends]);

  // 3. Ascolto soci, membri club e presenza live amici su richiesta (solo ad apertura profilo per risparmio letture DB)
  useEffect(() => {
    if (!currentUid || !isProfileOpen) {
      return;
    }
    const unsubClub = subscribeToClubUsers({ uid: currentUid }, (cUsers) => {
      setClubUsers(cUsers);
    });
    const friendUids = friendUidsKey ? friendUidsKey.split(',').filter(Boolean) : [];
    const unsubPresence = subscribeToFriendsPresence(friendUids, (profilesMap) => {
      setLiveFriendProfiles(profilesMap);
    });
    return () => {
      unsubClub();
      unsubPresence();
    };
  }, [currentUid, isProfileOpen, friendUidsKey]);

  // Login delegato ad AuthProvider
  const handleLogin = authHandleLogin;

  // Logout con chiusura pulita pannello profilo e reset stato locale
  const handleLogout = useCallback(async () => {
    setIsProfileOpen(false);
    setNotifications([]);
    setRawFriendsList([]);
    setLiveFriendProfiles({});
    setCloseFriends([]);
    setClubUsers([]);
    setToastNotification(null);
    prevNotifIdsRef.current = [];
    await authHandleLogout();
  }, [authHandleLogout]);

  // Richiesta di amicizia
  const handleSendFriendRequest = useCallback(async (target) => {
    const user = currentUserRef.current;
    if (!user) throw new Error('Devi prima accedere con il tuo account Google');
    return await sendFriendRequest(user, target);
  }, []);

  // Rimozione amico (accetta sia oggetto friend che friendshipId stringa)
  const handleRemoveFriend = useCallback(async (friendOrId) => {
    const user = currentUserRef.current;
    const friendshipId = typeof friendOrId === 'string' ? friendOrId : friendOrId?.friendshipId;
    const friendUid = typeof friendOrId === 'object' && friendOrId !== null ? friendOrId.uid : null;
    if (!friendshipId) return;
    try {
      await removeFriend(friendshipId, user, friendUid);
      if (friendUid) {
        setCloseFriends(prev => prev.filter(id => id !== friendUid));
      }
    } catch (err) {
      console.error('Errore rimozione amicizia:', err);
      customAlert({
        title: 'Errore Rimozione',
        message: 'Impossibile rimuovere l\'amico: ' + (err.message || err),
        variant: 'danger'
      });
    }
  }, [customAlert]);

  // Imposta o rimuove un amico dagli Amici Stretti ⭐
  const handleToggleCloseFriend = useCallback(async (friend) => {
    const user = currentUserRef.current;
    if (!user || !friend?.uid) return;
    const friendUid = friend.uid;
    // Aggiornamento ottimistico
    setCloseFriends(prev => {
      const isClose = prev.includes(friendUid);
      return isClose ? prev.filter(id => id !== friendUid) : [...prev, friendUid];
    });
    try {
      const isNowClose = await toggleCloseFriend(user, friendUid);
      sound.playTrophy();
      return isNowClose;
    } catch (err) {
      console.error('Errore toggle close friend:', err);
      // Rollback
      setCloseFriends(prev => {
        const isClose = prev.includes(friendUid);
        return isClose ? prev.filter(id => id !== friendUid) : [...prev, friendUid];
      });
      customAlert({
        title: 'Amici Stretti',
        message: 'Impossibile aggiornare gli Amici Stretti: ' + (err.message || err),
        variant: 'danger'
      });
    }
  }, [customAlert]);

  // Accetta richiesta amicizia
  const handleAcceptFriendRequest = useCallback(async (notification) => {
    try {
      setToastNotification(null);
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
      if (!prevNotifIdsRef.current.includes(notification.id)) {
        prevNotifIdsRef.current.push(notification.id);
      }
      await respondToFriendRequest(notification, true, currentUserRef.current);
    } catch (err) {
      console.error('Errore accettazione amicizia:', err);
      customAlert({
        title: 'Richiesta Amicizia',
        message: 'Impossibile accettare la richiesta: ' + (err.message || err),
        variant: 'danger'
      });
    }
  }, [customAlert]);

  // Rifiuta richiesta amicizia
  const handleDeclineFriendRequest = useCallback(async (notification) => {
    try {
      setToastNotification(null);
      await respondToFriendRequest(notification, false, currentUserRef.current);
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    } catch (err) {
      console.error('Errore rifiuto amicizia:', err);
    }
  }, []);

  // Accetta invito al tavolo
  const handleAcceptGameInvite = useCallback(async (notification, onJoinedCloudGame) => {
    try {
      setToastNotification(null);
      await respondToGameInvite(notification, true);
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
      setIsNotificationsOpen(false);

      if (notification.gameId) {
        if (typeof onJoinedCloudGame === 'function') {
          onJoinedCloudGame(notification.gameId);
        } else {
          try {
            const url = new URL(window.location.href);
            url.searchParams.set('game', notification.gameId);
            window.history.replaceState({}, '', url.toString());
          } catch {
            // ignore
          }
        }
      }
    } catch (err) {
      console.error('Errore accettazione partita:', err);
      customAlert({
        title: 'Tavolo di Gioco',
        message: 'Impossibile entrare al tavolo: ' + (err.message || err),
        variant: 'warning'
      });
    }
  }, [customAlert]);

  // Rifiuta invito al tavolo
  const handleDeclineGameInvite = useCallback(async (notification) => {
    try {
      setToastNotification(null);
      await respondToGameInvite(notification, false);
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    } catch (err) {
      console.error('Errore rifiuto partita:', err);
    }
  }, []);

  // Invita amico al tavolo attivo
  const handleInviteFriendToActiveGame = useCallback(async (friend, activeGame) => {
    const user = currentUserRef.current;
    if (!user || !activeGame || !friend) return;
    try {
      let teamName = 'Al Tavolo';
      const t1Count = activeGame.team1?.players?.length || 0;
      const t2Count = activeGame.team2?.players?.length || 0;
      if (t1Count < 2) {
        teamName = activeGame.team1?.name || 'Squadra 1';
      } else if (t2Count < 2) {
        teamName = activeGame.team2?.name || 'Squadra 2';
      }
      if (friend.isCloseFriend) {
        // ⭐ Amico Stretto: entra direttamente nel live sync del tavolo
        await joinCloudGame(activeGame.id, friend);
      }
      await sendGameInvite(user, friend, activeGame, teamName);
      sound.playTrophy();
      return { success: true };
    } catch (err) {
      console.error('Errore invio invito al tavolo attivo:', err);
      throw err;
    }
  }, []);

  return useMemo(() => ({
    currentUser,
    friendsList,
    closeFriends: activeCloseFriends,
    clubUsers: activeClubUsers,
    notifications: activeNotifications,
    toastNotification: activeToastNotification,
    setToastNotification,
    welcomeUser,
    setWelcomeUser,
    isNotificationsOpen,
    setIsNotificationsOpen,
    isProfileOpen,
    setIsProfileOpen,
    profileInitialTab,
    setProfileInitialTab,
    handleOpenProfile,
    handleLogin,
    handleLogout,
    handleSendFriendRequest,
    handleRemoveFriend,
    handleToggleCloseFriend,
    handleAcceptFriendRequest,
    handleDeclineFriendRequest,
    handleAcceptGameInvite,
    handleDeclineGameInvite,
    handleInviteFriendToActiveGame,
  }), [
    currentUser,
    friendsList,
    activeCloseFriends,
    activeClubUsers,
    activeNotifications,
    activeToastNotification,
    welcomeUser,
    setWelcomeUser,
    isNotificationsOpen,
    isProfileOpen,
    profileInitialTab,
    handleOpenProfile,
    handleLogin,
    handleLogout,
    handleSendFriendRequest,
    handleRemoveFriend,
    handleToggleCloseFriend,
    handleAcceptFriendRequest,
    handleDeclineFriendRequest,
    handleAcceptGameInvite,
    handleDeclineGameInvite,
    handleInviteFriendToActiveGame,
  ]);
}
