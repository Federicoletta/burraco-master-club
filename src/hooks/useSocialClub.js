import { useState, useEffect, useRef } from 'react';
import { 
  loginWithGoogle, 
  logoutUser, 
  subscribeToAuth 
} from '../services/firebase';
import { 
  sendFriendRequest,
  respondToFriendRequest,
  sendGameInvite,
  respondToGameInvite,
  subscribeToMyNotifications,
  subscribeToMyFriends,
  subscribeToClubUsers,
  removeFriend
} from '../services/social';
import { sound } from '../utils/soundEffects';

export function useSocialClub() {
  const [currentUser, setCurrentUser] = useState(null);
  const [friendsList, setFriendsList] = useState([]);
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
    });
    return () => unsubAuth();
  }, []);

  // 2. Ascolto real-time Notifiche, Amici e Membri Club
  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      setFriendsList([]);
      setToastNotification(null);
      prevNotifIdsRef.current = [];
      return;
    }

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
      setFriendsList(friends);
    });

    const unsubClub = subscribeToClubUsers(currentUser, (cUsers) => {
      setClubUsers(cUsers);
    });

    return () => {
      unsubNotifs();
      unsubFriends();
      unsubClub();
    };
  }, [currentUser]);

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
        alert("Accesso con Google non completato: " + (err.message || err));
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

  // Rimozione amico
  const handleRemoveFriend = async (friendshipId) => {
    try {
      await removeFriend(friendshipId);
    } catch (err) {
      console.error('Errore rimozione amicizia:', err);
      alert('Impossibile rimuovere l\'amico: ' + (err.message || err));
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
      alert('Impossibile accettare la richiesta: ' + (err.message || err));
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
          window.location.href = window.location.origin + '?game=' + notification.gameId;
        }
      }
    } catch (err) {
      console.error('Errore accettazione partita:', err);
      alert('Impossibile entrare al tavolo: ' + (err.message || err));
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
    handleOpenProfile,
    handleLogin,
    handleLogout,
    handleSendFriendRequest,
    handleRemoveFriend,
    handleAcceptFriendRequest,
    handleDeclineFriendRequest,
    handleAcceptGameInvite,
    handleDeclineGameInvite,
    handleInviteFriendToActiveGame,
  };
}
