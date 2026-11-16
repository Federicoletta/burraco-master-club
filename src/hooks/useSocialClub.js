import { useState, useEffect, useRef, useMemo } from 'react';
import { useAlert } from '../context/confirmContextStore';
import { 
  loginWithGoogle, 
  logoutUser, 
  subscribeToAuth,
  joinCloudGame
} from '../services/firebase';
import { 
  sendFriendRequest,
  respondToFriendRequest,
  sendGameInvite,
  respondToGameInvite,
  subscribeToMyNotifications,
  subscribeToMyFriends,
  subscribeToClubUsers,
  removeFriend,
  toggleCloseFriend,
  subscribeToMyProfile
} from '../services/social';
import { sound } from '../utils/soundEffects';

export function useSocialClub() {
  const customAlert = useAlert();
  const [currentUser, setCurrentUser] = useState(null);
  const [rawFriendsList, setRawFriendsList] = useState([]);
  const [closeFriends, setCloseFriends] = useState([]);
  const [clubUsers, setClubUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [toastNotification, setToastNotification] = useState(null);
  const [welcomeUser, setWelcomeUser] = useState(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileInitialTab, setProfileInitialTab] = useState('profile');

  const prevNotifIdsRef = useRef([]);

  const handleOpenProfile = (tab = 'profile') => {
    setProfileInitialTab(tab);
    setIsProfileOpen(true);
  };

  // 1. Ascolto stato autenticazione Google
  useEffect(() => {
    const unsubAuth = subscribeToAuth((user) => {
      setCurrentUser(user);
      if (!user) {
        setNotifications([]);
        setRawFriendsList([]);
        setCloseFriends([]);
        setClubUsers([]);
        setToastNotification(null);
        prevNotifIdsRef.current = [];
      }
    });
    return () => unsubAuth();
  }, []);

  // 2. Ascolto real-time Notifiche, Amici, Profilo (Amici Stretti) e Membri Club
  useEffect(() => {
    if (!currentUser) {
      return;
    }

    const unsubProfile = subscribeToMyProfile(currentUser, (profileData) => {
      if (profileData && Array.isArray(profileData.closeFriends)) {
        setCloseFriends(profileData.closeFriends);
      }
    });

    const unsubNotifs = subscribeToMyNotifications(currentUser, (notifs) => {
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

    const unsubFriends = subscribeToMyFriends(currentUser, (friends) => {
      setRawFriendsList(friends);
    });

    return () => {
      unsubProfile();
      unsubNotifs();
      unsubFriends();
    };
  }, [currentUser]);

  // Arricchisce gli amici con il flag isCloseFriend e ordina prima gli Amici Stretti in cima
  const friendsList = useMemo(() => {
    return (rawFriendsList || []).map(f => ({
      ...f,
      isCloseFriend: closeFriends.includes(f.uid)
    })).sort((a, b) => {
      if (a.isCloseFriend && !b.isCloseFriend) return -1;
      if (!a.isCloseFriend && b.isCloseFriend) return 1;
      return (a.displayName || a.email || '').localeCompare(b.displayName || b.email || '');
    });
  }, [rawFriendsList, closeFriends]);

  // 3. Ascolto soci e membri club su richiesta (attivato solo all'apertura del profilo/ricerca amici per risparmio letture DB)
  useEffect(() => {
    if (!currentUser || !isProfileOpen) {
      return;
    }
    const unsubClub = subscribeToClubUsers(currentUser, (cUsers) => {
      setClubUsers(cUsers);
    });
    return () => unsubClub();
  }, [currentUser, isProfileOpen]);

  // Login
  const handleLogin = async () => {
    try {
      const user = await loginWithGoogle();
      if (user?.isFirstLogin) {
        setWelcomeUser(user);
        localStorage.setItem('burraco_welcomed_' + user.uid, 'true');
      }
    } catch (err) {
      console.error("Login fallito:", err);
      if (err.code !== 'auth/popup-closed-by-user') {
        customAlert({
          title: 'Accesso Google',
          message: 'Accesso con Google non completato: ' + (err.message || err),
          variant: 'warning'
        });
      }
    }
  };

  // Logout
  const handleLogout = async () => {
    try {
      await logoutUser();
      setIsProfileOpen(false);
    } catch (err) {
      console.error("Logout fallito:", err);
    }
  };

  // Richiesta di amicizia
  const handleSendFriendRequest = async (target) => {
    if (!currentUser) throw new Error('Devi prima accedere con il tuo account Google');
    return await sendFriendRequest(currentUser, target);
  };

  // Rimozione amico (accetta sia oggetto friend che friendshipId stringa)
  const handleRemoveFriend = async (friendOrId) => {
    const friendshipId = typeof friendOrId === 'string' ? friendOrId : friendOrId?.friendshipId;
    const friendUid = typeof friendOrId === 'object' && friendOrId !== null ? friendOrId.uid : null;
    if (!friendshipId) return;
    try {
      await removeFriend(friendshipId, currentUser, friendUid);
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
  };

  // Imposta o rimuove un amico dagli Amici Stretti ⭐
  const handleToggleCloseFriend = async (friend) => {
    if (!currentUser || !friend?.uid) return;
    const friendUid = friend.uid;
    // Aggiornamento ottimistico
    setCloseFriends(prev => {
      const isClose = prev.includes(friendUid);
      return isClose ? prev.filter(id => id !== friendUid) : [...prev, friendUid];
    });
    try {
      const isNowClose = await toggleCloseFriend(currentUser, friendUid);
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
  };

  // Accetta richiesta amicizia
  const handleAcceptFriendRequest = async (notification) => {
    try {
      setToastNotification(null);
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
      if (!prevNotifIdsRef.current.includes(notification.id)) {
        prevNotifIdsRef.current.push(notification.id);
      }
      await respondToFriendRequest(notification, true, currentUser);
    } catch (err) {
      console.error('Errore accettazione amicizia:', err);
      customAlert({
        title: 'Richiesta Amicizia',
        message: 'Impossibile accettare la richiesta: ' + (err.message || err),
        variant: 'danger'
      });
    }
  };

  // Rifiuta richiesta amicizia
  const handleDeclineFriendRequest = async (notification) => {
    try {
      setToastNotification(null);
      await respondToFriendRequest(notification, false, currentUser);
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    } catch (err) {
      console.error('Errore rifiuto amicizia:', err);
    }
  };

  // Accetta invito al tavolo
  const handleAcceptGameInvite = async (notification, onJoinedCloudGame) => {
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
  };

  // Rifiuta invito al tavolo
  const handleDeclineGameInvite = async (notification) => {
    try {
      setToastNotification(null);
      await respondToGameInvite(notification, false);
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    } catch (err) {
      console.error('Errore rifiuto partita:', err);
    }
  };

  // Invita amico al tavolo attivo
  const handleInviteFriendToActiveGame = async (friend, activeGame) => {
    if (!currentUser || !activeGame || !friend) return;
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
      await sendGameInvite(currentUser, friend, activeGame, teamName);
      sound.playTrophy();
      return { success: true };
    } catch (err) {
      console.error('Errore invio invito al tavolo attivo:', err);
      throw err;
    }
  };

  return {
    currentUser,
    friendsList,
    closeFriends,
    clubUsers,
    notifications,
    toastNotification,
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
  };
}
