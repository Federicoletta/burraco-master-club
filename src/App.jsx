import React, { useState, useCallback, useMemo, Suspense, lazy } from 'react';
import Header from './components/Header';
import ScoreBoard from './components/ScoreBoard';
import HomeLobby from './components/HomeLobby';
import NotificationToast from './components/NotificationToast';
import AppUpdateBanner from './components/AppUpdateBanner';
import BottomNavBar from './components/navigation/BottomNavBar';
import AppModals from './components/AppModals';
import { Trophy } from 'lucide-react';

// Context Providers & Hooks architetturali
import { ConfirmProvider } from './context/ConfirmContext';
import { useConfirm } from './context/confirmContextStore';
import { AuthProvider } from './context/AuthContext';
import { SocialProvider } from './context/SocialContext';
import { TournamentProvider } from './context/TournamentContext';
import { GameProvider } from './context/GameContext';
import { useBurraco } from './context/gameContextStore';
import { getStoredTheme, applyTheme } from './utils/theme';
import { getStoredPlayers } from './utils/storage';

// Viste a schermo intero caricate asincronamente
const HistoryModal = lazy(() => import('./components/HistoryModal'));
const TournamentModal = lazy(() => import('./components/TournamentModal'));
const UserProfileModal = lazy(() => import('./components/UserProfileModal'));

function BurracoAppContent() {
  const [isNewGameOpen, setIsNewGameOpen] = useState(false);
  const [isRoundCalcOpen, setIsRoundCalcOpen] = useState(false);
  const [isCloudModalOpen, setIsCloudModalOpen] = useState(false);
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isEditTeamsOpen, setIsEditTeamsOpen] = useState(false);
  const [roundToEdit, setRoundToEdit] = useState(null);
  const [currentTheme, setCurrentTheme] = useState(() => getStoredTheme());
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [tournamentInitialTab, setTournamentInitialTab] = useState('hub');
  const [tournamentInitialRound, setTournamentInitialRound] = useState('all');
  const [activeNavTab, setActiveNavTab] = useState('table'); // 'table' | 'tournament' | 'history' | 'profile'

  React.useEffect(() => {
    applyTheme(currentTheme);
  }, [currentTheme]);

  const { game, tournament, social, isVictoryOpen, setIsVictoryOpen } = useBurraco();
  const confirm = useConfirm();

  const {
    setNewGameInitialSetup,
    handleDeleteLastRound: gameDeleteLastRound,
    handleDeleteRound: gameDeleteRound,
    handleLeaveCloudTable: gameLeaveCloudTable,
    handleCloseTable: gameCloseTable,
  } = game;
  const {
    setIsNotificationsOpen,
    setIsProfileOpen,
    setProfileInitialTab,
  } = social;
  const {
    activeTournament,
    pausedTournaments,
    handleResumeTournament,
  } = tournament;

  const handleOpenNewGame = useCallback((modeOrEvent) => {
    if (typeof modeOrEvent === 'string') {
      setNewGameInitialSetup({ mode: modeOrEvent });
    } else {
      setNewGameInitialSetup(null);
    }
    setIsNewGameOpen(true);
  }, [setNewGameInitialSetup]);

  const handleOpenCloud = useCallback(() => setIsCloudModalOpen(true), []);
  const handleOpenRules = useCallback(() => setIsRulesOpen(true), []);
  const handleOpenNotifications = useCallback(() => setIsNotificationsOpen(true), [setIsNotificationsOpen]);
  const handleOpenEditTeams = useCallback(() => setIsEditTeamsOpen(true), []);
  const handleOpenThemeSelector = useCallback(() => setIsThemeModalOpen(true), []);
  const handleThemeChange = useCallback((newTheme) => setCurrentTheme(newTheme), []);
  const handleNavigateToTable = useCallback(() => setActiveNavTab('table'), []);

  const handleAddRound = useCallback(() => {
    setRoundToEdit(null);
    setIsRoundCalcOpen(true);
  }, []);

  const handleEditRound = useCallback((round) => {
    setRoundToEdit(round);
    setIsRoundCalcOpen(true);
  }, []);

  const handleDeleteLastRound = useCallback(() => {
    gameDeleteLastRound(confirm);
  }, [gameDeleteLastRound, confirm]);

  const handleDeleteRound = useCallback((roundNumber) => {
    gameDeleteRound(roundNumber, confirm);
  }, [gameDeleteRound, confirm]);

  const handleLeaveCloudTable = useCallback(() => {
    gameLeaveCloudTable(confirm);
  }, [gameLeaveCloudTable, confirm]);

  const handleCloseTable = useCallback(() => {
    gameCloseTable(confirm);
  }, [gameCloseTable, confirm]);

  React.useEffect(() => {
    if (setIsProfileOpen) {
      setIsProfileOpen(activeNavTab === 'profile');
    }
  }, [activeNavTab, setIsProfileOpen]);

  const handleOpenTournament = useCallback((targetTab = 'standings', roundNumber = 'all', tournamentId = null) => {
    if (
      tournamentId &&
      activeTournament?.id !== tournamentId &&
      pausedTournaments?.some(t => t.id === tournamentId)
    ) {
      handleResumeTournament(tournamentId);
    }
    setTournamentInitialTab(targetTab || 'standings');
    setTournamentInitialRound(roundNumber || 'all');
    setActiveNavTab('tournament');
  }, [activeTournament?.id, pausedTournaments, handleResumeTournament]);

  const handleOpenHistory = useCallback(() => {
    setActiveNavTab('history');
  }, []);

  const handleOpenProfile = useCallback((tab = 'profile') => {
    if (setProfileInitialTab) {
      setProfileInitialTab(tab || 'profile');
    }
    setActiveNavTab('profile');
  }, [setProfileInitialTab]);

  const storedPlayers = useMemo(
    () => (isNewGameOpen ? getStoredPlayers(social.currentUser?.uid) : []),
    [social.currentUser?.uid, isNewGameOpen]
  );

  const onlineFriendsCount = useMemo(
    () => (social.friendsList || []).filter(f => f?.isOnline).length,
    [social.friendsList]
  );

  const handleSelectNavTab = useCallback((tabId) => {
    setActiveNavTab(tabId);
  }, []);

  const hasStickyMobileAction = activeNavTab === 'table' && Boolean(game.activeGame);

  return (
    <div className="min-h-screen felt-bg flex flex-col selection:bg-amber-400 selection:text-slate-950">
      <Header
        onOpenRules={handleOpenRules}
        onShareGame={game.handleShareGame}
        hasActiveGame={Boolean(game.activeGame)}
        notificationCount={social.notifications.length}
        onOpenNotifications={handleOpenNotifications}
        onOpenThemeSelector={handleOpenThemeSelector}
      />

      <NotificationToast
        key={social.toastNotification?.id || 'empty'}
        notification={social.toastNotification}
        onAccept={async (notif) => {
          social.setToastNotification(null);
          if (notif.type === 'game_invite') {
            await social.handleAcceptGameInvite(notif, async (gameId) => {
              await game.handleResumeGame(gameId);
              setActiveNavTab('table');
            });
          } else {
            await social.handleAcceptFriendRequest(notif);
          }
        }}
        onDecline={async (notif) => {
          social.setToastNotification(null);
          if (notif.type === 'game_invite') {
            await social.handleDeclineGameInvite(notif);
          } else {
            await social.handleDeclineFriendRequest(notif);
          }
        }}
        onClose={() => social.setToastNotification(null)}
      />

      <main
        className="flex-1 max-w-6xl w-full mx-auto pt-3 sm:pt-5 md:pt-6"
        style={{
          paddingBottom: hasStickyMobileAction
            ? 'calc(env(safe-area-inset-bottom, 0px) + 9.75rem)'
            : 'calc(env(safe-area-inset-bottom, 0px) + 5.75rem)',
          paddingLeft: 'calc(env(safe-area-inset-left, 0px) + 0.75rem)',
          paddingRight: 'calc(env(safe-area-inset-right, 0px) + 0.75rem)',
        }}
      >
        {game.activeGame?.tournamentMatchId && (
          <div className="mb-3 px-3.5 py-2.5 rounded-2xl club-card flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-8 h-8 rounded-xl club-inset flex items-center justify-center club-text-gold shrink-0">
                <Trophy className="w-4 h-4" />
              </span>
              <div className="truncate">
                <span className="font-bold club-text-gold">
                  {game.activeGame.tournamentName || 'Torneo Burraco'}
                </span>
                <span className="club-text-subtle"> · </span>
                <span className="club-text-primary font-medium">
                  Giornata {game.activeGame.tournamentRoundNumber} · Tavolo {game.activeGame.tournamentTableNumber}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleOpenTournament('standings', 'all', game.activeGame.tournamentId)}
              className="min-h-[36px] px-3 rounded-xl gold-gradient font-bold text-xs cursor-pointer shrink-0 transition-transform active:scale-95"
            >
              Classifica
            </button>
          </div>
        )}

        {activeNavTab === 'table' && (
          game.activeGame ? (
            <ScoreBoard
              activeGame={game.activeGame}
              syncStatus={game.syncStatus}
              gamesHistory={game.gamesHistory}
              currentUser={social.currentUser}
              tablePlayers={game.tablePlayers}
              friendsList={social.friendsList}
              isCloudJoined={game.isCloudJoined}
              onLeaveCloudTable={handleLeaveCloudTable}
              onSendFriendRequest={social.handleSendFriendRequest}
              onOpenLogin={social.handleLogin}
              onAddRound={handleAddRound}
              onEditRound={handleEditRound}
              onDeleteRound={handleDeleteRound}
              onDeleteLastRound={handleDeleteLastRound}
              onCloseTable={handleCloseTable}
              onSaveGame={game.handleManualSave}
              onEndGame={game.handleEndGame}
              onShareGame={handleOpenCloud}
              onOpenRules={handleOpenRules}
              onOpenEditTeams={handleOpenEditTeams}
              onResumeGame={game.handleResumeGame}
            />
          ) : (
            <HomeLobby
              currentUser={social.currentUser}
              friendsList={social.friendsList}
              storedPlayers={storedPlayers}
              gamesHistory={game.gamesHistory}
              onStartGame={game.handleStartGame}
              onResumeGame={game.handleResumeGame}
              onOpenNewGameModal={handleOpenNewGame}
              onOpenCloudModal={handleOpenCloud}
              onOpenHistory={handleOpenHistory}
              onOpenRules={handleOpenRules}
              onLogin={social.handleLogin}
              onOpenTournament={handleOpenTournament}
              activeTournament={tournament.activeTournament}
            />
          )
        )}

        {activeNavTab === 'tournament' && (
          <Suspense fallback={<div className="p-10 text-center club-text-gold font-semibold">Caricamento Torneo...</div>}>
            <TournamentModal
              isPage={true}
              isOpen={true}
              onClose={handleNavigateToTable}
              activeTournament={tournament.activeTournament}
              pausedTournaments={tournament.pausedTournaments}
              tournamentsHistory={tournament.tournamentsHistory}
              onStartTournament={tournament.handleStartTournament}
              onPauseTournament={tournament.handlePauseTournament}
              onUpdatePausedMetadata={tournament.handleUpdatePausedMetadata}
              onResumeTournament={tournament.handleResumeTournament}
              onDeletePausedTournament={tournament.handleDeletePausedTournament}
              onUpdateTournament={tournament.handleUpdateTournament}
              onFinishTournament={tournament.handleFinishTournament}
              onDeleteTournamentHistory={tournament.handleDeleteTournamentHistory}
              onPlayMatch={(match, targetTournament) => game.handlePlayTournamentMatch(match, targetTournament || tournament.activeTournament, handleNavigateToTable)}
              playersList={game.recentPlayers}
              currentUser={social.currentUser}
              friendsList={social.friendsList}
              initialTab={tournamentInitialTab}
              initialRoundFilter={tournamentInitialRound}
            />
          </Suspense>
        )}

        {activeNavTab === 'history' && (
          <Suspense fallback={<div className="p-10 text-center club-text-gold font-semibold">Caricamento Archivio...</div>}>
            <HistoryModal
              isPage={true}
              isOpen={true}
              onClose={handleNavigateToTable}
              gamesHistory={game.gamesHistory}
              activeGame={game.activeGame}
              currentUser={social.currentUser}
              onEndGame={game.handleEndGame}
              onResumeGame={async (g) => {
                const resumed = await game.handleResumeGame(g);
                setActiveNavTab('table');
                return resumed;
              }}
              onDeleteGame={game.handleDeleteGameHistory}
              onDataImported={game.handleDataImported}
              onAddRound={handleAddRound}
              onEditRound={handleEditRound}
            />
          </Suspense>
        )}

        {activeNavTab === 'profile' && (
          <Suspense fallback={<div className="p-10 text-center club-text-gold font-semibold">Caricamento Profilo...</div>}>
            <UserProfileModal
              isPage={true}
              isOpen={true}
              onClose={handleNavigateToTable}
              currentUser={social.currentUser}
              onLogin={social.handleLogin}
              onLogout={social.handleLogout}
              gamesHistory={game.gamesHistory}
              activeGame={game.activeGame}
              tablePlayers={game.tablePlayers}
              friendsList={social.friendsList}
              clubUsers={social.clubUsers}
              notifications={social.notifications}
              onAcceptFriendRequest={social.handleAcceptFriendRequest}
              onDeclineFriendRequest={social.handleDeclineFriendRequest}
              onSendFriendRequest={social.handleSendFriendRequest}
              onChallengeFriend={(friend) => game.handleChallengeFriend(friend, () => {
                setIsNewGameOpen(true);
                setActiveNavTab('table');
              })}
              onInviteFriendToActiveGame={(friend) => social.handleInviteFriendToActiveGame(friend, game.activeGame)}
              onRemoveFriend={social.handleRemoveFriend}
              onToggleCloseFriend={social.handleToggleCloseFriend}
              initialTab={social.profileInitialTab}
            />
          </Suspense>
        )}
      </main>

      <AppUpdateBanner />

      <BottomNavBar
        activeTab={activeNavTab}
        onSelectTab={handleSelectNavTab}
        hasActiveGame={Boolean(game.activeGame)}
        hasActiveTournament={Boolean(tournament.activeTournament || tournament.pausedTournaments?.length)}
        currentUser={social.currentUser}
        notificationCount={social.notifications.length}
        onlineFriendsCount={onlineFriendsCount}
      />

      <AppModals
        game={game}
        tournament={tournament}
        social={social}
        storedPlayers={storedPlayers}
        isNewGameOpen={isNewGameOpen}
        setIsNewGameOpen={setIsNewGameOpen}
        isRoundCalcOpen={isRoundCalcOpen}
        setIsRoundCalcOpen={setIsRoundCalcOpen}
        roundToEdit={roundToEdit}
        setRoundToEdit={setRoundToEdit}
        isVictoryOpen={isVictoryOpen}
        setIsVictoryOpen={setIsVictoryOpen}
        isCloudModalOpen={isCloudModalOpen}
        setIsCloudModalOpen={setIsCloudModalOpen}
        isRulesOpen={isRulesOpen}
        setIsRulesOpen={setIsRulesOpen}
        isEditTeamsOpen={isEditTeamsOpen}
        setIsEditTeamsOpen={setIsEditTeamsOpen}
        isThemeModalOpen={isThemeModalOpen}
        setIsThemeModalOpen={setIsThemeModalOpen}
        currentTheme={currentTheme}
        onThemeChange={handleThemeChange}
        onOpenNewGame={handleOpenNewGame}
        onOpenTournament={handleOpenTournament}
        onOpenProfile={handleOpenProfile}
        onNavigateToTable={handleNavigateToTable}
      />
    </div>
  );
}

export default function App() {
  return (
    <ConfirmProvider>
      <AuthProvider>
        <SocialProvider>
          <TournamentProvider>
            <GameProvider>
              <BurracoAppContent />
            </GameProvider>
          </TournamentProvider>
        </SocialProvider>
      </AuthProvider>
    </ConfirmProvider>
  );
}