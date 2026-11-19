import { useCallback } from 'react';
import {
  saveActiveGame,
  archiveCurrentGame,
  suspendGameToHistory,
} from '../../utils/storage';

/**
 * Unifica la sincronizzazione dei match di torneo sul tavolo principale:
 * - aggiornamento punteggio/stato su aggiunta, modifica, cancellazione mano e fine partita
 * - avvio di un incontro torneo dal tabellone con sospensione pulita di eventuale partita in corso
 */
export function useTournamentSyncBridge({
  currentUserRef,
  activeGameRef,
  activeTournamentRef,
  allTournamentsRef,
  handleUpdateTournamentRef,
  updateTournamentByIdRef,
  setActiveGame,
  setGamesHistory,
  syncWithStatus,
}) {
  const syncGameToTournamentMatch = useCallback((game, totals, { forceCompleted = false } = {}) => {
    if (!game?.tournamentMatchId) return;
    try {
      const list = allTournamentsRef.current || [];
      const tourn = (game.tournamentId && list.find(t => t?.id === game.tournamentId))
        || list.find(t => (t?.rounds || []).some(r => (r.matches || []).some(m => m.id === game.tournamentMatchId)))
        || activeTournamentRef.current;

      if (!tourn?.rounds) return;

      const t1Total = totals?.t1Total ?? 0;
      const t2Total = totals?.t2Total ?? 0;
      const winner = totals?.winner || null;
      const isCompleted = Boolean(forceCompleted || (totals?.isFinished && winner));

      const applyMatchUpdate = (targetTourn) => ({
        ...targetTourn,
        rounds: (targetTourn.rounds || []).map(r => ({
          ...r,
          matches: (r.matches || []).map(m => {
            if (m.id !== game.tournamentMatchId) return m;
            let winnerId = null;
            if (isCompleted) {
              if (t1Total === t2Total) {
                winnerId = 'tie';
              } else if (winner === 'team1') {
                winnerId = m.team1Id || game.team1?.id || null;
              } else if (winner === 'team2') {
                winnerId = m.team2Id || game.team2?.id || null;
              }
            }
            return {
              ...m,
              team1Score: t1Total,
              team2Score: t2Total,
              status: isCompleted ? 'completed' : 'in_progress',
              winnerId,
              completedAt: isCompleted ? (m.completedAt || new Date().toISOString()) : null,
            };
          })
        }))
      });

      if (typeof updateTournamentByIdRef.current === 'function') {
        updateTournamentByIdRef.current(tourn.id, applyMatchUpdate);
      } else if (typeof handleUpdateTournamentRef.current === 'function') {
        handleUpdateTournamentRef.current(applyMatchUpdate(tourn));
      }
    } catch (tournErr) {
      console.warn('Errore sync match torneo:', tournErr);
    }
  }, [activeTournamentRef, allTournamentsRef, handleUpdateTournamentRef, updateTournamentByIdRef]);

  const handlePlayTournamentMatch = useCallback((match, tournament, onTournamentMatchStarted) => {
    if (!match || !tournament) return;

    const current = activeGameRef.current;
    const userKey = currentUserRef.current?.uid || 'guest';
    if (current && current.rounds && current.rounds.length > 0 && current.tournamentMatchId !== match.id) {
      const updatedHistory = current.isFinished
        ? archiveCurrentGame(current, userKey)
        : suspendGameToHistory(current, userKey);
      setGamesHistory(updatedHistory);
      if (updatedHistory && updatedHistory[0]) {
        syncWithStatus(updatedHistory[0], false);
      }
    }

    const nowIso = new Date().toISOString();
    const tournamentGame = {
      id: match.gameId || ('game_' + Date.now()),
      createdAt: nowIso,
      stateUpdatedAt: nowIso,
      mode: 'pairs',
      allowSemipulito: true,
      targetScore: tournament.targetScore || 2505,
      tournamentId: tournament.id,
      tournamentName: tournament.name,
      tournamentMatchId: match.id,
      tournamentRoundNumber: match.roundNumber,
      tournamentTableNumber: match.tableNumber,
      team1: {
        id: match.team1Id,
        name: match.team1Name,
        players: match.team1Players || [],
      },
      team2: {
        id: match.team2Id,
        name: match.team2Name,
        players: match.team2Players || [],
      },
      rounds: [],
      deletedRoundIds: [],
      winner: null,
      isFinished: false,
      tableClosed: false,
      suspendedAt: null,
    };

    if (match.status !== 'completed') {
      const updatedRounds = (tournament.rounds || []).map(r => ({
        ...r,
        matches: (r.matches || []).map(m => {
          if (m.id === match.id) {
            return {
              ...m,
              status: 'in_progress',
              gameId: tournamentGame.id,
            };
          }
          return m;
        })
      }));
      if (typeof handleUpdateTournamentRef.current === 'function') {
        handleUpdateTournamentRef.current({ ...tournament, rounds: updatedRounds });
      }
    }

    setActiveGame(tournamentGame);
    saveActiveGame(tournamentGame);
    syncWithStatus(tournamentGame, false);

    if (typeof onTournamentMatchStarted === 'function') {
      onTournamentMatchStarted();
    }
  }, [activeGameRef, currentUserRef, handleUpdateTournamentRef, setActiveGame, setGamesHistory, syncWithStatus]);

  return {
    syncGameToTournamentMatch,
    handlePlayTournamentMatch,
  };
}
