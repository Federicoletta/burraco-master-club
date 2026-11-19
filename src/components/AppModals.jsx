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
      {isNewGameOpen && (
        <NewGameModal
          isOpen={true}
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
      )}

      {isRoundCalcOpen && (
        <RoundCalculatorModal
          isOpen={true}
          onClose={() => {
            setIsRoundCalcOpen(false);
            setRoundToEdit(null);
          }}
          onSaveRound={game.handleSaveRound}
          activeGame={game.activeGame}
          roundToEdit={roundToEdit}
          roundNumber={(game.activeGame?.rounds?.length || 0) + 1}
        />
      )}

      {isVictoryOpen && (
        <VictoryModal
          isOpen={true}
          onClose={() => setIsVictoryOpen(false)}
          activeGame={game.activeGame}
          activeTournament={
            (game.activeGame?.tournamentId &&
              (tournament.allActiveAndPausedTournaments?.find(t => t.id === game.activeGame.tournamentId) ||
               tournament.tournamentsHistory?.find(t => t.id === game.activeGame.tournamentId))) ||
            tournament.activeTournament
          }
          onRematch={game.handleRematch}
          onArchiveAndNew={() => game.handleArchiveAndNew(onOpenNewGame)}
          onOpenTournament={(targetTab, roundNumber) => {
            setIsVictoryOpen(false);
            onOpenTournament(targetTab, roundNumber, game.activeGame?.tournamentId || null);
          }}
        />
      )}

      {isCloudModalOpen && (
        <CloudSyncModal
          isOpen={true}
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
      )}

      {isRulesOpen && (
        <RulesModal
          isOpen={true}
          onClose={() => setIsRulesOpen(false)}
        />
      )}

      {isEditTeamsOpen && (
        <EditTeamsModal
          isOpen={true}
          onClose={() => setIsEditTeamsOpen(false)}
          activeGame={game.activeGame}
          tablePlayers={game.tablePlayers}
          currentUser={social.currentUser}
          friendsList={social.friendsList}
          onSave={game.handleUpdateTeams}
        />
      )}

      {social.isNotificationsOpen && (
        <NotificationsModal
          isOpen={true}
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
      )}

      {Boolean(social.welcomeUser) && (
        <WelcomeModal
          isOpen={true}
          onClose={() => social.setWelcomeUser(null)}
          user={social.welcomeUser}
          onOpenProfile={() => onOpenProfile('profile')}
        />
      )}

      {isThemeModalOpen && (
        <ThemeSelectorModal
          isOpen={true}
          onClose={() => setIsThemeModalOpen(false)}
          currentTheme={currentTheme}
          onThemeChange={onThemeChange}
        />
      )}
    </Suspense>
  );
}
