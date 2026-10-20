import { describe, it, expect } from 'vitest';
import {
  generateRoundRobinSchedule,
  calculateTournamentStandings,
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

  it('calculates points and rankings accurately for completed matches', () => {
    const matches = [
      // Match 1: t1 vince contro t2 (2050 - 1500)
      {
        id: 'm1',
        status: 'completed',
        team1Id: 't1',
        team2Id: 't2',
        team1Score: 2050,
        team2Score: 1500,
      },
      // Match 2: t1 vince contro t3 (2200 - 1800)
      {
        id: 'm2',
        status: 'completed',
        team1Id: 't1',
        team2Id: 't3',
        team1Score: 2200,
        team2Score: 1800,
      },
      // Match 3: t2 vince contro t3 (2500 - 1200)
      {
        id: 'm3',
        status: 'completed',
        team1Id: 't2',
        team2Id: 't3',
        team1Score: 2500,
        team2Score: 1200,
      },
    ];

    const standings = calculateTournamentStandings(teams, matches);

    // 1° posto: t1 (2 vittorie = 6 pt)
    expect(standings[0].id).toBe('t1');
    expect(standings[0].tournamentPoints).toBe(6);
    expect(standings[0].won).toBe(2);
    expect(standings[0].pointsFor).toBe(4250);
    expect(standings[0].pointsAgainst).toBe(3300);
    expect(standings[0].pointDifference).toBe(950);

    // 2° posto: t2 (1 vittoria, 1 sconfitta = 3 pt)
    expect(standings[1].id).toBe('t2');
    expect(standings[1].tournamentPoints).toBe(3);
    expect(standings[1].won).toBe(1);
    expect(standings[1].lost).toBe(1);

    // 3° posto: t3 (0 vittorie, 2 sconfitte = 0 pt)
    expect(standings[2].id).toBe('t3');
    expect(standings[2].tournamentPoints).toBe(0);
    expect(standings[2].lost).toBe(2);
  });

  it('properly handles draws (1 pt each)', () => {
    const matches = [
      {
        id: 'm1',
        status: 'completed',
        team1Id: 't1',
        team2Id: 't2',
        team1Score: 2000,
        team2Score: 2000, // Pareggio
      },
    ];

    const standings = calculateTournamentStandings(teams, matches);
    const t1 = standings.find(s => s.id === 't1');
    const t2 = standings.find(s => s.id === 't2');

    expect(t1.tournamentPoints).toBe(1);
    expect(t1.drawn).toBe(1);
    expect(t1.pointDifference).toBe(0);

    expect(t2.tournamentPoints).toBe(1);
    expect(t2.drawn).toBe(1);
    expect(t2.pointDifference).toBe(0);
  });

  it('resolves tie-break using Burraco point difference', () => {
    const matches = [
      // Entrambe hanno 1 vittoria, ma t1 ha differenza punti migliore (+500 vs +100)
      {
        id: 'm1',
        status: 'completed',
        team1Id: 't1',
        team2Id: 't3',
        team1Score: 2000,
        team2Score: 1500, // +500
      },
      {
        id: 'm2',
        status: 'completed',
        team1Id: 't2',
        team2Id: 't3',
        team1Score: 2000,
        team2Score: 1900, // +100
      },
    ];

    const standings = calculateTournamentStandings(teams, matches);

    // Sia t1 che t2 hanno 3 punti torneo
    expect(standings[0].tournamentPoints).toBe(3);
    expect(standings[1].tournamentPoints).toBe(3);

    // Ma t1 deve essere prima per migliore differenza punti (+500 vs +100)
    expect(standings[0].id).toBe('t1');
    expect(standings[0].pointDifference).toBe(500);
    expect(standings[1].id).toBe('t2');
    expect(standings[1].pointDifference).toBe(100);
  });
});
