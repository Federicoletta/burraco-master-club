import { useCallback } from 'react';
import { saveActiveGame } from '../../utils/storage';
import { computeGameTelemetry } from '../../utils/telemetry';
import {
  computeTeamTotalsAndWinner,
  upsertHistoryGame,
} from '../../utils/gameHelpers';
import {
  ensureRoundIdentity,
  generateRoundId,
  normalizeLegacyGame,
} from '../../utils/roundSync';

const MAX_TOMBSTONES = 100;

/**
 * Gestisce tutte le mutazioni su mani e squadre con identità per-mano (`roundId`),
 * tombstone `deletedRoundIds` e riallineamento automatico con il torneo.
 */
export function useRoundMutations({
  currentUserRef,
  activeGameRef,
  offlineEventsCountRef,
  onCelebrateRef,
  setActiveGame,
  setGamesHistory,
  syncWithStatus,
  syncGameToTournamentMatch,
}) {
  // Salva o aggiorna una mano
  const handleSaveRound = useCallback((roundData) => {
    const rawCurrent = activeGameRef.current;
    if (!rawCurrent) return;
    const current = normalizeLegacyGame(rawCurrent);
    const user = currentUserRef.current;
    const userKey = user?.uid || 'guest';
    const nowIso = new Date().toISOString();

    const currentRounds = Array.isArray(current.rounds) ? current.rounds : [];
    const existingIndex = currentRounds.findIndex(r =>
      (roundData.roundId && r.roundId === roundData.roundId) ||
      r.roundNumber === roundData.roundNumber
    );

    const existingRound = existingIndex >= 0 ? currentRounds[existingIndex] : null;
    const preparedRound = {
      ...roundData,
      roundId: existingRound?.roundId || roundData.roundId || generateRoundId(),
      roundNumber: existingIndex >= 0 ? existingIndex + 1 : currentRounds.length + 1,
      createdAt: existingRound?.createdAt || roundData.createdAt || roundData.timestamp || nowIso,
      updatedAt: nowIso,
      timestamp: roundData.timestamp || nowIso,
    };

    let updatedRounds;
    if (existingIndex >= 0) {
      updatedRounds = [...currentRounds];
      updatedRounds[existingIndex] = preparedRound;
    } else {
      updatedRounds = [...currentRounds, preparedRound];
    }

    const deletedRoundIds = (current.deletedRoundIds || []).filter(id => id !== preparedRound.roundId);
    const totals = computeTeamTotalsAndWinner(
      updatedRounds,
      current.mode,
      current.targetScore
    );
    const { isFinished: matchConcluded, winner } = totals;

    const updatedGame = {
      ...current,
      rounds: updatedRounds,
      deletedRoundIds,
      winner: winner || null,
      isFinished: matchConcluded,
      completedAt: matchConcluded ? (current.completedAt || nowIso) : null,
      suspendedAt: null,
      stateUpdatedAt: nowIso,
    };

    if (matchConcluded) {
      updatedGame.telemetry = computeGameTelemetry(updatedGame, {
        offlineEventsCount: offlineEventsCountRef.current
      });
    }

    setActiveGame(updatedGame);
    saveActiveGame(updatedGame);
    syncWithStatus(updatedGame, true);
    upsertHistoryGame(userKey, updatedGame, setGamesHistory);

    if (typeof syncGameToTournamentMatch === 'function') {
      syncGameToTournamentMatch(updatedGame, totals);
    }

    if (matchConcluded) {
      try {
        onCelebrateRef.current();
      } catch (celErr) {
        console.warn('Errore celebrazione vittoria:', celErr);
      }
    }
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

  // Annulla l'ultima mano
  const handleDeleteLastRound = useCallback(async (customConfirm) => {
    const current = activeGameRef.current;
    if (!current || !current.rounds || current.rounds.length === 0) return;

    const ok = typeof customConfirm === 'function'
      ? await customConfirm({
          title: 'Annulla Ultima Mano',
          message: "Vuoi davvero cancellare l'ultima mano inserita dal tabellone?",
          confirmText: 'Sì, annulla',
          variant: 'danger'
        })
      : window.confirm("Vuoi davvero cancellare l'ultima mano inserita?");
    if (!ok) return;

    const rawLatest = activeGameRef.current;
    if (!rawLatest || !rawLatest.rounds || rawLatest.rounds.length === 0) return;

    const latest = normalizeLegacyGame(rawLatest);
    const user = currentUserRef.current;
    const userKey = user?.uid || 'guest';
    const nowIso = new Date().toISOString();

    const removedRound = ensureRoundIdentity(
      latest.rounds[latest.rounds.length - 1],
      latest.rounds.length - 1,
      latest.createdAt
    );
    const updatedRounds = latest.rounds.slice(0, -1).map((r, idx) => ({
      ...r,
      roundNumber: idx + 1,
    }));
    const deletedRoundIds = Array.from(
      new Set([...(latest.deletedRoundIds || []), removedRound.roundId])
    ).slice(-MAX_TOMBSTONES);

    const totals = computeTeamTotalsAndWinner(
      updatedRounds,
      latest.mode,
      latest.targetScore
    );

    const updatedGame = {
      ...latest,
      rounds: updatedRounds,
      deletedRoundIds,
      winner: totals.winner,
      isFinished: totals.isFinished,
      completedAt: totals.isFinished ? (latest.completedAt || nowIso) : null,
      stateUpdatedAt: nowIso,
    };

    setActiveGame(updatedGame);
    saveActiveGame(updatedGame);
    syncWithStatus(updatedGame, true);
    upsertHistoryGame(userKey, updatedGame, setGamesHistory);

    if (typeof syncGameToTournamentMatch === 'function') {
      syncGameToTournamentMatch(updatedGame, totals);
    }
  }, [
    activeGameRef,
    currentUserRef,
    setActiveGame,
    setGamesHistory,
    syncWithStatus,
    syncGameToTournamentMatch,
  ]);

  // Cancella una specifica mano dal tabellone (foglio segnapunti)
  const handleDeleteRound = useCallback(async (roundNumber, customConfirm) => {
    const current = activeGameRef.current;
    if (!current || !current.rounds || current.rounds.length === 0) return;

    const roundIndex = (current.rounds || []).findIndex(
      r => r.roundNumber === roundNumber
    );
    if (roundIndex === -1) return;

    const targetRound = current.rounds[roundIndex];
    const isTrio = current.mode === 'trio';
    const scoreSummary = isTrio
      ? `${targetRound.team1Score || 0} vs ${targetRound.team2Score || 0} vs ${targetRound.team3Score || 0} pt`
      : `${targetRound.team1Score || 0} vs ${targetRound.team2Score || 0} pt`;

    const ok = typeof customConfirm === 'function'
      ? await customConfirm({
          title: `Elimina Mano #${roundNumber}`,
          message: `Vuoi davvero cancellare la Mano #${roundNumber} (${scoreSummary})? I punti progressivi e i totali verranno ricalcolati automaticamente.`,
          confirmText: 'Elimina Mano',
          variant: 'danger'
        })
      : window.confirm(`Vuoi davvero cancellare la Mano #${roundNumber}?`);
    if (!ok) return;

    const rawLatest = activeGameRef.current;
    if (!rawLatest || !rawLatest.rounds) return;
    const latest = normalizeLegacyGame(rawLatest);
    const latestIdx = latest.rounds.findIndex(r => r.roundNumber === roundNumber);
    if (latestIdx === -1) return;

    const removedRound = ensureRoundIdentity(latest.rounds[latestIdx], latestIdx, latest.createdAt);
    const remainingRounds = latest.rounds
      .filter((_, idx) => idx !== latestIdx)
      .map((r, newIdx) => ({
        ...r,
        roundNumber: newIdx + 1
      }));
    const deletedRoundIds = Array.from(
      new Set([...(latest.deletedRoundIds || []), removedRound.roundId])
    ).slice(-MAX_TOMBSTONES);

    const totals = computeTeamTotalsAndWinner(
      remainingRounds,
      latest.mode,
      latest.targetScore
    );

    const user = currentUserRef.current;
    const userKey = user?.uid || 'guest';
    const nowIso = new Date().toISOString();

    const updatedGame = {
      ...latest,
      rounds: remainingRounds,
      deletedRoundIds,
      winner: totals.winner,
      isFinished: totals.isFinished,
      completedAt: totals.isFinished ? (latest.completedAt || nowIso) : null,
      stateUpdatedAt: nowIso,
    };

    setActiveGame(updatedGame);
    saveActiveGame(updatedGame);
    syncWithStatus(updatedGame, true);
    upsertHistoryGame(userKey, updatedGame, setGamesHistory);

    if (typeof syncGameToTournamentMatch === 'function') {
      syncGameToTournamentMatch(updatedGame, totals);
    }
  }, [
    activeGameRef,
    currentUserRef,
    setActiveGame,
    setGamesHistory,
    syncWithStatus,
    syncGameToTournamentMatch,
  ]);

  // Aggiorna squadre
  const handleUpdateTeams = useCallback((updatedTeam1, updatedTeam2, updatedTeam3) => {
    const rawCurrent = activeGameRef.current;
    if (!rawCurrent) return;
    const current = normalizeLegacyGame(rawCurrent);

    const user = currentUserRef.current;
    const userKey = user?.uid || 'guest';
    const nowIso = new Date().toISOString();

    const updatedGame = {
      ...current,
      team1: updatedTeam1,
      team2: updatedTeam2,
      ...(current.mode === 'trio' && updatedTeam3 ? { team3: updatedTeam3 } : {}),
      stateUpdatedAt: nowIso,
    };

    setActiveGame(updatedGame);
    saveActiveGame(updatedGame);
    syncWithStatus(updatedGame, true);
    upsertHistoryGame(userKey, updatedGame, setGamesHistory);
  }, [activeGameRef, currentUserRef, setActiveGame, setGamesHistory, syncWithStatus]);

  return {
    handleSaveRound,
    handleDeleteLastRound,
    handleDeleteRound,
    handleUpdateTeams,
  };
}
