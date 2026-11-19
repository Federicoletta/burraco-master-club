import { useState, useMemo } from 'react';
import { useAlert } from '../context/confirmContextStore';
import {
  getActiveGame,
  saveActiveGame,
  getGamesHistory,
} from '../utils/storage';
import { normalizeLegacyGame } from '../utils/roundSync';
import { useLatestRef } from './useLatestRef';
import { useGameOutbox } from './useGameOutbox';
import { useGameCloudListeners } from './useGameCloudListeners';
import { useTournamentSyncBridge } from './game/useTournamentSyncBridge';
import { useRoundMutations } from './game/useRoundMutations';
import { useGameLifecycle } from './game/useGameLifecycle';
import { useGameHistoryAndShare } from './game/useGameHistoryAndShare';

export function useBurracoGame({
  currentUser,
  friendsList = [],
  activeTournament = null,
  allActiveAndPausedTournaments = [],
  handleUpdateTournament = () => {},
  updateTournamentById = null,
  onCelebrate = () => {},
}) {
  const customAlert = useAlert();
  const [activeGame, setActiveGame] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('game')) return null;
    }
    const current = getActiveGame();
    const isValidActive = Boolean(
      current &&
      typeof current.id === 'string' &&
      current.id.trim() &&
      current.team1 &&
      current.team2
    );
    const isClosed = Boolean(current?.tableClosed || current?.isFinished);
    if (isValidActive && !isClosed) return normalizeLegacyGame(current);
    saveActiveGame(null);
    return null;
  });
  const [gamesHistory, setGamesHistory] = useState(() => getGamesHistory());
  const [isCloudJoined, setIsCloudJoined] = useState(
    () => typeof window !== 'undefined' && Boolean(new URLSearchParams(window.location.search).get('game'))
  );
  const [tablePlayers, setTablePlayers] = useState([]);
  const [newGameInitialSetup, setNewGameInitialSetup] = useState(null);

  const currentUserRef = useLatestRef(currentUser);
  const friendsListRef = useLatestRef(friendsList);
  const activeTournamentRef = useLatestRef(activeTournament);
  const allTournamentsRef = useLatestRef(allActiveAndPausedTournaments);
  const handleUpdateTournamentRef = useLatestRef(handleUpdateTournament);
  const updateTournamentByIdRef = useLatestRef(updateTournamentById);
  const onCelebrateRef = useLatestRef(onCelebrate);
  const activeGameRef = useLatestRef(activeGame);

  const currentUid = currentUser?.uid || null;
  const currentEmail = (currentUser?.email || '').trim().toLowerCase();

  const {
    syncStatus,
    setSyncStatus,
    offlineEventsCountRef,
    pendingSyncIdsRef,
    syncWithStatus,
  } = useGameOutbox(currentUserRef);

  useGameCloudListeners({
    currentUid,
    currentEmail,
    currentUserRef,
    activeGameId: activeGame?.id,
    activeGameRef,
    pendingSyncIdsRef,
    setActiveGame,
    setGamesHistory,
    setIsCloudJoined,
    setTablePlayers,
    setSyncStatus,
    syncWithStatus,
    customAlert,
  });

  const {
    syncGameToTournamentMatch,
    handlePlayTournamentMatch,
  } = useTournamentSyncBridge({
    currentUserRef,
    activeGameRef,
    activeTournamentRef,
    allTournamentsRef,
    handleUpdateTournamentRef,
    updateTournamentByIdRef,
    setActiveGame,
    setGamesHistory,
    syncWithStatus,
  });

  const {
    handleSaveRound,
    handleDeleteLastRound,
    handleDeleteRound,
    handleUpdateTeams,
  } = useRoundMutations({
    currentUserRef,
    activeGameRef,
    offlineEventsCountRef,
    onCelebrateRef,
    setActiveGame,
    setGamesHistory,
    syncWithStatus,
    syncGameToTournamentMatch,
  });

  const {
    handleStartGame,
    handleEndGame,
    handleRematch,
    handleArchiveAndNew,
    handleCloseTable,
    handleLeaveCloudTable,
    handleResumeGame,
    handleChallengeFriend,
  } = useGameLifecycle({
    currentUserRef,
    friendsListRef,
    activeGameRef,
    offlineEventsCountRef,
    onCelebrateRef,
    setActiveGame,
    setGamesHistory,
    setIsCloudJoined,
    setNewGameInitialSetup,
    syncWithStatus,
    syncGameToTournamentMatch,
  });

  const {
    recentPlayers,
    handleDeleteGameHistory,
    handleShareGame,
    handleManualSave,
    handleDataImported,
  } = useGameHistoryAndShare({
    activeGame,
    gamesHistory,
    currentUserRef,
    activeGameRef,
    setActiveGame,
    setGamesHistory,
    setSyncStatus,
    customAlert,
  });

  return useMemo(() => ({
    activeGame,
    setActiveGame,
    gamesHistory,
    setGamesHistory,
    recentPlayers,
    isCloudJoined,
    setIsCloudJoined,
    syncStatus,
    tablePlayers,
    setTablePlayers,
    newGameInitialSetup,
    setNewGameInitialSetup,
    handleStartGame,
    handleSaveRound,
    handleDeleteRound,
    handleDeleteLastRound,
    handleUpdateTeams,
    handleEndGame,
    handleCloseTable,
    handleManualSave,
    handleRematch,
    handleArchiveAndNew,
    handleLeaveCloudTable,
    handleDeleteGameHistory,
    handleShareGame,
    handleResumeGame,
    handleDataImported,
    handlePlayTournamentMatch,
    handleChallengeFriend,
  }), [
    activeGame,
    gamesHistory,
    recentPlayers,
    isCloudJoined,
    syncStatus,
    tablePlayers,
    newGameInitialSetup,
    handleStartGame,
    handleSaveRound,
    handleDeleteRound,
    handleDeleteLastRound,
    handleUpdateTeams,
    handleEndGame,
    handleCloseTable,
    handleManualSave,
    handleRematch,
    handleArchiveAndNew,
    handleLeaveCloudTable,
    handleDeleteGameHistory,
    handleShareGame,
    handleResumeGame,
    handleDataImported,
    handlePlayTournamentMatch,
    handleChallengeFriend,
  ]);
}
