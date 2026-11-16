import React, { useState, useCallback, useMemo, Suspense, lazy } from 'react';
import Header from './components/Header';
import ScoreBoard from './components/ScoreBoard';
import HomeLobby from './components/HomeLobby';
import NotificationToast from './components/NotificationToast';
import BottomNavBar from './components/navigation/BottomNavBar';
import { Trophy } from 'lucide-react';

// Context Providers & Hooks architetturali
import { ConfirmProvider } from './context/ConfirmContext';
import { useConfirm } from './context/confirmContextStore';
import { SocialProvider } from './context/SocialContext';
import { GameProvider } from './context/GameContext';
import { useBurraco } from './context/gameContextStore';
import { getStoredTheme, applyTheme } from './utils/theme';
import { getStoredPlayers } from './utils/storage';

// Modali caricati in modo asincrono (Lazy Loading) per ottimizzazione caricamento iniziale
const NewGameModal = lazy(() => import('./components/NewGameModal'));
const RoundCalculatorModal = lazy(() => import('./components/RoundCalculatorModal'));
const HistoryModal = lazy(() => import('./components/HistoryModal'));
const VictoryModal = lazy(() => import('./components/VictoryModal'));
const CloudSyncModal = lazy(() => import('./components/CloudSyncModal'));
const RulesModal = lazy(() => import('./components/RulesModal'));
const EditTeamsModal = lazy(() => import('./components/EditTeamsModal'));
const TournamentModal = lazy(() => import('./components/TournamentModal'));
const UserProfileModal = lazy(() => import('./components/UserProfileModal'));
const NotificationsModal = lazy(() => import('./components/NotificationsModal'));
const WelcomeModal = lazy(() => import('./components/WelcomeModal'));
const ThemeSelectorModal = lazy(() => import('./components/ThemeSelectorModal'));

function BurracoAppContent() {
  // 1. Modals UI State
  const [isNewGameOpen, setIsNewGameOpen] = useState(false);
  const [isRoundCalcOpen, setIsRoundCalcOpen] = useState(false);
  const [isCloudModalOpen, setIsCloudModalOpen] = useState(false);
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isEditTeamsOpen, setIsEditTeamsOpen] = useState(false);
  const [roundToEdit, setRoundToEdit] = useState(null);
  const [currentTheme, setCurrentTheme] = useState(() => getStoredTheme());
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [tournamentInitialTab, setTournamentInitialTab] = useState('standings');
  const [tournamentInitialRound, setTournamentInitialRound] = useState('all');

  React.useEffect(() => {
    applyTheme(currentTheme);
  }, [currentTheme]);

  // 2. Accesso unificato ai domini applicativi tramite Context
  const { game, tournament, social, isVictoryOpen, setIsVictoryOpen } = useBurraco();
  const confirm = useConfirm();

  // 3. Event handlers memoizzati per evitare re-render a cascata su Header e ScoreBoard
  const handleOpenNewGame = useCallback((modeOrEvent) => {
    if (typeof modeOrEvent === 'string') {
      game.setNewGameInitialSetup({ mode: modeOrEvent });
    } else {
      game.setNewGameInitialSetup(null);
    }
    setIsNewGameOpen(true);
  }, [game]);

  const handleOpenCloud = useCallback(() => setIsCloudModalOpen(true), []);
  const handleOpenRules = useCallback(() => setIsRulesOpen(true), []);
  const handleOpenNotifications = useCallback(() => social.setIsNotificationsOpen(true), [social]);
  const handleOpenEditTeams = useCallback(() => setIsEditTeamsOpen(true), []);
  const handleOpenThemeSelector = useCallback(() => setIsThemeModalOpen(true), []);
  const handleThemeChange = useCallback((newTheme) => setCurrentTheme(newTheme), []);

  const handleAddRound = useCallback(() => {
    setRoundToEdit(null);
    setIsRoundCalcOpen(true);
  }, []);

  const handleEditRound = useCallback((round) => {
    setRoundToEdit(round);
    setIsRoundCalcOpen(true);
  }, []);

  const handleDeleteLastRound = useCallback(() => {
    game.handleDeleteLastRound(confirm);
  }, [game, confirm]);

  const handleDeleteRound = useCallback((roundNumber) => {
    game.handleDeleteRound(roundNumber, confirm);
  }, [game, confirm]);

  const handleLeaveCloudTable = useCallback(() => {
    game.handleLeaveCloudTable(confirm);
  }, [game, confirm]);

  const handleCloseTable = useCallback(() => {
    game.handleCloseTable(confirm);
  }, [game, confirm]);

  const [activeNavTab, setActiveNavTab] = useState('table'); // 'table' | 'tournament' | 'history' | 'profile'

  const setIsProfileOpen = social.setIsProfileOpen;
  React.useEffect(() => {
    if (setIsProfileOpen) {
      setIsProfileOpen(activeNavTab === 'profile');
    }
  }, [activeNavTab, setIsProfileOpen]);

  const handleOpenTournament = useCallback((targetTab = 'standings', roundNumber = 'all') => {
    setTournamentInitialTab(targetTab || 'standings');
    setTournamentInitialRound(roundNumber || 'all');
    setActiveNavTab('tournament');
  }, []);

  const handleOpenHistory = useCallback(() => {
    setActiveNavTab('history');
  }, []);

  const handleOpenProfile = useCallback((tab = 'profile') => {
    if (social.setProfileInitialTab) {
      social.setProfileInitialTab(tab || 'profile');
    }
    setActiveNavTab('profile');
  }, [social]);

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

  return (
    <div className="min-h-screen felt-bg flex flex-col selection:bg-amber-400 selection:text-emerald-950">
      
      {/* Barra Superiore */}
      <Header
        onOpenRules={handleOpenRules}
        onShareGame={game.handleShareGame}
        hasActiveGame={Boolean(game.activeGame)}
        notificationCount={social.notifications.length}
        onOpenNotifications={handleOpenNotifications}
        onOpenThemeSelector={handleOpenThemeSelector}
      />

      {/* Toast Notifiche in tempo reale */}
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

      {/* Contenuto Principale */}
      <main 
        className="flex-1 max-w-5xl w-full mx-auto p-2.5 sm:p-4 md:p-5"
        style={{
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 5.5rem)',
          paddingLeft: 'calc(env(safe-area-inset-left, 0px) + 0.625rem)',
          paddingRight: 'calc(env(safe-area-inset-right, 0px) + 0.625rem)',
        }}
      >
        
        {/* Banner Incontro Torneo Attivo */}
        {game.activeGame?.tournamentMatchId && (
          <div className="mb-2.5 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-950/90 via-emerald-950/90 to-amber-950/90 backdrop-blur-md border border-amber-500/50 flex items-center justify-between text-xs text-amber-200 shadow-lg">
            <div className="flex items-center gap-2 min-w-0">
              <span className="p-1.5 rounded-lg bg-amber-400/20 text-amber-300 border border-amber-400/30 shrink-0">
                <Trophy className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              </span>
              <div className="truncate">
                <span className="font-black text-amber-300">
                  {game.activeGame.tournamentName || 'Torneo Burraco'}:
                </span>{' '}
                <span className="text-white font-medium">
                  Giornata {game.activeGame.tournamentRoundNumber} • Tavolo {game.activeGame.tournamentTableNumber}
                </span>
              </div>
            </div>
            <button
              onClick={handleOpenTournament}
              className="px-2.5 py-1 rounded-lg gold-gradient text-emerald-950 font-black text-[11px] shadow-sm hover:brightness-110 active:scale-95 cursor-pointer shrink-0 transition-transform"
            >
              Classifica 🏆
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

        {/* VISTA TORNEO A SCHERMO INTERO (NESSUN POPUP) */}
        {activeNavTab === 'tournament' && (
          <Suspense fallback={<div className="p-8 text-center text-amber-300 font-bold">Caricamento Torneo...</div>}>
            <TournamentModal
              isPage={true}
              isOpen={true}
              onClose={() => setActiveNavTab('table')}
              activeTournament={tournament.activeTournament}
              tournamentsHistory={tournament.tournamentsHistory}
              onStartTournament={tournament.handleStartTournament}
              onUpdateTournament={tournament.handleUpdateTournament}
              onFinishTournament={tournament.handleFinishTournament}
              onDeleteTournamentHistory={tournament.handleDeleteTournamentHistory}
              onPlayMatch={(match) => game.handlePlayTournamentMatch(match, tournament.activeTournament, () => setActiveNavTab('table'))}
              playersList={game.recentPlayers}
              currentUser={social.currentUser}
              friendsList={social.friendsList}
              initialTab={tournamentInitialTab}
              initialRoundFilter={tournamentInitialRound}
            />
          </Suspense>
        )}

        {/* VISTA STORICO PARTITE A SCHERMO INTERO (NESSUN POPUP) */}
        {activeNavTab === 'history' && (
          <Suspense fallback={<div className="p-8 text-center text-amber-300 font-bold">Caricamento Archivio...</div>}>
            <HistoryModal
              isPage={true}
              isOpen={true}
              onClose={() => setActiveNavTab('table')}
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

        {/* VISTA PROFILO & ANALYTICS A SCHERMO INTERO (NESSUN POPUP) */}
        {activeNavTab === 'profile' && (
          <Suspense fallback={<div className="p-8 text-center text-amber-300 font-bold">Caricamento Profilo...</div>}>
            <UserProfileModal
              isPage={true}
              isOpen={true}
              onClose={() => setActiveNavTab('table')}
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

      {/* Dock di Navigazione Inferiore Glassmorphism (Mobile & Tablet) */}
      <BottomNavBar
        activeTab={activeNavTab}
        onSelectTab={handleSelectNavTab}
        hasActiveGame={Boolean(game.activeGame)}
        hasActiveTournament={Boolean(tournament.activeTournament)}
        currentUser={social.currentUser}
        notificationCount={social.notifications.length}
        onlineFriendsCount={onlineFriendsCount}
      />

      {/* MODALI */}
      <Suspense fallback={null}>
        {/* 1. Modal Nuova Partita */}
        <NewGameModal
          isOpen={isNewGameOpen}
          onClose={() => {
            setIsNewGameOpen(false);
            game.setNewGameInitialSetup(null);
          }}
          onStartGame={game.handleStartGame}
          friendsList={social.friendsList}
          storedPlayers={storedPlayers}
          currentUser={social.currentUser}
          lastGame={game.gamesHistory?.[0] || null}
          hasActiveGame={Boolean(game.activeGame && game.activeGame.rounds && game.activeGame.rounds.length > 0)}
          initialSetup={game.newGameInitialSetup}
        />

        {/* 2. Modal Calcolatore Mano */}
        <RoundCalculatorModal
          isOpen={isRoundCalcOpen}
          onClose={() => {
            setIsRoundCalcOpen(false);
            setRoundToEdit(null);
          }}
          onSaveRound={game.handleSaveRound}
          activeGame={game.activeGame}
          roundToEdit={roundToEdit}
          roundNumber={(game.activeGame?.rounds?.length || 0) + 1}
        />



        {/* 4. Modal Vittoria & Coriandoli */}
        <VictoryModal
          isOpen={isVictoryOpen}
          onClose={() => setIsVictoryOpen(false)}
          activeGame={game.activeGame}
          activeTournament={tournament.activeTournament}
          onRematch={game.handleRematch}
          onArchiveAndNew={() => game.handleArchiveAndNew(handleOpenNewGame)}
          onOpenTournament={(targetTab, roundNumber) => {
            setIsVictoryOpen(false);
            handleOpenTournament(targetTab, roundNumber);
          }}
        />

        {/* 5. Modal Database Cloud & Condivisione Tavolo */}
        <CloudSyncModal
          isOpen={isCloudModalOpen}
          onClose={() => setIsCloudModalOpen(false)}
          activeGame={game.activeGame}
          currentUser={social.currentUser}
          tablePlayers={game.tablePlayers}
          friendsList={social.friendsList}
          onSendFriendRequest={social.handleSendFriendRequest}
          onInviteFriendToGame={(friend) => social.handleInviteFriendToActiveGame(friend, game.activeGame)}
          onJoinGame={(target) => {
            setIsCloudModalOpen(false);
            game.handleResumeGame(target);
            setActiveNavTab('table');
          }}
        />

        {/* 6. Modal Regole del Gioco & Valori Carte */}
        <RulesModal
          isOpen={isRulesOpen}
          onClose={() => setIsRulesOpen(false)}
        />

        {/* 7. Modal Modifica Squadre & Giocatori Partita Attiva */}
        <EditTeamsModal
          isOpen={isEditTeamsOpen}
          onClose={() => setIsEditTeamsOpen(false)}
          activeGame={game.activeGame}
          tablePlayers={game.tablePlayers}
          currentUser={social.currentUser}
          friendsList={social.friendsList}
          onSave={game.handleUpdateTeams}
        />



        {/* 10. Modal Notifiche & Inviti Amici */}
        <NotificationsModal
          isOpen={social.isNotificationsOpen}
          onClose={() => social.setIsNotificationsOpen(false)}
          notifications={social.notifications}
          onAcceptFriendRequest={social.handleAcceptFriendRequest}
          onDeclineFriendRequest={social.handleDeclineFriendRequest}
          onAcceptGameInvite={(notif) => social.handleAcceptGameInvite(notif, (gameId) => {
            game.handleResumeGame(gameId);
            setActiveNavTab('table');
          })}
          onDeclineGameInvite={social.handleDeclineGameInvite}
        />

        {/* 11. Modal Benvenuto Primo Accesso / Registrazione */}
        <WelcomeModal
          isOpen={Boolean(social.welcomeUser)}
          onClose={() => social.setWelcomeUser(null)}
          user={social.welcomeUser}
          onOpenProfile={() => handleOpenProfile('profile')}
        />

        {/* 12. Modal Scelta Panno del Tavolo */}
        <ThemeSelectorModal
          isOpen={isThemeModalOpen}
          onClose={() => setIsThemeModalOpen(false)}
          currentTheme={currentTheme}
          onThemeChange={handleThemeChange}
        />
      </Suspense>

    </div>
  );
}

export default function App() {
  return (
    <ConfirmProvider>
      <SocialProvider>
        <GameProvider>
          <BurracoAppContent />
        </GameProvider>
      </SocialProvider>
    </ConfirmProvider>
  );
}