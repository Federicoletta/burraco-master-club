import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveActiveGame,
  getActiveGame,
  suspendGameToHistory,
  archiveCurrentGame,
  getGamesHistory,
  computeUserCareerStats,
} from '../src/utils/storage';
import { computeTeamTotalsAndWinner } from '../src/utils/gameHelpers';
import { reconcileGames } from '../src/utils/roundSync';

const createStorageMock = () => {
  let store = {};
  return {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, val) => { store[key] = String(val); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; },
    get length() { return Object.keys(store).length; },
    key: (i) => Object.keys(store)[i] || null,
  };
};

global.localStorage = createStorageMock();

describe('Game Lifecycle & Suspension Reliability (Phase 1 & 2)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('mantiene valida al reload una partita appena creata con 0 mani', () => {
    const freshGame = {
      id: 'game_zero_rounds_1',
      createdAt: new Date().toISOString(),
      mode: 'pairs',
      allowSemipulito: true,
      targetScore: 2005,
      team1: { name: 'Coppia Nord', players: ['Marco', 'Anna'] },
      team2: { name: 'Coppia Sud', players: ['Luca', 'Sofia'] },
      rounds: [],
      isFinished: false,
      tableClosed: false,
    };

    saveActiveGame(freshGame);
    const restored = getActiveGame();
    const isValidActive = Boolean(
      restored &&
      typeof restored.id === 'string' &&
      restored.id.trim() &&
      restored.team1 &&
      restored.team2
    );
    const isClosed = Boolean(restored?.tableClosed || restored?.isFinished);

    expect(isValidActive && !isClosed).toBe(true);
    expect(restored.rounds).toEqual([]);
  });

  it('sospende una partita incompleta in archivio come "In corso" senza contarla in vittorie/sconfitte carriera', () => {
    const user = { uid: 'u_test', displayName: 'Marco', email: 'marco@club.it' };
    const incompleteGame = {
      id: 'game_incomplete_1',
      createdAt: '2026-11-19T09:00:00.000Z',
      mode: 'pairs',
      targetScore: 2005,
      team1: { name: 'Noi', players: ['Marco', 'Anna'] },
      team2: { name: 'Loro', players: ['Luca', 'Sofia'] },
      rounds: [
        { roundId: 'r1', roundNumber: 1, team1Score: 650, team2Score: 300 },
      ],
      winner: null,
      isFinished: false,
      tableClosed: false,
    };

    const history = suspendGameToHistory(incompleteGame, user.uid);
    expect(history).toHaveLength(1);
    expect(history[0].isFinished).toBe(false);
    expect(history[0].tableClosed).toBe(true);
    expect(history[0].suspendedAt).toBeTruthy();
    expect(history[0].winner).toBeNull();

    const stats = computeUserCareerStats(user, history);
    expect(stats.gamesPlayed).toBe(0);
    expect(stats.gamesWon).toBe(0);
    expect(stats.gamesLost).toBe(0);
  });

  it('riapre pulitamente una partita sospesa e azzera suspendedAt alla conclusione', () => {
    const userKey = 'u_resume';
    const suspended = suspendGameToHistory({
      id: 'game_resume_1',
      mode: 'pairs',
      targetScore: 2005,
      team1: { name: 'A', players: ['P1'] },
      team2: { name: 'B', players: ['P2'] },
      rounds: [{ roundId: 'r1', roundNumber: 1, team1Score: 800, team2Score: 400 }],
      isFinished: false,
    }, userKey)[0];

    expect(suspended.tableClosed).toBe(true);
    expect(suspended.suspendedAt).toBeTruthy();

    const finished = archiveCurrentGame({
      ...suspended,
      tableClosed: false,
      winner: 'team1',
    }, userKey)[0];

    expect(finished.isFinished).toBe(true);
    expect(finished.suspendedAt).toBeNull();
    expect(finished.completedAt).toBeTruthy();
    expect(getGamesHistory(userKey)).toHaveLength(1);
  });

  it('riallinea il punteggio e lo stato di un match torneo anche dopo cancellazione di una mano', () => {
    const rounds = [
      { roundId: 'r1', roundNumber: 1, team1Score: 1200, team2Score: 400 },
      { roundId: 'r2', roundNumber: 2, team1Score: 900, team2Score: 300 },
    ];
    const totalsBefore = computeTeamTotalsAndWinner(rounds, 'pairs', 2005);
    expect(totalsBefore.isFinished).toBe(true);
    expect(totalsBefore.winner).toBe('team1');

    // Simula eliminazione della mano #2 (che riporta la partita sotto target)
    const afterDelete = reconcileGames(
      {
        id: 'game_tourn_1',
        mode: 'pairs',
        targetScore: 2005,
        team1: { name: 'T1', players: [] },
        team2: { name: 'T2', players: [] },
        rounds: [rounds[0]],
        deletedRoundIds: ['r2'],
        stateUpdatedAt: '2026-11-19T11:00:00.000Z',
      },
      {
        id: 'game_tourn_1',
        mode: 'pairs',
        targetScore: 2005,
        team1: { name: 'T1', players: [] },
        team2: { name: 'T2', players: [] },
        rounds,
        deletedRoundIds: [],
        stateUpdatedAt: '2026-11-19T10:55:00.000Z',
      }
    );

    expect(afterDelete.rounds).toHaveLength(1);
    expect(afterDelete.isFinished).toBe(false);
    expect(afterDelete.winner).toBeNull();
  });
});
