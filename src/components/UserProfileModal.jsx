import React, { useState, useMemo } from 'react';
import {
  X,
  LogOut,
  User,
  Trophy,
  Users
} from 'lucide-react';
import { getFriendOnlineStatus } from '../services/social';
import { computeUserCareerStats } from '../utils/storage';
import { calculatePlayerTrophies } from '../utils/trophies';
import { useModalEscape } from '../hooks/useModalEscape';

// Sotto-componenti modulari del profilo utente
import ProfileTab from './profile/ProfileTab';
import LeaderboardTab from './profile/LeaderboardTab';
import FriendsTab from './profile/FriendsTab';
import GuestProfileView from './profile/GuestProfileView';

export default function UserProfileModal({
  isOpen,
  onClose,
  isPage = false,
  currentUser,
  onLogin,
  onLogout,
  gamesHistory = [],
  activeGame,
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
  const [tabState, setTabState] = useState({ base: initialTab || 'profile', value: initialTab || 'profile' });
  const activeTab = tabState.base === (initialTab || 'profile') ? tabState.value : (initialTab || 'profile');
  const setActiveTab = (nextTab) => setTabState({ base: initialTab || 'profile', value: nextTab });

  const [sortBy, setSortBy] = useState('points'); // 'points' | 'burrachi' | 'winrate'
  const [friendSearchInput, setFriendSearchInput] = useState('');
  const [friendFeedback, setFriendFeedback] = useState(null);
  const [isSendingFriend, setIsSendingFriend] = useState(false);
  const [invitingFriendUids, setInvitingFriendUids] = useState({});
  const [invitedFriendUids, setInvitedFriendUids] = useState({});

  useModalEscape(!isPage && isOpen, onClose);

  const userDisplayName = currentUser?.displayName || 'Giocatore Burraco';
  const userPhoto = currentUser?.photoURL;
  const userEmail = currentUser?.email;

  const incomingFriendRequests = useMemo(() => {
    return (notifications || []).filter(
      n => n && n.type === 'friend_request' && n.status === 'pending'
    );
  }, [notifications]);

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
      setFriendFeedback({ type: 'success', text: 'Richiesta di amicizia inviata con successo!' });
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

  const headerTitle = activeTab === 'ranking'
    ? 'Classifica & Club'
    : activeTab === 'friends'
    ? 'Amici & Club'
    : (currentUser ? userDisplayName : 'Profilo Giocatore');

  const headerSubtitle = activeTab === 'ranking'
    ? 'Podio live e rendimento giocatori'
    : activeTab === 'friends'
    ? 'Rubrica compagni e inviti rapidi'
    : 'Carriera, trofei e andamento';

  const cardContent = (
    <div
      className={`relative w-full ${
        isPage
          ? 'max-w-3xl mx-auto club-card rounded-3xl'
          : 'max-w-xl sm:max-w-2xl club-card-solid rounded-t-3xl sm:rounded-3xl max-h-[92dvh] sm:max-h-[88dvh] club-sheet-enter'
      } flex flex-col overflow-hidden`}
      onClick={!isPage ? (e) => e.stopPropagation() : undefined}
    >
      {!isPage && (
        <div className="sm:hidden flex justify-center pt-2.5 pb-1 shrink-0">
          <span className="w-10 h-1 rounded-full bg-white/25" />
        </div>
      )}

      {/* Header */}
      <div className="px-4 sm:px-5 py-3 sm:py-4 border-b club-divider flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl gold-gradient flex items-center justify-center shrink-0">
            {activeTab === 'ranking' ? (
              <Trophy className="w-5 h-5" />
            ) : activeTab === 'friends' ? (
              <Users className="w-5 h-5" />
            ) : (
              <User className="w-5 h-5" />
            )}
          </div>
          <div className="min-w-0">
            <h2 className="font-display text-lg sm:text-xl font-bold text-white m-0 truncate leading-tight">
              {headerTitle}
            </h2>
            <p className="text-xs club-text-subtle m-0 truncate">
              {headerSubtitle}
            </p>
          </div>
        </div>

        {!isPage && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="w-11 h-11 rounded-xl club-btn-secondary flex items-center justify-center cursor-pointer shrink-0 ml-2"
            aria-label="Chiudi profilo"
            title="Chiudi"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {currentUser ? (
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Segmented Tabs */}
          <div className="px-4 sm:px-5 pt-3 pb-2 shrink-0">
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl club-tab-bar">
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className={`min-h-[42px] px-2 sm:px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'profile'
                    ? 'gold-gradient shadow-sm'
                    : 'club-text-muted hover:bg-white/5'
                }`}
              >
                <User className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Profilo</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('ranking')}
                className={`min-h-[42px] px-2 sm:px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'ranking'
                    ? 'gold-gradient shadow-sm'
                    : 'club-text-muted hover:bg-white/5'
                }`}
              >
                <Trophy className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Classifica</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('friends')}
                className={`min-h-[42px] px-2 sm:px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'friends'
                    ? 'gold-gradient shadow-sm'
                    : 'club-text-muted hover:bg-white/5'
                }`}
              >
                <Users className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Amici</span>
                {incomingFriendRequests.length > 0 ? (
                  <span className="min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-black bg-rose-500 text-white inline-flex items-center justify-center tabular-nums">
                    {incomingFriendRequests.length}
                  </span>
                ) : onlineCount > 0 ? (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" title={`${onlineCount} online`} />
                ) : null}
              </button>
            </div>
          </div>

          {/* Body */}
          <div className={`px-4 sm:px-5 py-3 ${isPage ? '' : 'overflow-y-auto'} flex-1 min-h-0 space-y-4`}>
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
                avgPointsPerHand={avgPointsPerHand}
                scoresHistory={career?.scoresHistory || []}
              />
            )}

            {activeTab === 'ranking' && (
              <LeaderboardTab
                sortBy={sortBy}
                setSortBy={setSortBy}
                sortedFriendsStats={sortedFriendsStats}
                maxFriendsVal={maxFriendsVal}
                currentUser={currentUser}
              />
            )}

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

          {/* Footer */}
          {(activeTab === 'profile' || (!isPage && onClose)) && (
            <div className="px-4 sm:px-5 py-3 border-t club-divider flex justify-between items-center gap-3 shrink-0">
              {activeTab === 'profile' ? (
                <button
                  type="button"
                  onClick={onLogout}
                  className="min-h-[42px] px-4 rounded-xl bg-rose-950/75 hover:bg-rose-900/90 text-rose-200 border border-rose-500/40 text-xs font-bold flex items-center gap-2 cursor-pointer transition-all active:scale-95"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Esci dall'Account</span>
                </button>
              ) : (
                <div />
              )}

              {!isPage && onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-[42px] px-5 rounded-xl club-btn-secondary text-xs font-bold cursor-pointer active:scale-95"
                >
                  Chiudi
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <GuestProfileView onLogin={onLogin} onClose={isPage ? null : onClose} />
      )}
    </div>
  );

  if (isPage) {
    return cardContent;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md overflow-hidden"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Profilo giocatore e statistiche"
    >
      {cardContent}
    </div>
  );
}