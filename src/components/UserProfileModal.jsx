import React, { useState, useEffect } from 'react';
import { 
  X, 
  LogIn, 
  LogOut, 
  User, 
  Trophy, 
  Flame, 
  Award, 
  Calendar, 
  Mail, 
  ShieldCheck, 
  Users, 
  UserPlus, 
  Send, 
  Sparkles, 
  Check, 
  Trash2, 
  Search, 
  Bell,
  BarChart3,
  Lock,
  CheckCircle2
} from 'lucide-react';
import { getFriendOnlineStatus } from '../services/social';
import { calculatePlayerStats, computeUserCareerStats } from '../utils/storage';
import { getPlayerTitle, calculatePlayerTrophies } from '../utils/trophies';
import DeveloperBadge, { isDeveloperAccount } from './DeveloperBadge';

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
  initialTab = 'profile'
}) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'profile' | 'ranking' | 'friends'
  const [rankingScope, setRankingScope] = useState('friends'); // 'friends' | 'local'
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

  if (!isOpen) return null;

  // Calcola statistiche collegate a questo utente autenticato
  const userDisplayName = currentUser?.displayName || 'Giocatore Burraco';
  const userPhoto = currentUser?.photoURL;
  const userEmail = currentUser?.email;

  // Richieste di amicizia in arrivo per questo account
  const incomingFriendRequests = (notifications || []).filter(
    n => n && n.type === 'friend_request' && n.status === 'pending'
  );

  // Calcola statistiche collegate a questo utente autenticato con risoluzione nickname e cloud
  const career = currentUser ? computeUserCareerStats(currentUser, gamesHistory, activeGame) : null;
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

  const onlineFriends = friendsList.filter(f => getFriendOnlineStatus(f.lastSeen).isOnline);
  const onlineCount = onlineFriends.length;

  // Statistiche calcolate per la classifica dei partecipanti del tavolo
  const stats = calculatePlayerStats(recentPlayers, gamesHistory, activeGame);

  // Costruzione classifica Amici Club (Cloud Live)
  const effectiveFriends = friendsList || [];
  const friendsLeaderboardData = [];

  if (currentUser) {
    friendsLeaderboardData.push({
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

  effectiveFriends.forEach(f => {
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
    const isOnline = f.lastSeen ? (Date.now() - new Date(f.lastSeen).getTime() < 5 * 60 * 1000) : false;

    friendsLeaderboardData.push({
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

  const sortedFriendsStats = [...friendsLeaderboardData].sort((a, b) => {
    if (sortBy === 'burrachi') {
      return b.totalBurrachi - a.totalBurrachi || b.cleanBurrachi - a.cleanBurrachi || b.totalPoints - a.totalPoints;
    }
    if (sortBy === 'winrate') {
      return b.winRate - a.winRate || b.gamesWon - a.gamesWon || b.totalPoints - a.totalPoints;
    }
    return b.totalPoints - a.totalPoints || b.winRate - a.winRate;
  });

  const maxFriendsVal = sortBy === 'burrachi'
    ? Math.max(...sortedFriendsStats.map(s => s.totalBurrachi), 1)
    : sortBy === 'winrate'
    ? 100
    : Math.max(...sortedFriendsStats.map(s => s.totalPoints), 1);

  // Ordinamento partecipanti tavolo
  const sortedLocalStats = [...stats].sort((a, b) => {
    if (sortBy === 'burrachi') {
      return b.totalBurrachi - a.totalBurrachi || b.cleanBurrachi - a.cleanBurrachi || b.totalPoints - a.totalPoints;
    }
    if (sortBy === 'winrate') {
      return b.winRate - a.winRate || b.gamesWon - a.gamesWon || b.totalPoints - a.totalPoints;
    }
    return b.totalPoints - a.totalPoints || b.winRate - a.winRate;
  });

  const maxLocalVal = sortBy === 'burrachi'
    ? Math.max(...sortedLocalStats.map(s => s.totalBurrachi), 1)
    : sortBy === 'winrate'
    ? 100
    : Math.max(...sortedLocalStats.map(s => s.totalPoints), 1);

  // Trofei personali dell'utente corrente
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
  if (activeGame && activeGame.rounds && activeGame.rounds.length > 0) {
    if (!allGames.some(g => g.id === activeGame.id)) {
      allGames.push(activeGame);
    }
  }

  const myTrophiesData = calculatePlayerTrophies(myPlayerStats, allGames);

  // Membri del club registrati per suggerimenti
  const nonFriendClubMembers = (clubUsers || []).filter(u => {
    if (!u) return false;
    if (u.uid && currentUser?.uid && u.uid === currentUser.uid) return false;
    if (u.email && currentUser?.email && u.email.toLowerCase() === currentUser.email.toLowerCase()) return false;
    
    const alreadyFriend = (friendsList || []).some(f => 
      (f.uid && u.uid && f.uid === u.uid) ||
      (f.email && u.email && f.email.toLowerCase() === u.email.toLowerCase()) ||
      (f.displayName && u.displayName && f.displayName.toLowerCase() === u.displayName.toLowerCase())
    );
    return !alreadyFriend;
  });

  const filteredSuggestions = friendSearchInput.trim().length >= 2 
    ? nonFriendClubMembers.filter(m => {
        const term = friendSearchInput.toLowerCase().trim();
        const nameMatch = (m.displayName || '').toLowerCase().includes(term);
        const emailMatch = (m.email || '').toLowerCase().includes(term);
        return nameMatch || emailMatch;
      })
    : [];

  const handleSendFriend = async (target) => {
    if (!onSendFriendRequest || !target) return;
    setIsSendingFriend(true);
    setFriendFeedback(null);
    try {
      await onSendFriendRequest(target);
      const label = typeof target === 'object' ? (target.displayName || target.email) : target;
      setFriendFeedback({
        type: 'success',
        text: `Richiesta di amicizia inviata con successo a ${label}!`
      });
      setFriendSearchInput('');
    } catch (err) {
      setFriendFeedback({
        type: 'error',
        text: err.message || 'Errore durante l\'invio della richiesta'
      });
    } finally {
      setIsSendingFriend(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const trimmed = friendSearchInput.trim();
    if (!trimmed) return;
    const exactMatch = nonFriendClubMembers.find(m => 
      (m.email && m.email.toLowerCase() === trimmed.toLowerCase()) ||
      (m.displayName && m.displayName.toLowerCase() === trimmed.toLowerCase())
    );
    if (exactMatch) {
      handleSendFriend(exactMatch);
    } else {
      handleSendFriend(trimmed);
    }
  };

  const handleInviteToActiveGame = async (friend) => {
    if (!onInviteFriendToActiveGame || !friend) return;
    const key = friend.uid || friend.email;
    setInvitingFriendUids(prev => ({ ...prev, [key]: true }));
    try {
      await onInviteFriendToActiveGame(friend);
      setInvitedFriendUids(prev => ({ ...prev, [key]: true }));
    } catch (err) {
      console.warn('Errore invito attivo:', err);
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
              
              {/* ======================================================== */}
              {/* SCHEDA 1: PROFILO & BACHECA TROFEI PERSONALI */}
              {/* ======================================================== */}
              {activeTab === 'profile' && (
                <div className="space-y-3.5 animate-in fade-in duration-150">
                  {/* Scheda Utente con Avatar Google */}
                  <div className="p-3.5 sm:p-4 rounded-xl bg-emerald-950/80 border border-emerald-600/40 flex items-center gap-3.5 shadow-md">
                    {userPhoto ? (
                      <img 
                        src={userPhoto} 
                        alt={userDisplayName} 
                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-amber-400 shadow-md shrink-0 object-cover" 
                      />
                    ) : (
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-emerald-900 border-2 border-amber-400 flex items-center justify-center text-amber-300 font-bold text-lg sm:text-xl shrink-0 shadow-md">
                        {userDisplayName.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="text-sm sm:text-base font-black text-white m-0 truncate">
                          {userDisplayName}
                        </h3>
                        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" title="Account Google Verificato" />
                        {isDeveloperAccount(currentUser) && (
                          <DeveloperBadge size="sm" />
                        )}
                      </div>
                      <p className="text-[11px] sm:text-xs text-emerald-300/80 truncate flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span className="truncate">{userEmail}</span>
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        {isDeveloperAccount(currentUser) ? (
                          <DeveloperBadge />
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400/20 text-amber-300 border border-amber-400/40">
                            Membro Ufficiale Club
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-900/90 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                          <span>{myTrophiesData.titleInfo.icon}</span>
                          <span>{myTrophiesData.titleInfo.title}</span>
                        </span>
                        {onlineCount > 0 && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-300 font-bold">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            {onlineCount} {onlineCount === 1 ? 'amico online' : 'amici online'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Statistiche Personali Rapide */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-950/70 border border-emerald-800/50 text-center">
                      <span className="text-[9px] sm:text-[10px] uppercase font-bold text-emerald-400/80 block">Partite</span>
                      <span className="text-base sm:text-lg font-black text-white">{gamesCount}</span>
                    </div>
                    <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-950/70 border border-emerald-800/50 text-center">
                      <span className="text-[9px] sm:text-[10px] uppercase font-bold text-emerald-400/80 block">Vittorie</span>
                      <span className="text-base sm:text-lg font-black text-amber-300">{wonCount} <small className="text-[10px] font-normal">({winRate}%)</small></span>
                    </div>
                    <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-950/70 border border-emerald-800/50 text-center">
                      <span className="text-[9px] sm:text-[10px] uppercase font-bold text-emerald-400/80 block">Punti Totali</span>
                      <span className="text-base sm:text-lg font-black text-emerald-200">{totalScore.toLocaleString('it-IT')}</span>
                    </div>
                  </div>

                  {/* Burrachi, Chiusure e Record */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2 rounded-xl bg-emerald-950/50 border border-emerald-800/40 text-center">
                      <span className="text-[10px] font-bold text-amber-300/80 block">Burrachi</span>
                      <span className="text-xs sm:text-sm font-black text-amber-200">{totalBurrachi}</span>
                      <span className="text-[9px] text-emerald-300/60 block mt-0.5">
                        {cleanBurrachi}P / {semiCleanBurrachi}S / {dirtyBurrachi}Sp
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-emerald-950/50 border border-emerald-800/40 text-center">
                      <span className="text-[10px] font-bold text-emerald-400/80 block">Chiusure</span>
                      <span className="text-xs sm:text-sm font-black text-white">{closures}</span>
                      <span className="text-[9px] text-emerald-300/60 block mt-0.5">volte</span>
                    </div>
                    <div className="p-2 rounded-xl bg-emerald-950/50 border border-emerald-800/40 text-center">
                      <span className="text-[10px] font-bold text-emerald-400/80 block">Record Mano</span>
                      <span className="text-xs sm:text-sm font-black text-emerald-300">+{bestHandScore}</span>
                      <span className="text-[9px] text-emerald-300/60 block mt-0.5">punti max</span>
                    </div>
                  </div>

                  {/* BACHECA TROFEI PERSONALE */}
                  <div className="p-3.5 rounded-xl bg-gradient-to-br from-emerald-950/90 via-emerald-900/60 to-amber-950/40 border border-amber-500/40 space-y-3 shadow-md">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-black text-amber-300 uppercase tracking-wider">
                        <Award className="w-4 h-4 text-amber-400" />
                        <span>I Tuoi Trofei Sbloccati</span>
                      </div>
                      <span className="text-xs font-black text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded-full border border-amber-400/40">
                        {myTrophiesData.unlockedCount} / {myTrophiesData.totalCount} ({myTrophiesData.percentTotal}%)
                      </span>
                    </div>

                    {/* Barra Avanzamento Trofei */}
                    <div className="h-2 w-full bg-emerald-950 rounded-full border border-emerald-800/60 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 transition-all duration-500"
                        style={{ width: `${myTrophiesData.percentTotal}%` }}
                      />
                    </div>

                    {/* Griglia Trofei */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                      {myTrophiesData.list.map(t => (
                        <div 
                          key={t.id}
                          className={`p-2.5 rounded-xl border transition-all ${
                            t.unlocked
                              ? 'bg-emerald-900/70 border-amber-400/60 shadow-sm'
                              : 'bg-emerald-950/60 border-emerald-800/40 opacity-55'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="text-lg">{t.icon}</span>
                            {t.unlocked ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Lock className="w-3 h-3 text-zinc-400" />
                            )}
                          </div>
                          <div className="text-xs font-bold text-white truncate">{t.name}</div>
                          <div className="text-[10px] text-emerald-300/70 line-clamp-2 leading-tight mt-0.5">
                            {t.description}
                          </div>
                          <div className="text-[9px] font-mono font-bold mt-1.5 text-amber-300/90">
                            {t.unlocked ? '✓ Conquistato' : `${t.current} / ${t.target}`}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* SCHEDA 2: CLASSIFICA CLUB & PARTECIPANTI */}
              {/* ======================================================== */}
              {activeTab === 'ranking' && (
                <div className="space-y-3 animate-in fade-in duration-150">
                  
                  {/* Selettore Ambito: ⭐ Amici Club (Cloud Live) vs 👥 Partecipanti Tavolo */}
                  <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-emerald-950/90 border border-emerald-800/80 shadow-inner">
                    <button
                      type="button"
                      onClick={() => setRankingScope('friends')}
                      className={`min-h-[36px] py-1.5 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-[0.98] select-none ${
                        rankingScope === 'friends'
                          ? 'bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 text-emerald-950 shadow-md font-black'
                          : 'text-emerald-300/80 hover:text-white hover:bg-emerald-900/40'
                      }`}
                    >
                      <span>⭐ Amici Club</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        rankingScope === 'friends' ? 'bg-emerald-950/30 text-emerald-950' : 'bg-emerald-900 text-emerald-300'
                      }`}>
                        {sortedFriendsStats.length}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRankingScope('local')}
                      className={`min-h-[36px] py-1.5 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-[0.98] select-none ${
                        rankingScope === 'local'
                          ? 'bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 text-emerald-950 shadow-md font-black'
                          : 'text-emerald-300/80 hover:text-white hover:bg-emerald-900/40'
                      }`}
                    >
                      <span>👥 Partecipanti Tavolo</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        rankingScope === 'local' ? 'bg-emerald-950/30 text-emerald-950' : 'bg-emerald-900 text-emerald-300'
                      }`}>
                        {sortedLocalStats.length}
                      </span>
                    </button>
                  </div>

                  {/* Selettore Metrica: Punti | Burrachi | % Vittorie */}
                  <div className="flex items-center justify-between gap-1 p-1 rounded-xl bg-emerald-950/60 border border-emerald-800/50 text-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400/80 pl-2 hidden xs:inline">
                      Ordina per:
                    </span>
                    <div className="grid grid-cols-3 gap-1 flex-1">
                      <button
                        type="button"
                        onClick={() => setSortBy('points')}
                        className={`py-1.5 px-2 rounded-lg font-bold text-xs transition-all cursor-pointer text-center ${
                          sortBy === 'points'
                            ? 'bg-amber-400 text-emerald-950 font-black shadow-xs'
                            : 'text-emerald-200 hover:bg-emerald-900/60'
                        }`}
                      >
                        🎯 Punti
                      </button>
                      <button
                        type="button"
                        onClick={() => setSortBy('burrachi')}
                        className={`py-1.5 px-2 rounded-lg font-bold text-xs transition-all cursor-pointer text-center ${
                          sortBy === 'burrachi'
                            ? 'bg-amber-400 text-emerald-950 font-black shadow-xs'
                            : 'text-emerald-200 hover:bg-emerald-900/60'
                        }`}
                      >
                        💎 Burrachi
                      </button>
                      <button
                        type="button"
                        onClick={() => setSortBy('winrate')}
                        className={`py-1.5 px-2 rounded-lg font-bold text-xs transition-all cursor-pointer text-center ${
                          sortBy === 'winrate'
                            ? 'bg-amber-400 text-emerald-950 font-black shadow-xs'
                            : 'text-emerald-200 hover:bg-emerald-900/60'
                        }`}
                      >
                        🏆 Win Rate
                      </button>
                    </div>
                  </div>

                  {/* LISTA CLASSIFICA AMICI CLUB */}
                  {rankingScope === 'friends' && (
                    <div className="space-y-2.5">
                      {sortedFriendsStats.map((p, index) => {
                        const titleInfo = getPlayerTitle(p);
                        let currentVal = p.totalPoints;
                        let primaryText = `${p.totalPoints.toLocaleString('it-IT')} pt`;
                        let subText = `record +${p.bestHandScore} pt`;

                        if (sortBy === 'burrachi') {
                          currentVal = p.totalBurrachi;
                          primaryText = `${p.totalBurrachi} burrachi`;
                          subText = `${p.cleanBurrachi}P • ${p.semiCleanBurrachi}S • ${p.dirtyBurrachi}I`;
                        } else if (sortBy === 'winrate') {
                          currentVal = p.winRate;
                          primaryText = `${p.winRate}% vittorie`;
                          subText = `${p.gamesWon}V / ${p.gamesLost}P (${p.gamesPlayed} tot)`;
                        }

                        const pct = currentVal > 0 && maxFriendsVal > 0 ? Math.round((currentVal / maxFriendsVal) * 100) : 0;

                        return (
                          <div 
                            key={p.uid || p.name}
                            className={`p-3 rounded-xl border transition-all space-y-2 shadow-sm ${
                              p.isMe
                                ? 'bg-gradient-to-r from-emerald-950/90 via-emerald-900/60 to-emerald-950/90 border-amber-500/60'
                                : 'bg-emerald-950/75 border-emerald-700/40 hover:border-amber-500/40'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2.5">
                              <div className="flex items-center gap-2.5 min-w-0">
                                {/* Podio Rank Badge */}
                                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 shadow-sm ${
                                  index === 0 
                                    ? 'gold-gradient text-emerald-950 shadow-amber-500/20' 
                                    : index === 1 
                                    ? 'bg-gradient-to-br from-slate-200 to-slate-400 text-slate-900 font-bold' 
                                    : index === 2 
                                    ? 'bg-gradient-to-br from-amber-700 to-amber-900 text-amber-100 font-bold' 
                                    : 'bg-emerald-900/80 border border-emerald-800 text-emerald-400 font-mono'
                                }`}>
                                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                                </div>

                                {/* Avatar con indicatore Online */}
                                <div className="relative shrink-0">
                                  {p.photoURL ? (
                                    <img 
                                      src={p.photoURL} 
                                      alt={p.name} 
                                      className="w-8 h-8 rounded-full border border-amber-400/50 object-cover" 
                                    />
                                  ) : (
                                    <div className="w-8 h-8 rounded-full bg-emerald-800 border border-emerald-600 text-amber-300 font-bold flex items-center justify-center text-xs">
                                      {p.name.charAt(0).toUpperCase()}
                                    </div>
                                  )}
                                  {p.isOnline && (
                                    <span 
                                      className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-emerald-950" 
                                      title="Online adesso"
                                    />
                                  )}
                                </div>

                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <h4 className="text-xs sm:text-sm font-extrabold text-white m-0 truncate">
                                      {p.displayName || p.name}
                                    </h4>
                                    {isDeveloperAccount(p, currentUser) && (
                                      <DeveloperBadge size="xs" />
                                    )}
                                    {p.isMe && (
                                      <span className="px-1.5 py-0.2 rounded-md bg-amber-400 text-emerald-950 font-black text-[9px]">
                                        Tu
                                      </span>
                                    )}
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-900/90 text-amber-300 border border-amber-500/30 flex items-center gap-1 shrink-0">
                                      <span>{titleInfo.icon}</span>
                                      <span>{titleInfo.title}</span>
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                <div className="text-xs sm:text-sm font-black text-amber-300">
                                  {primaryText}
                                </div>
                                <div className="text-[10px] text-emerald-400/80">
                                  {subText}
                                </div>
                              </div>
                            </div>

                            {/* Barra di Progressione */}
                            <div className="h-1.5 w-full bg-emerald-950 rounded-full border border-emerald-800/60 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  index === 0
                                    ? 'bg-gradient-to-r from-amber-500 to-yellow-300'
                                    : 'bg-gradient-to-r from-emerald-400 to-teal-300'
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>

                            {/* Chips Dettaglio */}
                            <div className="flex flex-wrap items-center gap-1 text-[9px] pt-1 border-t border-emerald-900/60">
                              <span className="px-1.5 py-0.5 rounded bg-emerald-900/50 text-emerald-200 border border-emerald-800/60">
                                🎯 <strong>{p.totalPoints.toLocaleString('it-IT')}</strong> pt
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-emerald-900/50 text-emerald-200 border border-emerald-800/60">
                                💎 <strong>{p.totalBurrachi}</strong> burr. ({p.cleanBurrachi}P · {p.semiCleanBurrachi}S · {p.dirtyBurrachi}I)
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-emerald-900/50 text-amber-300/90 border border-emerald-800/60">
                                🏆 <strong>{p.winRate}%</strong> ({p.gamesWon}V/{p.gamesLost}P)
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* LISTA CLASSIFICA PARTECIPANTI TAVOLO */}
                  {rankingScope === 'local' && (
                    <div>
                      {sortedLocalStats.length === 0 ? (
                        <div className="text-center py-10 text-emerald-300/70 text-xs">
                          Nessuna partita registrata. Inizia una partita per vedere le statistiche dei partecipanti del tavolo!
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {sortedLocalStats.map((p, index) => {
                            const titleInfo = getPlayerTitle(p);
                            let currentVal = p.totalPoints;
                            let primaryText = `${p.totalPoints.toLocaleString('it-IT')} pt`;
                            let subText = `med. ${p.avgPointsPerHand} pt/mano`;

                            if (sortBy === 'burrachi') {
                              currentVal = p.totalBurrachi;
                              primaryText = `${p.totalBurrachi} burrachi`;
                              subText = `${p.cleanBurrachi}P • ${p.semiCleanBurrachi}S • ${p.dirtyBurrachi}I`;
                            } else if (sortBy === 'winrate') {
                              currentVal = p.winRate;
                              primaryText = `${p.winRate}% vittorie`;
                              subText = `${p.gamesWon}V / ${p.gamesLost}P (${p.gamesPlayed} tot)`;
                            }

                            const pct = currentVal > 0 && maxLocalVal > 0 ? Math.round((currentVal / maxLocalVal) * 100) : 0;

                            return (
                              <div 
                                key={p.name}
                                className="p-3 rounded-xl bg-emerald-950/75 border border-emerald-700/40 hover:border-amber-500/40 transition-all space-y-2 shadow-sm"
                              >
                                <div className="flex items-center justify-between gap-2.5">
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 shadow-sm ${
                                      index === 0 
                                        ? 'gold-gradient text-emerald-950 shadow-amber-500/20' 
                                        : index === 1 
                                        ? 'bg-gradient-to-br from-slate-200 to-slate-400 text-slate-900 font-bold' 
                                        : index === 2 
                                        ? 'bg-gradient-to-br from-amber-700 to-amber-900 text-amber-100 font-bold' 
                                        : 'bg-emerald-900/80 border border-emerald-800 text-emerald-400 font-mono'
                                    }`}>
                                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                                    </div>

                                    <div className="min-w-0">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <h4 className="text-xs sm:text-sm font-extrabold text-white m-0 truncate">
                                          {p.name}
                                        </h4>
                                        {isDeveloperAccount(p, currentUser) && (
                                          <DeveloperBadge size="xs" />
                                        )}
                                        <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-900/90 text-amber-300 border border-amber-500/30 flex items-center gap-1 shrink-0">
                                          <span>{titleInfo.icon}</span>
                                          <span>{titleInfo.title}</span>
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="text-right shrink-0">
                                    <div className="text-xs sm:text-sm font-black text-amber-300">
                                      {primaryText}
                                    </div>
                                    <div className="text-[10px] text-emerald-400/80">
                                      {subText}
                                    </div>
                                  </div>
                                </div>

                                <div className="h-1.5 w-full bg-emerald-950 rounded-full border border-emerald-800/60 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-500 ${
                                      index === 0
                                        ? 'bg-gradient-to-r from-amber-500 to-yellow-300'
                                        : 'bg-gradient-to-r from-emerald-400 to-teal-300'
                                    }`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ======================================================== */}
              {/* SCHEDA 3: I MIEI AMICI ONLINE & RUBRICA CLUB */}
              {/* ======================================================== */}
              {activeTab === 'friends' && (
                <div className="space-y-3.5 animate-in fade-in duration-150">
                  
                  {/* RICHIESTE DI AMICIZIA IN ARRIVO */}
                  {incomingFriendRequests.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-950/90 to-emerald-950/90 border border-amber-400/80 shadow-lg space-y-2.5 animate-in slide-in-from-top-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-black text-amber-300 uppercase tracking-wider">
                          <Bell className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
                          <span>Richieste di Amicizia in Arrivo ({incomingFriendRequests.length})</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {incomingFriendRequests.map(notif => (
                          <div 
                            key={notif.id}
                            className="p-2.5 rounded-xl bg-emerald-950/90 border border-amber-400/40 flex items-center justify-between gap-2 text-xs"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="font-bold text-white truncate flex items-center gap-1.5 flex-wrap">
                                <span>{notif.fromName || 'Giocatore'}</span>
                                {isDeveloperAccount(notif.fromEmail || notif.fromUid || notif.fromName) && (
                                  <DeveloperBadge size="xs" />
                                )}
                              </div>
                              <div className="text-[10px] text-emerald-300/70 truncate">{notif.fromEmail}</div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => onAcceptFriendRequest && onAcceptFriendRequest(notif)}
                                className="px-2.5 py-1 rounded-lg gold-gradient text-emerald-950 font-black text-[11px] shadow hover:brightness-110 active:scale-95 cursor-pointer flex items-center gap-1"
                              >
                                <Check className="w-3 h-3 text-emerald-950 stroke-[3]" />
                                <span>Accetta</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeclineFriendRequest && onDeclineFriendRequest(notif)}
                                className="p-1 rounded-lg bg-emerald-900/60 hover:bg-rose-950/80 text-emerald-400 hover:text-rose-300 border border-emerald-700/40 transition-colors cursor-pointer"
                                title="Rifiuta richiesta"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* RUBRICA AMICI CONFERMATI */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-amber-400" />
                        <span>I Tuoi Amici ({friendsList.length})</span>
                      </span>
                      {onlineCount > 0 && (
                        <span className="text-[10px] font-bold text-emerald-300 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span>{onlineCount} online adesso</span>
                        </span>
                      )}
                    </div>

                    {friendsList.length === 0 ? (
                      <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800/40 text-center space-y-1.5">
                        <p className="text-xs text-emerald-300/80 m-0">
                          Non hai ancora amici nella tua rubrica di gioco.
                        </p>
                        <p className="text-[11px] text-emerald-400/60 m-0">
                          Usa il modulo sottostante per cercare e aggiungere altri giocatori tramite la loro email Google!
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {friendsList.map(friend => {
                          const status = getFriendOnlineStatus(friend.lastSeen);
                          return (
                            <div 
                              key={friend.uid || friend.email}
                              className="p-2.5 rounded-xl bg-emerald-950/75 border border-emerald-700/40 hover:border-amber-400/40 transition-all flex items-center justify-between gap-2.5 shadow-sm"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="relative shrink-0">
                                  {friend.photoURL ? (
                                    <img 
                                      src={friend.photoURL} 
                                      alt="" 
                                      className="w-9 h-9 rounded-full border-2 border-amber-400 object-cover" 
                                    />
                                  ) : (
                                    <div className="w-9 h-9 rounded-full bg-emerald-900 border-2 border-amber-400 text-amber-300 font-bold text-xs flex items-center justify-center">
                                      {(friend.displayName || friend.email || 'U').slice(0, 1).toUpperCase()}
                                    </div>
                                  )}
                                  <span 
                                    className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-emerald-950 ${
                                      status.color === 'emerald'
                                        ? 'bg-emerald-400 shadow-sm shadow-emerald-400'
                                        : status.color === 'amber'
                                        ? 'bg-amber-400'
                                        : 'bg-zinc-500'
                                    }`}
                                    title={status.label}
                                  />
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-bold text-xs sm:text-sm text-white truncate">
                                      {friend.displayName || 'Giocatore'}
                                    </span>
                                    {isDeveloperAccount(friend) ? (
                                      <DeveloperBadge size="xs" />
                                    ) : (
                                      <span className="text-[10px] text-amber-400">⭐</span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-emerald-300/70 truncate">
                                    {friend.email}
                                  </div>
                                  <div className="text-[9px] font-medium mt-0.5 flex items-center gap-1">
                                    <span className={`w-1.5 h-1.5 rounded-full ${
                                      status.color === 'emerald' ? 'bg-emerald-400 animate-pulse' : status.color === 'amber' ? 'bg-amber-400' : 'bg-zinc-500'
                                    }`} />
                                    <span className={status.color === 'emerald' ? 'text-emerald-300 font-bold' : status.color === 'amber' ? 'text-amber-300/90' : 'text-zinc-400'}>
                                      {status.label}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Tasti Azione */}
                              <div className="flex items-center gap-1.5 shrink-0">
                                {activeGame && activeGame.id && onInviteFriendToActiveGame && (
                                  tablePlayers.some(p => (friend.uid && p.uid === friend.uid) || (friend.email && p.email?.toLowerCase() === friend.email?.toLowerCase())) ? (
                                    <span className="px-2 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 font-bold text-[10px] border border-emerald-400/40">
                                      Al Tavolo 🟢
                                    </span>
                                  ) : invitedFriendUids[friend.uid || friend.email] ? (
                                    <span className="px-2 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 font-bold text-[10px] border border-emerald-400/40 flex items-center gap-1">
                                      <Check className="w-3 h-3 text-emerald-400" />
                                      <span>Invitato!</span>
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      disabled={invitingFriendUids[friend.uid || friend.email]}
                                      onClick={() => handleInviteToActiveGame(friend)}
                                      className="px-2.5 py-1 rounded-xl gold-gradient text-emerald-950 font-black text-[10px] shadow-sm hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center gap-1"
                                      title="Invita al tavolo attivo di oggi"
                                    >
                                      <span>🎯</span>
                                      <span>{invitingFriendUids[friend.uid || friend.email] ? 'Invio...' : 'Invita al Tavolo'}</span>
                                    </button>
                                  )
                                )}

                                <button
                                  type="button"
                                  onClick={() => handleChallenge(friend)}
                                  className="px-2 py-1 rounded-xl bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 border border-emerald-700/60 font-bold text-[10px] transition-all cursor-pointer"
                                  title="Avvia una nuova partita con questo amico"
                                >
                                  Sfida
                                </button>

                                {onRemoveFriend && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (confirm(`Vuoi rimuovere ${friend.displayName || friend.email} dai tuoi amici?`)) {
                                        onRemoveFriend(friend);
                                      }
                                    }}
                                    className="p-1 rounded-lg text-emerald-400/60 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                                    title="Rimuovi amico"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* AGGIUNGI AMICO TRAMITE EMAIL */}
                  <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800/60 space-y-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300 uppercase tracking-wider">
                      <UserPlus className="w-3.5 h-3.5 text-amber-400" />
                      <span>Aggiungi Nuovo Amico</span>
                    </div>

                    <form onSubmit={handleFormSubmit} className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="w-4 h-4 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={friendSearchInput}
                          onChange={(e) => setFriendSearchInput(e.target.value)}
                          placeholder="Digita email o nome compagno..."
                          className="w-full pl-9 pr-3 py-2 rounded-xl bg-emerald-900/60 border border-emerald-700/50 text-white placeholder-emerald-400/50 text-xs focus:outline-hidden focus:border-amber-400 transition-colors"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isSendingFriend || !friendSearchInput.trim()}
                        className="px-3.5 py-2 rounded-xl gold-gradient text-emerald-950 font-bold text-xs shadow-md hover:brightness-110 active:scale-95 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                      >
                        <Send className="w-3.5 h-3.5 text-emerald-950" />
                        <span>{isSendingFriend ? 'Invio...' : 'Invia'}</span>
                      </button>
                    </form>

                    {filteredSuggestions.length > 0 && (
                      <div className="space-y-1 pt-1 border-t border-emerald-800/40">
                        <span className="text-[10px] text-emerald-400/80 font-bold uppercase tracking-wider">
                          Membri Club suggeriti:
                        </span>
                        {filteredSuggestions.map(sug => (
                          <div
                            key={sug.uid || sug.email}
                            onClick={() => handleSendFriend(sug)}
                            className="p-2 rounded-lg bg-emerald-950/60 hover:bg-emerald-800/80 flex items-center justify-between cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {sug.photoURL ? (
                                <img src={sug.photoURL} alt="" className="w-6 h-6 rounded-full border border-amber-400 object-cover shrink-0" />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-emerald-800 text-amber-300 font-bold text-[10px] flex items-center justify-center shrink-0">
                                  {(sug.displayName || 'U').slice(0, 1).toUpperCase()}
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-xs font-bold text-white truncate">{sug.displayName}</span>
                                  {isDeveloperAccount(sug) && <DeveloperBadge size="xs" />}
                                </div>
                                <span className="text-[10px] text-emerald-300/70 truncate block">{sug.email}</span>
                              </div>
                            </div>
                            <span className="text-xs font-bold text-amber-300 shrink-0">➕ Invia Richiesta</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {friendFeedback && (
                      <div className={`p-2 rounded-lg text-xs font-medium ${
                        friendFeedback.type === 'success'
                          ? 'bg-emerald-900/80 text-emerald-200 border border-emerald-600/60'
                          : 'bg-rose-950/80 text-rose-200 border border-rose-700/60'
                      }`}>
                        {friendFeedback.text}
                      </div>
                    )}
                  </div>

                </div>
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
          <div className="p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-900/80 border-2 border-amber-400/60 flex items-center justify-center mx-auto text-amber-300 shadow-xl">
              <User className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-base sm:text-lg font-black text-white mb-1">
                Collega il tuo Account Google
              </h3>
              <p className="text-xs text-emerald-300/80 max-w-xs mx-auto leading-relaxed">
                Accedi per salvare la tua carriera personale a vita, scalare la classifica del Club, sbloccare i trofei, aggiungere i tuoi amici e sfidarli ai tavoli!
              </p>
            </div>

            <button
              type="button"
              onClick={onLogin}
              className="w-full py-3 px-4 rounded-xl bg-white hover:bg-gray-100 text-zinc-900 font-bold text-sm shadow-xl flex items-center justify-center gap-3 cursor-pointer transition-all active:scale-98"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Continua con Google</span>
            </button>

            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300 text-xs font-semibold cursor-pointer"
              >
                Chiudi
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
