import React, { useState, useCallback, Suspense, lazy } from 'react';
import Header from './components/Header';
import ScoreBoard from './components/ScoreBoard';
import NotificationToast from './components/NotificationToast';
import { Trophy } from 'lucide-react';

// Context Providers & Hooks architetturali
import { ConfirmProvider, useConfirm } from './context/ConfirmContext';
import { SocialProvider } from './context/SocialContext';
import { GameProvider, useBurraco } from './context/GameContext';
import { getStoredTheme, applyTheme } from './utils/theme';

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
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isCloudModalOpen, setIsCloudModalOpen] = useState(false);
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isEditTeamsOpen, setIsEditTeamsOpen] = useState(false);
  const [roundToEdit, setRoundToEdit] = useState(null);
  const [currentTheme, setCurrentTheme] = useState(() => getStoredTheme());
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);

  React.useEffect(() => {
    applyTheme(currentTheme);
  }, [currentTheme]);

  // 2. Accesso unificato ai domini applicativi tramite Context
  const { game, tournament, social, isVictoryOpen, setIsVictoryOpen } = useBurraco();
  const confirm = useConfirm();

  // 3. Event handlers memoizzati per evitare re-render a cascata su Header e ScoreBoard
  const handleOpenNewGame = useCallback(() => {
    game.setNewGameInitialSetup(null);
    setIsNewGameOpen(true);
  }, [game]);

  const handleOpenHistory = useCallback(() => setIsHistoryOpen(true), []);
  const handleOpenCloud = useCallback(() => setIsCloudModalOpen(true), []);
  const handleOpenTournament = useCallback(() => tournament.setIsTournamentOpen(true), [tournament]);
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

  const handleLeaveCloudTable = useCallback(() => {
    game.handleLeaveCloudTable(confirm);
  }, [game, confirm]);

  return (
    <div className="min-h-screen felt-bg flex flex-col selection:bg-amber-400 selection:text-emerald-950">
      
      {/* Barra Superiore */}
      <Header
        onNewGame={handleOpenNewGame}
        onOpenHistory={handleOpenHistory}
        onOpenCloud={handleOpenCloud}
        onOpenTournament={handleOpenTournament}
        hasActiveTournament={Boolean(tournament.activeTournament)}
        onOpenRules={handleOpenRules}
        onShareGame={game.handleShareGame}
        hasActiveGame={Boolean(game.activeGame)}
        currentUser={social.currentUser}
        onOpenProfile={social.handleOpenProfile}
        onLogin={social.handleLogin}
        notificationCount={social.notifications.length}
        onOpenNotifications={handleOpenNotifications}
        friendsList={social.friendsList}
        onOpenThemeSelector={handleOpenThemeSelector}
        currentTheme={currentTheme}
      />

      {/* Toast Notifiche in tempo reale */}
      <NotificationToast
        notification={social.toastNotification}
        onAccept={async (notif) => {
          social.setToastNotification(null);
          if (notif.type === 'game_invite') {
            await social.handleAcceptGameInvite(notif, (gameId) => {
              game.setIsCloudJoined(true);
              window.location.href = window.location.origin + '?game=' + gameId;
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
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1.5rem)',
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

        {game.activeGame ? (
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
            onDeleteLastRound={handleDeleteLastRound}
            onEndGame={game.handleEndGame}
            onShareGame={handleOpenCloud}
            onOpenRules={handleOpenRules}
            onOpenEditTeams={handleOpenEditTeams}
            onResumeGame={game.handleResumeGame}
          />
        ) : (
          /* Schermata di Benvenuto se nessuna partita */
          <div className="text-center py-16 px-4 max-w-md mx-auto">
            <div className="w-20 h-20 rounded-3xl gold-gradient flex items-center justify-center mx-auto shadow-2xl mb-4">
              <span className="text-emerald-950 font-black text-4xl">♠</span>
            </div>
            <h2 className="text-2xl font-black text-white">Burraco Segnapunti</h2>
            <p className="text-sm text-emerald-300/80 my-3">
              Tieni traccia dei punteggi per coppia o singolo, calcola automaticamente carte, burrachi e pozzetti, e consulta le statistiche di ogni partecipante.
            </p>
            <button
              onClick={handleOpenNewGame}
              className="mt-2 w-full py-3.5 rounded-2xl gold-gradient text-emerald-950 font-black text-sm shadow-xl hover:brightness-110 active:scale-95 cursor-pointer"
            >
              Inizia la Prima Partita
            </button>
          </div>
        )}
      </main>

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
          availablePlayers={game.recentPlayers}
          friendsList={social.friendsList}
          currentUser={social.currentUser}
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

        {/* 3. Modal Storico Partite */}
        <HistoryModal
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          gamesHistory={game.gamesHistory}
          activeGame={game.activeGame}
          currentUser={social.currentUser}
          onEndGame={game.handleEndGame}
          onResumeGame={game.handleResumeGame}
          onDeleteGame={game.handleDeleteGameHistory}
          onDataImported={game.handleDataImported}
          onAddRound={handleAddRound}
          onEditRound={handleEditRound}
        />

        {/* 4. Modal Vittoria & Coriandoli */}
        <VictoryModal
          isOpen={isVictoryOpen}
          onClose={() => setIsVictoryOpen(false)}
          activeGame={game.activeGame}
          onRematch={game.handleRematch}
          onArchiveAndNew={() => game.handleArchiveAndNew(handleOpenNewGame)}
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
          playersList={game.recentPlayers}
          tablePlayers={game.tablePlayers}
          currentUser={social.currentUser}
          friendsList={social.friendsList}
          onSave={game.handleUpdateTeams}
        />

        {/* 8. Modal Modalità Torneo Burraco */}
        <TournamentModal
          isOpen={tournament.isTournamentOpen}
          onClose={() => tournament.setIsTournamentOpen(false)}
          activeTournament={tournament.activeTournament}
          onStartTournament={tournament.handleStartTournament}
          onUpdateTournament={tournament.handleUpdateTournament}
          onFinishTournament={tournament.handleFinishTournament}
          onPlayMatch={(match) => game.handlePlayTournamentMatch(match, tournament.activeTournament, () => tournament.setIsTournamentOpen(false))}
          playersList={game.recentPlayers}
          currentUser={social.currentUser}
          friendsList={social.friendsList}
        />

        {/* 9. Modal Profilo Personale, Trofei, Classifica & Amici */}
        <UserProfileModal
          isOpen={social.isProfileOpen}
          onClose={() => social.setIsProfileOpen(false)}
          currentUser={social.currentUser}
          onLogin={social.handleLogin}
          onLogout={social.handleLogout}
          gamesHistory={game.gamesHistory}
          activeGame={game.activeGame}
          recentPlayers={game.recentPlayers}
          tablePlayers={game.tablePlayers}
          friendsList={social.friendsList}
          clubUsers={social.clubUsers}
          notifications={social.notifications}
          onAcceptFriendRequest={social.handleAcceptFriendRequest}
          onDeclineFriendRequest={social.handleDeclineFriendRequest}
          onSendFriendRequest={social.handleSendFriendRequest}
          onChallengeFriend={(friend) => game.handleChallengeFriend(friend, () => setIsNewGameOpen(true))}
          onInviteFriendToActiveGame={(friend) => social.handleInviteFriendToActiveGame(friend, game.activeGame)}
          onRemoveFriend={social.handleRemoveFriend}
          initialTab={social.profileInitialTab}
        />

        {/* 10. Modal Notifiche & Inviti Amici */}
        <NotificationsModal
          isOpen={social.isNotificationsOpen}
          onClose={() => social.setIsNotificationsOpen(false)}
          notifications={social.notifications}
          onAcceptFriendRequest={social.handleAcceptFriendRequest}
          onDeclineFriendRequest={social.handleDeclineFriendRequest}
          onAcceptGameInvite={(notif) => social.handleAcceptGameInvite(notif, (gameId) => {
            game.setIsCloudJoined(true);
            window.location.href = window.location.origin + '?game=' + gameId;
          })}
          onDeclineGameInvite={social.handleDeclineGameInvite}
        />

        {/* 11. Modal Benvenuto Primo Accesso / Registrazione */}
        <WelcomeModal
          isOpen={Boolean(social.welcomeUser)}
          onClose={() => social.setWelcomeUser(null)}
          user={social.welcomeUser}
          onOpenProfile={() => social.setIsProfileOpen(true)}
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