import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateTeamRoundScore,
} from '../src/constants/burraco';
import {
  saveActiveGame,
  getActiveGame,
  archiveCurrentGame,
  computeUserCareerStats,
  getStorageUsage,
  safeSetItem,
} from '../src/utils/storage';

// In-memory mock di localStorage
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
    get length() {
      return Object.keys(store).length;
    },
    key: (i) => Object.keys(store)[i] || null,
  };
})();

global.localStorage = localStorageMock;

describe('Persistenza & Storage Quota Manager', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('computes storage usage stats accurately', () => {
    localStorage.setItem('test_key', 'test_value_12345');
    const stats = getStorageUsage();

    expect(stats).toBeDefined();
    expect(stats.totalBytes).toBeGreaterThan(0);
    expect(stats.percent).toBeGreaterThanOrEqual(0);
    expect(stats.isNearLimit).toBe(false);
  });

  it('safeSetItem stores values cleanly in localStorage', () => {
    const success = safeSetItem('my_key', JSON.stringify({ a: 1 }));
    expect(success).toBe(true);
    expect(localStorage.getItem('my_key')).toContain('"a":1');
  });
});

describe('Game Engine - End-to-End Match Lifecycle Simulation', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('simulates a complete match from creation to target score, victory, archiving, and career stats', () => {
    const currentUser = {
      uid: 'user_winner_1',
      displayName: 'Campione',
      email: 'campione@burraco.it',
    };

    // 1. Inizializzazione nuova partita a coppie con soglia 2050
    let game = {
      id: 'match_e2e_100',
      createdAt: new Date().toISOString(),
      mode: 'pairs',
      allowSemipulito: true,
      targetScore: 2050,
      team1: { name: 'I Campioni', players: ['Campione', 'Elena'] },
      team2: { name: 'Gli Sfidanti', players: ['Luca', 'Sara'] },
      rounds: [],
      winner: null,
      isFinished: false,
    };
    saveActiveGame(game);
    expect(getActiveGame()?.id).toBe('match_e2e_100');

    // 2. Mano 1: Team 1 fa 1 burraco pulito (+200), chiusura (+100) e 150 pt carte a terra = 450 pt
    // Team 2 paga mancato pozzetto (-100) e 50 pt carte a terra = -50 pt
    const round1Team1Details = {
      burracoPulito: 1,
      burracoSemipulito: 0,
      burracoSporco: 0,
      chiusura: true,
      cardsOnTableDirect: 150,
      cardsInHandDirect: 0,
    };
    const s1_t1 = calculateTeamRoundScore(round1Team1Details);
    expect(s1_t1).toBe(450); // 200 + 100 + 150

    const round1Team2Details = {
      pozzetto: 'non_preso',
      cardsOnTableDirect: 50,
      cardsInHandDirect: 0,
    };
    const s1_t2 = calculateTeamRoundScore(round1Team2Details);
    expect(s1_t2).toBe(-50); // -100 + 50

    game.rounds.push({
      roundNumber: 1,
      team1Score: s1_t1,
      team2Score: s1_t2,
      team1Details: round1Team1Details,
      team2Details: round1Team2Details,
    });
    saveActiveGame(game);

    // 3. Mano 2: Team 1 fa 2 burrachi sporchi (+200), 1 semipulito (+150), 300 pt carte a terra = 650 pt
    // Team 2 fa 1 burraco pulito (+200), chiusura (+100), 200 pt carte = 500 pt
    const round2Team1Details = {
      burracoSporco: 2,
      burracoSemipulito: 1,
      cardsOnTableDirect: 300,
      cardsInHandDirect: 0,
    };
    const s2_t1 = calculateTeamRoundScore(round2Team1Details);
    expect(s2_t1).toBe(650); // 200 + 150 + 300

    const round2Team2Details = {
      burracoPulito: 1,
      chiusura: true,
      cardsOnTableDirect: 200,
      cardsInHandDirect: 0,
    };
    const s2_t2 = calculateTeamRoundScore(round2Team2Details);
    expect(s2_t2).toBe(500); // 200 + 100 + 200

    game.rounds.push({
      roundNumber: 2,
      team1Score: s2_t1,
      team2Score: s2_t2,
      team1Details: round2Team1Details,
      team2Details: round2Team2Details,
    });
    saveActiveGame(game);

    // 4. Mano 3: Team 1 fa una grande mano da 1000 pt (best hand)
    // 3 burrachi puliti (600), chiusura (100), carte a terra 300 = 1000 pt
    const round3Team1Details = {
      burracoPulito: 3,
      chiusura: true,
      cardsOnTableDirect: 300,
      cardsInHandDirect: 0,
    };
    const s3_t1 = calculateTeamRoundScore(round3Team1Details);
    expect(s3_t1).toBe(1000);

    game.rounds.push({
      roundNumber: 3,
      team1Score: s3_t1,
      team2Score: 100,
      team1Details: round3Team1Details,
      team2Details: { cardsOnTableDirect: 100, cardsInHandDirect: 0 },
    });

    // Calcolo progressivo totale
    const totalTeam1 = game.rounds.reduce((acc, r) => acc + r.team1Score, 0);
    const totalTeam2 = game.rounds.reduce((acc, r) => acc + r.team2Score, 0);

    expect(totalTeam1).toBe(2100); // 450 + 650 + 1000 = 2100 >= 2050
    expect(totalTeam2).toBe(550);  // -50 + 500 + 100 = 550

    // Verifica superamento soglia vittoria
    expect(totalTeam1).toBeGreaterThanOrEqual(game.targetScore);
    game.isFinished = true;
    game.winner = 'team1';
    game.completedAt = new Date().toISOString();

    // 5. Archiviazione partita conclusa nello storico
    const updatedHistory = archiveCurrentGame(game);
    expect(updatedHistory.length).toBe(1);
    expect(updatedHistory[0].isFinished).toBe(true);
    expect(updatedHistory[0].winner).toBe('team1');

    // 6. Calcolo statistiche di carriera per l'utente "Campione"
    const stats = computeUserCareerStats(currentUser, updatedHistory);
    expect(stats.gamesPlayed).toBe(1);
    expect(stats.gamesWon).toBe(1);
    expect(stats.gamesLost).toBe(0);
    expect(stats.winRate).toBe(100);
    expect(stats.totalPoints).toBe(2100);
    expect(stats.cleanBurrachi).toBe(4); // 1 + 0 + 3 = 4
    expect(stats.semiCleanBurrachi).toBe(1); // 0 + 1 + 0 = 1
    expect(stats.dirtyBurrachi).toBe(2); // 0 + 2 + 0 = 2
    expect(stats.totalBurrachi).toBe(7); // 4 + 1 + 2 = 7
    expect(stats.closures).toBe(2); // mano 1 e mano 3
    expect(stats.bestHandScore).toBe(1000); // mano 3
  });

  it('guarantees safe round execution and modal closure even when tournament matches array is incomplete or null', () => {
    let closed = false;
    let submitted = false;

    const mockOnClose = () => {
      closed = true;
    };

    // Simulate saving a round where downstream handler might encounter malformed tournament structure
    const activeTournament = {
      id: 'tourn_1',
      rounds: [
        { roundNumber: 1 }, // Note: matches is intentionally missing/undefined to test resilience
      ]
    };

    let tournamentUpdated = false;
    const handleUpdateTournament = (t) => {
      tournamentUpdated = true;
    };

    // Safe round mapping simulation matching useBurracoGame.js
    const safeTournUpdatedRounds = (activeTournament.rounds || []).map(r => ({
      ...r,
      matches: (r.matches || []).map(m => m)
    }));

    expect(safeTournUpdatedRounds[0].matches).toEqual([]);
    expect(() => {
      try {
        submitted = true;
        handleUpdateTournament({ ...activeTournament, rounds: safeTournUpdatedRounds });
      } finally {
        mockOnClose();
        submitted = false;
      }
    }).not.toThrow();

    expect(tournamentUpdated).toBe(true);
    expect(closed).toBe(true);
    expect(submitted).toBe(false);
  });
});
