import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateRoundRobinSchedule,
  calculateTournamentStandings,
  calculateFiburVictoryPoints,
  formatStandingsForSharing,
  formatScheduleForSharing,
  computeTournamentProgress,
  pauseTournamentObject,
  resumeTournamentObject,
  getPausedTournaments,
  savePausedTournaments,
} from '../src/utils/tournament';

describe('Tournament Engine - generateRoundRobinSchedule', () => {
  it('returns empty array if less than 2 teams provided', () => {
    expect(generateRoundRobinSchedule(null)).toEqual([]);
    expect(generateRoundRobinSchedule([])).toEqual([]);
    expect(generateRoundRobinSchedule([{ id: 't1', name: 'T1' }])).toEqual([]);
  });

  it('generates correct schedule for 4 teams (even)', () => {
    const teams = [
      { id: 't1', name: 'Team 1' },
      { id: 't2', name: 'Team 2' },
      { id: 't3', name: 'Team 3' },
      { id: 't4', name: 'Team 4' },
    ];
    const rounds = generateRoundRobinSchedule(teams);

    // 4 teams -> 3 rounds (N-1)
    expect(rounds.length).toBe(3);

    // Each round has 2 matches (N/2)
    rounds.forEach((r, idx) => {
      expect(r.roundNumber).toBe(idx + 1);
      expect(r.title).toBe(`Giornata ${idx + 1}`);
      expect(r.matches.length).toBe(2);
    });

    // Total matches: 3 rounds * 2 = 6 matches (4*3/2 = 6)
    const allMatches = rounds.flatMap(r => r.matches);
    expect(allMatches.length).toBe(6);

    // Check that every pair plays against each other exactly once
    const pairsMet = new Set();
    allMatches.forEach(m => {
      const pairKey = [m.team1Id, m.team2Id].sort().join(' vs ');
      expect(pairsMet.has(pairKey)).toBe(false);
      pairsMet.add(pairKey);
    });
    expect(pairsMet.size).toBe(6);
  });

  it('generates correct schedule for 3 teams (odd, includes bye handled internally)', () => {
    const teams = [
      { id: 't1', name: 'Team 1' },
      { id: 't2', name: 'Team 2' },
      { id: 't3', name: 'Team 3' },
    ];
    const rounds = generateRoundRobinSchedule(teams);

    // 3 teams -> 3 rounds, each team plays 2 matches (1 bye per round)
    expect(rounds.length).toBe(3);
    const allMatches = rounds.flatMap(r => r.matches);
    expect(allMatches.length).toBe(3); // 3 * 2 / 2 = 3

    // No match should have __bye__
    allMatches.forEach(m => {
      expect(m.team1Id).not.toBe('__bye__');
      expect(m.team2Id).not.toBe('__bye__');
    });
  });
});

describe('Tournament Engine - FIBUR Victory Points Calculation', () => {
  it('converts exact draws and small diffs (0-50) to 10-10', () => {
    expect(calculateFiburVictoryPoints(2000, 2000)).toEqual({ team1Vp: 10, team2Vp: 10, diff: 0 });
    expect(calculateFiburVictoryPoints(2040, 2000)).toEqual({ team1Vp: 10, team2Vp: 10, diff: 40 });
  });

  it('correctly maps all official FIBUR brackets', () => {
    // 51-150 -> 11-9
    expect(calculateFiburVictoryPoints(2100, 2000)).toEqual({ team1Vp: 11, team2Vp: 9, diff: 100 });
    // 151-300 -> 12-8
    expect(calculateFiburVictoryPoints(2250, 2000)).toEqual({ team1Vp: 12, team2Vp: 8, diff: 250 });
    // 301-500 -> 13-7
    expect(calculateFiburVictoryPoints(2450, 2000)).toEqual({ team1Vp: 13, team2Vp: 7, diff: 450 });
    // 501-750 -> 14-6
    expect(calculateFiburVictoryPoints(2600, 2000)).toEqual({ team1Vp: 14, team2Vp: 6, diff: 600 });
    // 751-1050 -> 15-5
    expect(calculateFiburVictoryPoints(2900, 2000)).toEqual({ team1Vp: 15, team2Vp: 5, diff: 900 });
    // 1051-1400 -> 16-4
    expect(calculateFiburVictoryPoints(3200, 2000)).toEqual({ team1Vp: 16, team2Vp: 4, diff: 1200 });
    // 1401-1800 -> 17-3
    expect(calculateFiburVictoryPoints(3500, 2000)).toEqual({ team1Vp: 17, team2Vp: 3, diff: 1500 });
    // 1801-2250 -> 18-2
    expect(calculateFiburVictoryPoints(4000, 2000)).toEqual({ team1Vp: 18, team2Vp: 2, diff: 2000 });
    // 2251-2750 -> 19-1
    expect(calculateFiburVictoryPoints(4500, 2000)).toEqual({ team1Vp: 19, team2Vp: 1, diff: 2500 });
    // > 2750 -> 20-0
    expect(calculateFiburVictoryPoints(5000, 2000)).toEqual({ team1Vp: 20, team2Vp: 0, diff: 3000 });
  });

  it('correctly handles team2 winning', () => {
    expect(calculateFiburVictoryPoints(1500, 2100)).toEqual({ team1Vp: 6, team2Vp: 14, diff: -600 });
  });
});

describe('Tournament Engine - calculateTournamentStandings', () => {
  const teams = [
    { id: 't1', name: 'Coppia Oro', players: ['Mario', 'Luigi'] },
    { id: 't2', name: 'Coppia Argento', players: ['Peach', 'Daisy'] },
    { id: 't3', name: 'Coppia Bronzo', players: ['Wario', 'Waluigi'] },
  ];

  it('initializes all teams with 0 points when no matches played', () => {
    const standings = calculateTournamentStandings(teams, []);
    expect(standings.length).toBe(3);
    standings.forEach(s => {
      expect(s.tournamentPoints).toBe(0);
      expect(s.played).toBe(0);
      expect(s.won).toBe(0);
      expect(s.drawn).toBe(0);
      expect(s.lost).toBe(0);
    });
  });

  it('calculates points and rankings accurately for completed matches in classic mode', () => {
    const matches = [
      {
        id: 'm1',
        status: 'completed',
        team1Id: 't1',
        team2Id: 't2',
        team1Score: 2050,
        team2Score: 1500,
      },
      {
        id: 'm2',
        status: 'completed',
        team1Id: 't1',
        team2Id: 't3',
        team1Score: 2200,
        team2Score: 1800,
      },
      {
        id: 'm3',
        status: 'completed',
        team1Id: 't2',
        team2Id: 't3',
        team1Score: 2500,
        team2Score: 1200,
      },
    ];

    const standings = calculateTournamentStandings(teams, matches, 'classic');

    expect(standings[0].id).toBe('t1');
    expect(standings[0].tournamentPoints).toBe(6);
    expect(standings[0].won).toBe(2);
    expect(standings[0].pointsFor).toBe(4250);
    expect(standings[0].pointsAgainst).toBe(3300);
    expect(standings[0].pointDifference).toBe(950);

    expect(standings[1].id).toBe('t2');
    expect(standings[1].tournamentPoints).toBe(3);
    expect(standings[1].won).toBe(1);
    expect(standings[1].lost).toBe(1);

    expect(standings[2].id).toBe('t3');
    expect(standings[2].tournamentPoints).toBe(0);
    expect(standings[2].lost).toBe(2);
  });

  it('calculates points accurately with FIBUR Victory Points system', () => {
    const matches = [
      // t1 vs t2: 2050 - 1500 (diff +550 -> 14 VP to t1, 6 VP to t2)
      {
        id: 'm1',
        status: 'completed',
        team1Id: 't1',
        team2Id: 't2',
        team1Score: 2050,
        team2Score: 1500,
      },
      // t1 vs t3: 2400 - 2000 (diff +400 -> 13 VP to t1, 7 VP to t3)
      {
        id: 'm2',
        status: 'completed',
        team1Id: 't1',
        team2Id: 't3',
        team1Score: 2400,
        team2Score: 2000,
      },
    ];

    const standings = calculateTournamentStandings(teams, matches, 'fibur');

    // t1: 14 + 13 = 27 VP
    expect(standings[0].id).toBe('t1');
    expect(standings[0].tournamentPoints).toBe(27);
    expect(standings[0].victoryPoints).toBe(27);

    // t3: 7 VP (diff -400)
    // t2: 6 VP (diff -550)
    expect(standings[1].id).toBe('t3');
    expect(standings[1].tournamentPoints).toBe(7);

    expect(standings[2].id).toBe('t2');
    expect(standings[2].tournamentPoints).toBe(6);
  });

  it('properly formats standings and schedule for WhatsApp sharing', () => {
    const tournament = {
      id: 'tourn_1',
      name: 'Torneo Sociale',
      scoringSystem: 'fibur',
      targetScore: 2505,
      rounds: [
        {
          roundNumber: 1,
          title: 'Giornata 1',
          matches: [
            {
              tableNumber: 1,
              team1Name: 'Coppia Oro',
              team2Name: 'Coppia Argento',
              team1Score: 2050,
              team2Score: 1500,
              status: 'completed',
            },
          ],
        },
      ],
    };

    const standings = calculateTournamentStandings(teams, tournament.rounds[0].matches, 'fibur');
    const shareText = formatStandingsForSharing(tournament, standings);

    expect(shareText).toContain('TORNEO SOCIALE');
    expect(shareText).toContain('FIBUR (Victory Points)');
    expect(shareText).toContain('🥇');
    expect(shareText).toContain('Coppia Oro');

    const scheduleText = formatScheduleForSharing(tournament);
    expect(scheduleText).toContain('CALENDARIO TORNEO: TORNEO SOCIALE');
    expect(scheduleText).toContain('Tavolo 1');
  });
});

describe('Tournament Engine - Multi-Tournament Pause, Resume & Progress', () => {
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

  beforeEach(() => {
    global.localStorage = localStorageMock;
    localStorage.clear();
  });

  it('computes detailed progress for rounds, tables, and remaining matches', () => {
    const emptyProgress = computeTournamentProgress(null);
    expect(emptyProgress.totalMatches).toBe(0);
    expect(emptyProgress.percentComplete).toBe(0);

    const tournament = {
      id: 'tourn_prog',
      rounds: [
        {
          roundNumber: 1,
          title: 'Giornata 1',
          matches: [
            { id: 'm1', status: 'completed' },
            { id: 'm2', status: 'completed' },
          ],
        },
        {
          roundNumber: 2,
          title: 'Giornata 2',
          matches: [
            { id: 'm3', status: 'in_progress' },
            { id: 'm4', status: 'pending' },
          ],
        },
        {
          roundNumber: 3,
          title: 'Giornata 3',
          matches: [
            { id: 'm5', status: 'pending' },
            { id: 'm6', status: 'pending' },
          ],
        },
      ],
    };

    const progress = computeTournamentProgress(tournament);
    expect(progress.totalMatches).toBe(6);
    expect(progress.completedMatches).toBe(2);
    expect(progress.inProgressMatches).toBe(1);
    expect(progress.remainingMatches).toBe(4);
    expect(progress.percentComplete).toBe(33);
    expect(progress.totalRounds).toBe(3);
    expect(progress.completedRounds).toBe(1);
    expect(progress.currentRoundNumber).toBe(2);
    expect(progress.currentRoundRemaining).toBe(2);
    expect(progress.roundsProgress[0].isDone).toBe(true);
    expect(progress.roundsProgress[1].isDone).toBe(false);
  });

  it('pauses and resumes tournament objects while preserving rounds and trimming metadata', () => {
    const active = {
      id: 'tourn_1',
      name: 'Torneo Autunno',
      status: 'in_progress',
      rounds: [{ roundNumber: 1, matches: [{ id: 'm1', status: 'completed', team1Score: 2000, team2Score: 1500 }] }],
    };

    const longNote = 'N'.repeat(300);
    const paused = pauseTournamentObject(active, {
      resumeDate: '  2026-11-20  ',
      resumeNote: `  ${longNote}  `,
    });

    expect(paused.status).toBe('paused');
    expect(typeof paused.pausedAt).toBe('string');
    expect(paused.resumeDate).toBe('2026-11-20');
    expect(paused.resumeNote.length).toBe(240);
    expect(paused.rounds[0].matches[0].team1Score).toBe(2000);

    // Updating metadata on an already paused tournament keeps original pausedAt timestamp
    const originalPausedAt = paused.pausedAt;
    const edited = pauseTournamentObject(paused, {
      resumeDate: '',
      resumeNote: 'Riprendiamo sabato sera',
    });
    expect(edited.pausedAt).toBe(originalPausedAt);
    expect(edited.resumeDate).toBeNull();
    expect(edited.resumeNote).toBe('Riprendiamo sabato sera');

    // Resuming clears pause metadata and restores 'in_progress'
    const resumed = resumeTournamentObject(edited);
    expect(resumed.status).toBe('in_progress');
    expect(resumed.pausedAt).toBeNull();
    expect(resumed.resumeDate).toBeNull();
    expect(resumed.resumeNote).toBeNull();
    expect(resumed.rounds[0].matches[0].team1Score).toBe(2000);
  });

  it('persists and loads paused tournaments list safely in localStorage', () => {
    expect(getPausedTournaments()).toEqual([]);

    savePausedTournaments([
      { id: 't_p1', name: 'Coppa Venerdi', status: 'paused' },
      null,
      { id: 't_p2', name: 'Trofeo Domenica', status: 'paused' },
    ]);

    const loaded = getPausedTournaments();
    expect(loaded.length).toBe(2);
    expect(loaded.map(t => t.id)).toEqual(['t_p1', 't_p2']);
  });
});

