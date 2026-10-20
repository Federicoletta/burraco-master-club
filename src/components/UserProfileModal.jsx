import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  LogOut, 
  User, 
  Trophy, 
  Users 
} from 'lucide-react';
import { getFriendOnlineStatus } from '../services/social';
import { calculatePlayerStats, computeUserCareerStats } from '../utils/storage';
import { calculatePlayerTrophies } from '../utils/trophies';

// Sotto-componenti modulari del profilo utente
import ProfileTab from './profile/ProfileTab';
import LeaderboardTab from './profile/LeaderboardTab';
import FriendsTab from './profile/FriendsTab';
import GuestProfileView from './profile/GuestProfileView';

export default function UserProfileModal({
  isOpen,
  onClose,
  currentUser,
  onLogin,
  onLogout,
  gamesHistory = [],
  activeGame,
  recentPlayers = [],
  tablePlayers = [],
  friendsList = [],
  clubUsers = [],
  notifications = [],
  onAcceptFriendRequest,
  onDeclineFriendRequest,
  onSendFriendRequest,
  onChallengeFriend,
  onInviteFriendToActiveGame,
  onRemoveFriend,
  onToggleCloseFriend,
  initialTab = 'profile'
}) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [sortBy, setSortBy] = useState('points'); // 'points' | 'burrachi' | 'winrate'
  const [friendSearchInput, setFriendSearchInput] = useState('');
  const [friendFeedback, setFriendFeedback] = useState(null);
  const [isSendingFriend, setIsSendingFriend] = useState(false);
  const [invitingFriendUids, setInvitingFriendUids] = useState({});
  const [invitedFriendUids, setInvitedFriendUids] = useState({});

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  // Calcola statistiche collegate all'utente autenticato
  const userDisplayName = currentUser?.displayName || 'Giocatore Burraco';
  const userPhoto = currentUser?.photoURL;
  const userEmail = currentUser?.email;

  // Richieste di amicizia in arrivo
  const incomingFriendRequests = useMemo(() => {
    return (notifications || []).filter(
      n => n && n.type === 'friend_request' && n.status === 'pending'
    );
  }, [notifications]);

  // Calcola statistiche carriera
  const career = useMemo(() => {
    return currentUser ? computeUserCareerStats(currentUser, gamesHistory, activeGame) : null;
  }, [currentUser, gamesHistory, activeGame]);

  const cloudCareer = currentUser?.careerStats || {};

  const gamesCount = Math.max(career?.gamesPlayed || 0, Number(cloudCareer.gamesPlayed) || 0);
  const wonCount = Math.max(career?.gamesWon || 0, Number(cloudCareer.gamesWon) || 0);
  const totalScore = Math.max(career?.totalPoints || 0, Number(cloudCareer.totalPoints) || 0);
  const winRate = gamesCount > 0 ? Math.round((wonCount / gamesCount) * 100) : (career?.winRate || Number(cloudCareer.winRate) || 0);
  const cleanBurrachi = Math.max(career?.cleanBurrachi || 0, Number(cloudCareer.cleanBurrachi) || 0);
  const semiCleanBurrachi = Math.max(career?.semiCleanBurrachi || 0, Number(cloudCareer.semiCleanBurrachi) || 0);
  const dirtyBurrachi = Math.max(career?.dirtyBurrachi || 0, Number(cloudCareer.dirtyBurrachi) || 0);
  const totalBurrachi = cleanBurrachi + semiCleanBurrachi + dirtyBurrachi;
  const closures = Math.max(career?.closures || 0, Number(cloudCareer.closures) || 0);
  const bestHandScore = Math.max(career?.bestHandScore || 0, Number(cloudCareer.bestHandScore) || 0);
  const avgPointsPerHand = career?.avgPointsPerHand || 0;

  const onlineFriends = useMemo(() => {
    return (friendsList || []).filter(f => getFriendOnlineStatus(f.lastSeen).isOnline);
  }, [friendsList]);
  const onlineCount = onlineFriends.length;

  // Costruzione classifica Amici Club (Cloud Live)
  const sortedFriendsStats = useMemo(() => {
    const list = [];
    if (currentUser) {
      list.push({
        uid: currentUser.uid,
        name: currentUser.displayName || currentUser.email?.split('@')[0] || 'Tu',
        displayName: currentUser.displayName || 'Tu',
        email: currentUser.email,
        photoURL: currentUser.photoURL,
        isMe: true,
        isOnline: true,
        totalPoints: totalScore,
        gamesPlayed: gamesCount,
        gamesWon: wonCount,
        gamesLost: Math.max(0, gamesCount - wonCount),
        winRate,
        cleanBurrachi,
        semiCleanBurrachi,
        dirtyBurrachi,
        totalBurrachi,
        closures,
        bestHandScore,
        avgPointsPerHand,
      });
    }

    (friendsList || []).forEach(f => {
      if (currentUser && f.uid === currentUser.uid) return;
      const c = f.careerStats || {};
      const localS = computeUserCareerStats(f, gamesHistory, activeGame) || {};

      const points = Math.max(Number(c.totalPoints) || 0, Number(localS.totalPoints) || 0);
      const played = Math.max(Number(c.gamesPlayed) || 0, Number(localS.gamesPlayed) || 0);
      const won = Math.max(Number(c.gamesWon) || 0, Number(localS.gamesWon) || 0);
      const lost = Math.max(0, played - won);
      const rate = Number(c.winRate) || (played > 0 ? Math.round((won / played) * 100) : (localS.winRate || 0));
      const clean = Math.max(Number(c.cleanBurrachi) || 0, Number(localS.cleanBurrachi) || 0);
      const semi = Math.max(Number(c.semiCleanBurrachi) || 0, Number(localS.semiCleanBurrachi) || 0);
      const dirty = Math.max(Number(c.dirtyBurrachi) || 0, Number(localS.dirtyBurrachi) || 0);
      const totBurr = clean + semi + dirty;
      const clos = Math.max(Number(c.closures) || 0, Number(localS.closures) || 0);
      const record = Math.max(Number(c.bestHandScore) || 0, Number(localS.bestHandScore) || 0);
      const isOnline = getFriendOnlineStatus(f.lastSeen).isOnline;

      list.push({
        uid: f.uid,
        name: f.displayName || f.email?.split('@')[0] || 'Amico',
        displayName: f.displayName,
        email: f.email,
        photoURL: f.photoURL,
        isMe: false,
        isOnline,
        totalPoints: points,
        gamesPlayed: played,
        gamesWon: won,
        gamesLost: lost,
        winRate: rate,
        cleanBurrachi: clean,
        semiCleanBurrachi: semi,
        dirtyBurrachi: dirty,
        totalBurrachi: totBurr,
        closures: clos,
        bestHandScore: record,
        avgPointsPerHand: 0,
      });
    });

    return list.sort((a, b) => {
      if (sortBy === 'burrachi') {
        return b.totalBurrachi - a.totalBurrachi || b.cleanBurrachi - a.cleanBurrachi || b.totalPoints - a.totalPoints;
      }
      if (sortBy === 'winrate') {
        return b.winRate - a.winRate || b.gamesWon - a.gamesWon || b.totalPoints - a.totalPoints;
      }
      return b.totalPoints - a.totalPoints || b.winRate - a.winRate;
    });
  }, [currentUser, friendsList, gamesHistory, activeGame, totalScore, gamesCount, wonCount, winRate, cleanBurrachi, semiCleanBurrachi, dirtyBurrachi, totalBurrachi, closures, bestHandScore, avgPointsPerHand, sortBy]);

  const maxFriendsVal = useMemo(() => {
    if (sortBy === 'burrachi') return Math.max(...sortedFriendsStats.map(s => s.totalBurrachi), 1);
    if (sortBy === 'winrate') return 100;
    return Math.max(...sortedFriendsStats.map(s => s.totalPoints), 1);
  }, [sortedFriendsStats, sortBy]);

  // Trofei personali dell'utente corrente
  const myTrophiesData = useMemo(() => {
    const myPlayerStats = {
      name: userDisplayName,
      totalPoints: totalScore,
      gamesPlayed: gamesCount,
      gamesWon: wonCount,
      gamesLost: Math.max(0, gamesCount - wonCount),
      winRate,
      cleanBurrachi,
      semiCleanBurrachi,
      dirtyBurrachi,
      totalBurrachi,
      closures,
      bestHandScore,
      avgPointsPerHand,
    };

    const allGames = [...gamesHistory];
    if (activeGame?.rounds?.length > 0) {
      if (!allGames.some(g => g.id === activeGame.id)) {
        allGames.push(activeGame);
      }
    }
    return calculatePlayerTrophies(myPlayerStats, allGames);
  }, [userDisplayName, totalScore, gamesCount, wonCount, winRate, cleanBurrachi, semiCleanBurrachi, dirtyBurrachi, totalBurrachi, closures, bestHandScore, avgPointsPerHand, gamesHistory, activeGame]);

  // Suggerimenti membri del club non ancora amici
  const filteredSuggestions = useMemo(() => {
    if (friendSearchInput.trim().length < 2) return [];
    const term = friendSearchInput.toLowerCase().trim();

    return (clubUsers || []).filter(u => {
      if (!u) return false;
      if (u.uid && currentUser?.uid && u.uid === currentUser.uid) return false;
      if (u.email && currentUser?.email && u.email.toLowerCase() === currentUser.email.toLowerCase()) return false;
      
      const alreadyFriend = (friendsList || []).some(f => 
        (f.uid && u.uid && f.uid === u.uid) ||
        (f.email && u.email && f.email.toLowerCase() === u.email.toLowerCase()) ||
        (f.displayName && u.displayName && f.displayName.toLowerCase() === u.displayName.toLowerCase())
      );
      if (alreadyFriend) return false;

      const nameMatch = (u.displayName || '').toLowerCase().includes(term);
      const emailMatch = (u.email || '').toLowerCase().includes(term);
      return nameMatch || emailMatch;
    });
  }, [clubUsers, currentUser, friendsList, friendSearchInput]);

  const handleSendFriend = async (target) => {
    if (!onSendFriendRequest) return;
    setIsSendingFriend(true);
    setFriendFeedback(null);
    try {
      await onSendFriendRequest(target);
      setFriendFeedback({ type: 'success', text: `Richiesta di amicizia inviata con successo!` });
      setFriendSearchInput('');
    } catch (err) {
      setFriendFeedback({ type: 'error', text: err.message || 'Errore durante l\'invio della richiesta' });
    } finally {
      setIsSendingFriend(false);
      setTimeout(() => setFriendFeedback(null), 5000);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!friendSearchInput.trim()) return;
    handleSendFriend(friendSearchInput.trim());
  };

  const handleInviteToActiveGame = async (friend) => {
    if (!onInviteFriendToActiveGame) return;
    const key = friend.uid || friend.email;
    setInvitingFriendUids(prev => ({ ...prev, [key]: true }));
    try {
      await onInviteFriendToActiveGame(friend);
      setInvitedFriendUids(prev => ({ ...prev, [key]: true }));
    } catch (err) {
      console.error('Errore invito al tavolo:', err);
    } finally {
      setInvitingFriendUids(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleChallenge = (friend) => {
    onClose();
    if (onChallengeFriend) {
      onChallengeFriend(friend);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/85 backdrop-blur-md overflow-hidden animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl sm:max-w-2xl felt-card rounded-2xl border border-amber-500/40 shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[88vh] my-auto overflow-hidden">
        
        {/* HEADER FISSO */}
        <div className="p-3 sm:p-4 pb-2.5 border-b border-emerald-700/50 flex items-center justify-between shrink-0 bg-emerald-950/90">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl gold-gradient flex items-center justify-center text-emerald-950 font-black shadow-md shrink-0">
              {activeTab === 'ranking' ? (
                <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-950" />
              ) : activeTab === 'friends' ? (
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-950" />
              ) : (
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-950" />
              )}
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-lg font-black text-white m-0 truncate">
                {activeTab === 'ranking' 
                  ? 'Classifica & Club' 
                  : activeTab === 'friends' 
                  ? 'I Miei Amici & Club' 
                  : (currentUser ? userDisplayName : 'Profilo Giocatore')}
              </h2>
              <p className="text-[10px] sm:text-xs text-emerald-300/80 m-0 truncate">
                {activeTab === 'ranking' 
                  ? 'Podio live e rendimento giocatori' 
                  : activeTab === 'friends' 
                  ? 'Rubrica compagni di gioco e inviti' 
                  : 'Carriera, bacheca trofei e statistiche'}
              </p>
            </div>
          </div>

          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-800/50 transition-colors cursor-pointer shrink-0 ml-2"
            title="Chiudi"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenuto Utente Autenticato vs Non Autenticato */}
        {currentUser ? (
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
            
            {/* NAVIGAZIONE FISSA TRA LE 3 SCHEDE */}
            <div className="px-3 sm:px-4 pt-2.5 pb-1.5 shrink-0 bg-emerald-950/60">
              <div className="grid grid-cols-3 gap-1 sm:gap-1.5 p-1 rounded-xl bg-emerald-950/80 border border-emerald-800/60 shadow-inner">
                
                {/* 1. Il Mio Profilo & Trofei */}
                <button
                  type="button"
                  onClick={() => setActiveTab('profile')}
                  className={`py-2 px-1.5 sm:px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1 sm:gap-1.5 transition-all cursor-pointer ${
                    activeTab === 'profile'
                      ? 'bg-amber-400 text-emerald-950 shadow-md font-black'
                      : 'text-emerald-300 hover:text-white hover:bg-emerald-900/40'
                  }`}
                >
                  <User className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Profilo & Trofei</span>
                </button>

                {/* 2. Classifica Club */}
                <button
                  type="button"
                  onClick={() => setActiveTab('ranking')}
                  className={`py-2 px-1.5 sm:px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1 sm:gap-1.5 transition-all cursor-pointer ${
                    activeTab === 'ranking'
                      ? 'bg-amber-400 text-emerald-950 shadow-md font-black'
                      : 'text-emerald-300 hover:text-white hover:bg-emerald-900/40'
                  }`}
                >
                  <Trophy className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Classifica</span>
                </button>

                {/* 3. I Miei Amici */}
                <button
                  type="button"
                  onClick={() => setActiveTab('friends')}
                  className={`relative py-2 px-1.5 sm:px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1 sm:gap-1.5 transition-all cursor-pointer ${
                    activeTab === 'friends'
                      ? 'bg-amber-400 text-emerald-950 shadow-md font-black'
                      : 'text-emerald-300 hover:text-white hover:bg-emerald-900/40'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Amici</span>
                  {incomingFriendRequests.length > 0 ? (
                    <span className="px-1 py-0.2 rounded-full text-[9px] font-black bg-rose-500 text-white animate-pulse">
                      {incomingFriendRequests.length}
                    </span>
                  ) : onlineCount > 0 ? (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" title={`${onlineCount} online`} />
                  ) : null}
                </button>

              </div>
            </div>

            {/* BODY SCORREVOLE */}
            <div className="p-3 sm:p-4 overflow-y-auto flex-1 min-h-0 space-y-3.5">
              
              {/* SCHEDA 1: PROFILO & BACHECA TROFEI PERSONALI */}
              {activeTab === 'profile' && (
                <ProfileTab
                  currentUser={currentUser}
                  userDisplayName={userDisplayName}
                  userEmail={userEmail}
                  userPhoto={userPhoto}
                  onlineCount={onlineCount}
                  myTrophiesData={myTrophiesData}
                  gamesCount={gamesCount}
                  wonCount={wonCount}
                  winRate={winRate}
                  totalScore={totalScore}
                  totalBurrachi={totalBurrachi}
                  cleanBurrachi={cleanBurrachi}
                  semiCleanBurrachi={semiCleanBurrachi}
                  dirtyBurrachi={dirtyBurrachi}
                  closures={closures}
                  bestHandScore={bestHandScore}
                />
              )}

              {/* SCHEDA 2: CLASSIFICA CLUB & PARTECIPANTI */}
              {activeTab === 'ranking' && (
                <LeaderboardTab
                  sortBy={sortBy}
                  setSortBy={setSortBy}
                  sortedFriendsStats={sortedFriendsStats}
                  maxFriendsVal={maxFriendsVal}
                  currentUser={currentUser}
                />
              )}

              {/* SCHEDA 3: I MIEI AMICI ONLINE & RUBRICA CLUB */}
              {activeTab === 'friends' && (
                <FriendsTab
                  incomingFriendRequests={incomingFriendRequests}
                  friendsList={friendsList}
                  onlineCount={onlineCount}
                  activeGame={activeGame}
                  tablePlayers={tablePlayers}
                  invitingFriendUids={invitingFriendUids}
                  invitedFriendUids={invitedFriendUids}
                  onAcceptFriendRequest={onAcceptFriendRequest}
                  onDeclineFriendRequest={onDeclineFriendRequest}
                  handleInviteToActiveGame={handleInviteToActiveGame}
                  handleChallenge={handleChallenge}
                  onRemoveFriend={onRemoveFriend}
                  onToggleCloseFriend={onToggleCloseFriend}
                  friendSearchInput={friendSearchInput}
                  setFriendSearchInput={setFriendSearchInput}
                  handleFormSubmit={handleFormSubmit}
                  handleSendFriend={handleSendFriend}
                  isSendingFriend={isSendingFriend}
                  filteredSuggestions={filteredSuggestions}
                  friendFeedback={friendFeedback}
                />
              )}

            </div>

            {/* FOOTER FISSO */}
            <div className="p-2.5 sm:p-3 border-t border-emerald-700/50 flex justify-between items-center shrink-0 bg-emerald-950/90">
              {activeTab === 'profile' ? (
                <button
                  type="button"
                  onClick={onLogout}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800/60 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Esci dall'Account</span>
                </button>
              ) : (
                <div />
              )}

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 rounded-xl bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 text-xs font-bold cursor-pointer transition-all active:scale-95"
              >
                Chiudi
              </button>
            </div>

          </div>
        ) : (
          /* Stato Utente Non Autenticato */
          <GuestProfileView onLogin={onLogin} onClose={onClose} />
        )}

      </div>
    </div>
  );
}