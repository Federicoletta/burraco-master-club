import { describe, it, expect, beforeEach } from 'vitest';
import {
  getStoredPlayers,
  savePlayerName,
  deletePlayerName,
  renamePlayer,
  setStoredPlayers,
  getActiveGame,
  saveActiveGame,
  getGamesHistory,
  archiveCurrentGame,
  exportBackupData,
  importBackupData,
  computeUserCareerStats,
} from '../src/utils/storage';
import {
  getActiveTournament,
  saveActiveTournament,
  getTournamentsHistory,
} from '../src/utils/tournament';
import { sanitizeForFirestore } from '../src/services/firebase';

// Mock localStorage per l'ambiente di test Node
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, val) => {
      store[key] = String(val);
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

global.localStorage = localStorageMock;

describe('Storage & Database Layer - Player Management', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('filters out mock names and generic labels when loading players', () => {
    localStorage.setItem('burraco_players_v1', JSON.stringify(['Federico', 'Marco', 'Coppia 1', 'Chiara']));
    const players = getStoredPlayers();
    expect(players).toEqual(['Federico', 'Chiara']); // Strips mock names and generic labels
  });

  it('saves new player names ignoring duplicates and mock names', () => {
    savePlayerName('Roberto');
    savePlayerName('Roberto');
    savePlayerName('Marco'); // Mock name rejected
    savePlayerName('giocatore 1'); // Generic label rejected
    savePlayerName('   '); // Whitespace rejected
    const players = getStoredPlayers();
    expect(players).toEqual(['Roberto']);
  });

  it('deletes player from stored list', () => {
    setStoredPlayers(['Alice', 'Bob']);
    const remaining = deletePlayerName('Alice');
    expect(remaining).toEqual(['Bob']);
    expect(getStoredPlayers()).toEqual(['Bob']);
  });

  it('renames player across stored list, active game, and history', () => {
    setStoredPlayers(['Alessandro', 'Elena']);

    const activeGame = {
      id: 'game_active',
      team1: { name: 'Alessandro & Elena', players: ['Alessandro', 'Elena'] },
      team2: { name: 'Coppia 2', players: ['Giulia', 'Paolo'] },
      rounds: [],
    };
    saveActiveGame(activeGame);

    const historyGame = {
      id: 'game_hist_1',
      team1: { name: 'Alessandro & Elena', players: ['Alessandro', 'Elena'] },
      team2: { name: 'Avversari', players: ['Giulia'] },
      rounds: [],
    };
    localStorage.setItem('burraco_history_v1', JSON.stringify([historyGame]));

    const updatedPlayers = renamePlayer('Alessandro', 'Alex');
    expect(updatedPlayers).toContain('Alex');
    expect(updatedPlayers).not.toContain('Alessandro');

    const updatedActive = getActiveGame();
    expect(updatedActive.team1.players).toEqual(['Alex', 'Elena']);
    expect(updatedActive.team1.name).toBe('Alex & Elena');

    const updatedHistory = getGamesHistory();
    expect(updatedHistory[0].team1.players).toEqual(['Alex', 'Elena']);
    expect(updatedHistory[0].team1.name).toBe('Alex & Elena');
  });
});

describe('Storage & Database Layer - Career Stats Computation', () => {
  it('computes correct career stats for authenticated user', () => {
    const user = {
      uid: 'user_123',
      displayName: 'Federico Rossi',
      email: 'federico@example.com',
    };

    const finishedGame = {
      id: 'g_fin_1',
      isFinished: true,
      winner: 'team1',
      team1: { name: 'Noi', players: ['Federico'] },
      team2: { name: 'Loro', players: ['Luca'] },
      rounds: [
        {
          team1Score: 350,
          team2Score: 100,
          team1Details: { burracoPulito: 1, burracoSemipulito: 0, burracoSporco: 1, chiusura: true },
          team2Details: { burracoPulito: 0, burracoSemipulito: 0, burracoSporco: 0, chiusura: false },
        },
        {
          team1Score: 420,
          team2Score: 150,
          team1Details: { burracoPulito: 2, burracoSemipulito: 1, burracoSporco: 0, chiusura: true },
          team2Details: { burracoPulito: 0, burracoSemipulito: 0, burracoSporco: 1, chiusura: false },
        },
      ],
    };

    const stats = computeUserCareerStats(user, [finishedGame]);
    expect(stats).toBeDefined();
    expect(stats.gamesPlayed).toBe(1);
    expect(stats.gamesWon).toBe(1);
    expect(stats.winRate).toBe(100);
    expect(stats.totalPoints).toBe(770);
    expect(stats.cleanBurrachi).toBe(3);
    expect(stats.semiCleanBurrachi).toBe(1);
    expect(stats.dirtyBurrachi).toBe(1);
    expect(stats.totalBurrachi).toBe(5);
    expect(stats.closures).toBe(2);
    expect(stats.bestHandScore).toBe(420);
  });

  it('handles trio matches and losses accurately in career stats', () => {
    const user = {
      uid: 'user_trio',
      displayName: 'Giocatore Trio',
      email: 'trio@example.com',
    };

    const lostTrioGame = {
      id: 'g_trio_1',
      isFinished: true,
      mode: 'trio',
      winner: 'team2',
      team1: { name: 'Giocatore Trio', players: ['Giocatore Trio'] },
      team2: { name: 'Avversari', players: ['Paolo', 'Sara'] },
      team3: { name: 'Terzo', players: ['Terzo'] },
      rounds: [
        {
          team1Score: 200,
          team2Score: 500,
          team3Score: 150,
          team1Details: { burracoPulito: 1, chiusura: false },
        },
      ],
    };

    const stats = computeUserCareerStats(user, [lostTrioGame]);
    expect(stats.gamesPlayed).toBe(1);
    expect(stats.gamesWon).toBe(0);
    expect(stats.gamesLost).toBe(1);
    expect(stats.winRate).toBe(0);
    expect(stats.totalPoints).toBe(200);
    expect(stats.cleanBurrachi).toBe(1);
  });
});

describe('Storage & Database Layer - Backup & Restore with Tournaments', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('exports version 2 backup including active game, history, players, and tournaments', () => {
    saveActiveGame({ id: 'active_1', rounds: [] });
    archiveCurrentGame({ id: 'hist_1', rounds: [] });
    setStoredPlayers(['Marco B', 'Sara']);
    saveActiveTournament({ id: 'tourn_active_1', name: 'Torneo d Estate' });
    localStorage.setItem('burraco_tournaments_history_v1', JSON.stringify([{ id: 'tourn_old_1' }]));

    const backup = exportBackupData();
    expect(backup.version).toBe(2);
    expect(backup.activeGame?.id).toBe('active_1');
    expect(backup.history.length).toBeGreaterThan(0);
    expect(backup.players).toContain('Sara');
    expect(backup.activeTournament?.id).toBe('tourn_active_1');
    expect(backup.tournamentsHistory.length).toBe(1);
  });

  it('imports version 2 backup restoring tournaments and matches', () => {
    const backupPayload = {
      version: 2,
      exportedAt: new Date().toISOString(),
      activeGame: { id: 'restored_game' },
      history: [{ id: 'restored_hist_1' }],
      players: ['Nuovo Giocatore'],
      activeTournament: { id: 'restored_tourn' },
      tournamentsHistory: [{ id: 'restored_tourn_hist' }],
    };

    const success = importBackupData(backupPayload);
    expect(success).toBe(true);

    expect(getActiveGame()?.id).toBe('restored_game');
    expect(getGamesHistory().length).toBe(1);
    expect(getStoredPlayers()).toEqual(['Nuovo Giocatore']);
    expect(getActiveTournament()?.id).toBe('restored_tourn');
    expect(getTournamentsHistory().length).toBe(1);
  });

  it('safely rejects corrupt or invalid backup payloads', () => {
    expect(importBackupData(null)).toBe(false);
    expect(importBackupData(undefined)).toBe(false);
    expect(importBackupData('')).toBe(false);
    expect(importBackupData('{ invalid json')).toBe(false);
    expect(importBackupData([])).toBe(false);
    expect(importBackupData(12345)).toBe(false);
    expect(importBackupData({})).toBe(false); // No recognizable fields
  });
});

describe('Firestore Sanitization - sanitizeForFirestore', () => {
  it('recursively removes undefined fields without altering valid data or FieldValues', () => {
    const mockFieldValue = { _methodName: 'serverTimestamp' };
    const dirtyPayload = {
      gameId: 'abc',
      score: 0,
      winner: null,
      notes: undefined,
      timestamp: mockFieldValue,
      nested: {
        valid: true,
        bad: undefined,
      },
      rounds: [
        { team1Score: 100, invalidRoundProp: undefined },
        undefined,
      ],
    };

    const sanitized = sanitizeForFirestore(dirtyPayload);
    expect(sanitized).toEqual({
      gameId: 'abc',
      score: 0,
      winner: null,
      timestamp: mockFieldValue,
      nested: {
        valid: true,
      },
      rounds: [
        { team1Score: 100 },
      ],
    });
    expect('notes' in sanitized).toBe(false);
    expect('bad' in sanitized.nested).toBe(false);
  });

  it('preserves empty rounds array when newly created game starts', () => {
    const newGame = {
      id: 'game_test_new',
      createdAt: new Date().toISOString(),
      mode: 'pairs',
      allowSemipulito: true,
      targetScore: 2505,
      team1: { name: 'I susi', players: ['Fede'] },
      team2: { name: 'I bufu', players: ['Amico'] },
      rounds: [],
      isFinished: false,
      winner: null,
    };
    const sanitized = sanitizeForFirestore(newGame);
    expect(sanitized.id).toBe('game_test_new');
    expect(sanitized.rounds).toEqual([]);
    expect(sanitized.team1.name).toBe('I susi');
    expect(sanitized.team2.name).toBe('I bufu');
  });
});
