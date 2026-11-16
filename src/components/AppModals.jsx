import React, { Suspense, lazy } from 'react';

const NewGameModal = lazy(() => import('./NewGameModal'));
const RoundCalculatorModal = lazy(() => import('./RoundCalculatorModal'));
const VictoryModal = lazy(() => import('./VictoryModal'));
const CloudSyncModal = lazy(() => import('./CloudSyncModal'));
const RulesModal = lazy(() => import('./RulesModal'));
const EditTeamsModal = lazy(() => import('./EditTeamsModal'));
const NotificationsModal = lazy(() => import('./NotificationsModal'));
const WelcomeModal = lazy(() => import('./WelcomeModal'));
const ThemeSelectorModal = lazy(() => import('./ThemeSelectorModal'));

export default function AppModals({
  game,
  tournament,
  social,
  storedPlayers,
  isNewGameOpen,
  setIsNewGameOpen,
  isRoundCalcOpen,
  setIsRoundCalcOpen,
  roundToEdit,
  setRoundToEdit,
  isVictoryOpen,
  setIsVictoryOpen,
  isCloudModalOpen,
  setIsCloudModalOpen,
  isRulesOpen,
  setIsRulesOpen,
  isEditTeamsOpen,
  setIsEditTeamsOpen,
  isThemeModalOpen,
  setIsThemeModalOpen,
  currentTheme,
  onThemeChange,
  onOpenNewGame,
  onOpenTournament,
  onOpenProfile,
  onNavigateToTable,
}) {
  return (
    <Suspense fallback={null}>
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

      <VictoryModal
        isOpen={isVictoryOpen}
        onClose={() => setIsVictoryOpen(false)}
        activeGame={game.activeGame}
        activeTournament={tournament.activeTournament}
        onRematch={game.handleRematch}
        onArchiveAndNew={() => game.handleArchiveAndNew(onOpenNewGame)}
        onOpenTournament={(targetTab, roundNumber) => {
          setIsVictoryOpen(false);
          onOpenTournament(targetTab, roundNumber);
        }}
      />

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
          onNavigateToTable();
        }}
      />

      <RulesModal
        isOpen={isRulesOpen}
        onClose={() => setIsRulesOpen(false)}
      />

      <EditTeamsModal
        isOpen={isEditTeamsOpen}
        onClose={() => setIsEditTeamsOpen(false)}
        activeGame={game.activeGame}
        tablePlayers={game.tablePlayers}
        currentUser={social.currentUser}
        friendsList={social.friendsList}
        onSave={game.handleUpdateTeams}
      />

      <NotificationsModal
        isOpen={social.isNotificationsOpen}
        onClose={() => social.setIsNotificationsOpen(false)}
        notifications={social.notifications}
        onAcceptFriendRequest={social.handleAcceptFriendRequest}
        onDeclineFriendRequest={social.handleDeclineFriendRequest}
        onAcceptGameInvite={(notif) => social.handleAcceptGameInvite(notif, (gameId) => {
          game.handleResumeGame(gameId);
          onNavigateToTable();
        })}
        onDeclineGameInvite={social.handleDeclineGameInvite}
      />

      <WelcomeModal
        isOpen={Boolean(social.welcomeUser)}
        onClose={() => social.setWelcomeUser(null)}
        user={social.welcomeUser}
        onOpenProfile={() => onOpenProfile('profile')}
      />

      <ThemeSelectorModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        currentTheme={currentTheme}
        onThemeChange={onThemeChange}
      />
    </Suspense>
  );
}
