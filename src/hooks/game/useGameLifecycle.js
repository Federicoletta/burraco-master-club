import { useCallback } from 'react';
import {
  saveActiveGame,
  getGamesHistory,
  getHistoryKey,
  archiveCurrentGame,
  suspendGameToHistory,
  safeSetItem,
} from '../../utils/storage';
import { findGameByPinOrId } from '../../services/firebase';
import { sendGameInvite } from '../../services/social';
import { computeGameTelemetry } from '../../utils/telemetry';
import {
  computeTeamTotalsAndWinner,
  updateCareerStatsInBackground,
} from '../../utils/gameHelpers';
import { normalizeLegacyGame } from '../../utils/roundSync';

/**
 * Gestisce il ciclo di vita completo del tavolo:
 * start, suspend/archive, end, rematch, archiveAndNew, closeTable, leaveCloudTable, resume, challengeFriend.
 */
export function useGameLifecycle({
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
}) {
  // Avvio nuova partita (se la precedente è incompleta con mani, la sospende come riprendibile)
  const handleStartGame = useCallback((newGame) => {
    const user = currentUserRef.current;
    const friends = friendsListRef.current || [];
    const currentActive = activeGameRef.current;
    const userKey = user?.uid || 'guest';

    if (currentActive && currentActive.rounds && currentActive.rounds.length > 0) {
      const updatedHistory = currentActive.isFinished
        ? archiveCurrentGame(currentActive, userKey)
        : suspendGameToHistory(currentActive, userKey);
      setGamesHistory(updatedHistory);
      if (updatedHistory && updatedHistory[0]) {
        syncWithStatus(updatedHistory[0], false);
      }
    }

    const allPlayers = [
      ...(newGame.team1?.players || []),
      ...(newGame.team2?.players || []),
      ...(newGame.team3?.players || [])
    ].map(p => typeof p === 'string' ? p.trim() : '').filter(Boolean);

    const registeredPlayerUids = user?.uid ? [user.uid] : [];
    const registeredPlayerEmails = user?.email ? [user.email] : [];
    const pendingInviteFriends = [];

    if (user && friends.length > 0) {
      friends.forEach(friend => {
        const friendName = friend.displayName || friend.email || '';
        const isInGame = allPlayers.some(
          p => p.toLowerCase() === friendName.toLowerCase() || p.toLowerCase() === (friend.email || '').toLowerCase()
        );
        if (isInGame) {
          if (friend.isCloseFriend) {
            if (friend.uid && !registeredPlayerUids.includes(friend.uid)) registeredPlayerUids.push(friend.uid);
            if (friend.email && !registeredPlayerEmails.includes(friend.email)) registeredPlayerEmails.push(friend.email);
          } else {
            pendingInviteFriends.push(friend);
          }
        }
      });
    }

    const nowIso = new Date().toISOString();
    const gameWithOwnership = normalizeLegacyGame({
      ...newGame,
      createdAt: newGame.createdAt || nowIso,
      stateUpdatedAt: nowIso,
      deletedRoundIds: [],
      tableClosed: false,
      suspendedAt: null,
      ownerUid: user ? user.uid : null,
      ownerEmail: user?.email || null,
      ownerName: user?.displayName || null,
      playerUids: registeredPlayerUids,
      playerEmails: registeredPlayerEmails,
    });

    setActiveGame(gameWithOwnership);
    saveActiveGame(gameWithOwnership);

    const currentHistory = getGamesHistory(userKey);
    const updatedHistory = [gameWithOwnership, ...currentHistory.filter(g => g.id !== gameWithOwnership.id)];
    setGamesHistory(updatedHistory);
    safeSetItem(getHistoryKey(userKey), JSON.stringify(updatedHistory));

    syncWithStatus(gameWithOwnership, true);

    if (user && pendingInviteFriends.length > 0) {
      pendingInviteFriends.forEach(friend => {
        const friendName = friend.displayName || friend.email || '';
        const teamName = (newGame.team1?.players || []).some(p => p.toLowerCase() === friendName.toLowerCase())
          ? newGame.team1?.name
          : (newGame.team2?.players || []).some(p => p.toLowerCase() === friendName.toLowerCase())
          ? newGame.team2?.name
          : newGame.team3?.name || 'In Partita';

        sendGameInvite(user, friend, gameWithOwnership, teamName).catch(err => {
          console.warn('Avviso invio notifica partita:', err);
        });
      });
    }
  }, [activeGameRef, currentUserRef, friendsListRef, setActiveGame, setGamesHistory, syncWithStatus]);

  // Conclude la partita (accetta un eventuale gameOverride per chiusura diretta da Archivio)
  const handleEndGame = useCallback((gameOverride = null) => {
    const rawCurrent = (gameOverride && gameOverride.id) ? gameOverride : activeGameRef.current;
    if (!rawCurrent) return;
    const current = normalizeLegacyGame(rawCurrent);

    const user = currentUserRef.current;
    const userKey = user?.uid || 'guest';
    const nowIso = new Date().toISOString();
    const totals = computeTeamTotalsAndWinner(
      current.rounds,
      current.mode,
      current.targetScore,
      true
    );

    const updatedGame = {
      ...current,
      tableClosed: false,
      suspendedAt: null,
      winner: totals.winner,
      isFinished: true,
      completedAt: nowIso,
      stateUpdatedAt: nowIso,
    };
    updatedGame.telemetry = computeGameTelemetry(updatedGame, {
      offlineEventsCount: offlineEventsCountRef.current
    });

    setActiveGame(updatedGame);
    saveActiveGame(updatedGame);
    syncWithStatus(updatedGame, true);

    if (typeof syncGameToTournamentMatch === 'function') {
      syncGameToTournamentMatch(updatedGame, totals, { forceCompleted: true });
    }

    const updatedHistory = archiveCurrentGame(updatedGame, userKey);
    setGamesHistory(updatedHistory);
    updateCareerStatsInBackground(user, updatedHistory, updatedGame);
    onCelebrateRef.current();
  }, [
    activeGameRef,
    currentUserRef,
    offlineEventsCountRef,
    onCelebrateRef,
    setActiveGame,
    setGamesHistory,
    syncWithStatus,
    syncGameToTournamentMatch,
  ]);

  // Rivincita
  const handleRematch = useCallback(() => {
    const current = activeGameRef.current;
    if (!current) return;
    const user = currentUserRef.current;
    const userKey = user?.uid || 'guest';

    if (current.isFinished) {
      const updatedHistory = archiveCurrentGame(current, userKey);
      setGamesHistory(updatedHistory);
      if (updatedHistory && updatedHistory[0]) {
        syncWithStatus(updatedHistory[0], true);
      }
      updateCareerStatsInBackground(user, updatedHistory, current);
    } else if (current.rounds && current.rounds.length > 0) {
      const updatedHistory = suspendGameToHistory(current, userKey);
      setGamesHistory(updatedHistory);
      if (updatedHistory && updatedHistory[0]) {
        syncWithStatus(updatedHistory[0], true);
      }
    }

    const nowIso = new Date().toISOString();
    const rematchGame = {
      id: 'game_' + Date.now(),
      createdAt: nowIso,
      stateUpdatedAt: nowIso,
      mode: current.mode,
      allowSemipulito: current.allowSemipulito,
      targetScore: current.targetScore,
      team1: current.team1,
      team2: current.team2,
      ...(current.mode === 'trio' ? { team3: current.team3 } : {}),
      rounds: [],
      deletedRoundIds: [],
      winner: null,
      isFinished: false,
      tableClosed: false,
      suspendedAt: null,
      ownerUid: current.ownerUid || (user ? user.uid : null),
      ownerEmail: current.ownerEmail || user?.email || null,
      ownerName: current.ownerName || user?.displayName || null,
      playerUids: current.playerUids || (user ? [user.uid] : []),
      playerEmails: current.playerEmails || (user?.email ? [user.email] : []),
    };

    setActiveGame(rematchGame);
    saveActiveGame(rematchGame);
    syncWithStatus(rematchGame, true);
  }, [activeGameRef, currentUserRef, setActiveGame, setGamesHistory, syncWithStatus]);

  // Archivia e prepara nuova partita pulita
  const handleArchiveAndNew = useCallback((onOpenNewGame) => {
    const current = activeGameRef.current;
    if (current) {
      const user = currentUserRef.current;
      const userKey = user?.uid || 'guest';
      const nowIso = new Date().toISOString();
      const { winner: computedWinner } = computeTeamTotalsAndWinner(
        current.rounds,
        current.mode,
        current.targetScore,
        true
      );

      const finishedGame = {
        ...normalizeLegacyGame(current),
        winner: current.winner || computedWinner,
        isFinished: true,
        suspendedAt: null,
        completedAt: current.completedAt || nowIso,
        stateUpdatedAt: nowIso,
      };

      const updatedHistory = archiveCurrentGame(finishedGame, userKey);
      setGamesHistory(updatedHistory);
      syncWithStatus(finishedGame, true);
      updateCareerStatsInBackground(user, updatedHistory, finishedGame);
    }

    if (typeof window !== 'undefined' && window.location.search.includes('game=')) {
      const url = new URL(window.location.href);
      url.searchParams.delete('game');
      window.history.replaceState({}, '', url.pathname);
    }
    setIsCloudJoined(false);

    saveActiveGame(null);
    setActiveGame(null);

    if (typeof onOpenNewGame === 'function') {
      onOpenNewGame();
    }
  }, [activeGameRef, currentUserRef, setActiveGame, setGamesHistory, setIsCloudJoined, syncWithStatus]);

  // Chiudi tavolo di gioco (sospendi e torna alla schermata principale)
  const handleCloseTable = useCallback(async (customConfirm) => {
    const current = activeGameRef.current;
    if (!current) return;

    const hasRounds = current.rounds && current.rounds.length > 0;
    const ok = typeof customConfirm === 'function'
      ? await customConfirm({
          title: 'Chiudi Tavolo',
          message: hasRounds
            ? `Vuoi chiudere questo tavolo? La partita corrente (${current.rounds.length} mani) rimarrà salvata al sicuro nell'archivio cloud e potrai riprenderla quando vuoi.`
            : 'Vuoi chiudere questo tavolo e tornare alla schermata iniziale?',
          confirmText: 'Chiudi Tavolo',
          cancelText: 'Continua a giocare',
          variant: 'warning'
        })
      : window.confirm('Vuoi chiudere questo tavolo?');
    if (!ok) return;

    const latest = normalizeLegacyGame(activeGameRef.current || current);
    const nowIso = new Date().toISOString();
    const closedGame = {
      ...latest,
      tableClosed: true,
      suspendedAt: latest.isFinished ? null : nowIso,
      stateUpdatedAt: nowIso,
      telemetry: computeGameTelemetry({ ...latest, tableClosed: true }, {
        offlineEventsCount: offlineEventsCountRef.current
      })
    };
    await syncWithStatus(closedGame, true);

    const userKey = currentUserRef.current?.uid || 'guest';
    const currentHistory = getGamesHistory(userKey);
    const updatedHistory = [closedGame, ...currentHistory.filter(g => g.id !== closedGame.id)];
    setGamesHistory(updatedHistory);
    safeSetItem(getHistoryKey(userKey), JSON.stringify(updatedHistory));

    saveActiveGame(null);
    setActiveGame(null);
    setIsCloudJoined(false);

    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('game');
      window.history.replaceState({}, '', url.pathname);
    } catch {
      // ignore
    }
  }, [activeGameRef, currentUserRef, offlineEventsCountRef, setActiveGame, setGamesHistory, setIsCloudJoined, syncWithStatus]);

  // Scollegati dal tavolo condiviso
  const handleLeaveCloudTable = useCallback(async (customConfirm) => {
    const ok = typeof customConfirm === 'function'
      ? await customConfirm({
          title: 'Scollegati dal Tavolo',
          message: 'Vuoi scollegarti da questo tavolo condiviso online e tornare alla schermata iniziale?',
          confirmText: 'Sì, scollegati',
          variant: 'warning'
        })
      : window.confirm('Vuoi scollegarti da questo tavolo condiviso?');
    if (ok) {
      try {
        const url = new URL(window.location.href);
        url.searchParams.delete('game');
        window.history.replaceState({}, '', url.pathname);
      } catch {
        // ignore
      }
      setIsCloudJoined(false);
      setActiveGame(null);
      saveActiveGame(null);
    }
  }, [setActiveGame, setIsCloudJoined]);

  // Riprendi partita passata o tavolo da PIN (riapre tableClosed nel cloud PRIMA di attivare il listener)
  const handleResumeGame = useCallback(async (gameOrId) => {
    let targetGame = gameOrId;
    if (typeof gameOrId === 'string') {
      targetGame = await findGameByPinOrId(gameOrId);
      if (!targetGame) {
        const userKey = currentUserRef.current?.uid || 'guest';
        targetGame = (getGamesHistory(userKey) || []).find(g => g?.id === gameOrId);
      }
    }
    if (!targetGame || typeof targetGame !== 'object' || !targetGame.id) {
      console.warn('handleResumeGame: partita non valida', gameOrId);
      return null;
    }

    const nowIso = new Date().toISOString();
    const resumedGame = {
      ...normalizeLegacyGame(targetGame),
      tableClosed: false,
      suspendedAt: null,
      stateUpdatedAt: nowIso,
    };

    if (targetGame.tableClosed && (typeof navigator === 'undefined' || navigator.onLine)) {
      await syncWithStatus(resumedGame, true);
    } else {
      syncWithStatus(resumedGame, true);
    }

    setActiveGame(resumedGame);
    saveActiveGame(resumedGame);
    setIsCloudJoined(true);

    try {
      const url = new URL(window.location.href);
      url.searchParams.set('game', resumedGame.id);
      window.history.replaceState({}, '', url.toString());
    } catch {
      // ignore
    }

    return resumedGame;
  }, [currentUserRef, setActiveGame, setIsCloudJoined, syncWithStatus]);

  // Sfida un amico
  const handleChallengeFriend = useCallback((friend, onOpenNewGameModal) => {
    const myName = currentUserRef.current?.displayName || 'Io';
    const friendName = friend.displayName || friend.email || 'Amico';
    setNewGameInitialSetup({
      mode: 'pairs',
      p1A: myName,
      p2A: friendName,
      team1Name: `Coppia ${myName}`,
      team2Name: `Coppia ${friendName}`
    });
    if (typeof onOpenNewGameModal === 'function') {
      onOpenNewGameModal();
    }
  }, [currentUserRef, setNewGameInitialSetup]);

  return {
    handleStartGame,
    handleEndGame,
    handleRematch,
    handleArchiveAndNew,
    handleCloseTable,
    handleLeaveCloudTable,
    handleResumeGame,
    handleChallengeFriend,
  };
}
