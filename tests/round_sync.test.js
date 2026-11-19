import { describe, it, expect } from 'vitest';
import {
  generateRoundId,
  ensureRoundIdentity,
  normalizeLegacyGame,
  reconcileGames,
} from '../src/utils/roundSync';

describe('Per-Round Sync Engine (roundId + LWW + Tombstones + Legacy Compatibility)', () => {
  it('genera roundId univoci e non vuoti', () => {
    const id1 = generateRoundId();
    const id2 = generateRoundId();
    expect(id1).toMatch(/^rnd_\d+_[a-z0-9]+$/);
    expect(id2).toMatch(/^rnd_\d+_[a-z0-9]+$/);
    expect(id1).not.toBe(id2);
  });

  it('normalizza documenti legacy privi di roundId, deletedRoundIds, suspendedAt e con ledgerChain senza errori', () => {
    const legacyDoc = {
      id: 'game_legacy_001',
      createdAt: '2026-09-10T18:00:00.000Z',
      mode: 'pairs',
      allowSemipulito: true,
      targetScore: 2005,
      team1: { name: 'Noi', players: ['Marco', 'Anna'] },
      team2: { name: 'Loro', players: ['Luca', 'Sofia'] },
      rounds: [
        { roundNumber: 1, team1Score: 450, team2Score: 120, timestamp: '2026-09-10T18:15:00.000Z' },
        { roundNumber: 2, team1Score: 300, team2Score: 500, timestamp: '2026-09-10T18:30:00.000Z' },
      ],
      isFinished: false,
      ledgerChain: [{ index: 0, type: 'GAME_CREATED', hash: 'abc123' }],
      ledgerLastHash: 'abc123',
      ledgerChainLength: 1,
    };

    const normalizedA = normalizeLegacyGame(legacyDoc);
    const normalizedB = normalizeLegacyGame({ ...legacyDoc });

    expect(normalizedA.rounds).toHaveLength(2);
    expect(normalizedA.rounds[0].roundId).toBeTruthy();
    // Determinismo su due dispositivi diversi che aprono lo stesso legacy doc
    expect(normalizedA.rounds[0].roundId).toBe(normalizedB.rounds[0].roundId);
    expect(normalizedA.rounds[1].roundId).toBe(normalizedB.rounds[1].roundId);
    expect(normalizedA.deletedRoundIds).toEqual([]);
    expect(normalizedA.suspendedAt).toBeNull();
    expect(normalizedA.stateUpdatedAt).toBeTruthy();
    expect(normalizedA.ledgerChain).toBeUndefined();
    expect(normalizedA.ledgerLastHash).toBeUndefined();
  });

  it('fonde deterministicamente e commutativamente mani aggiunte offline su 2 dispositivi diversi', () => {
    const base = {
      id: 'game_concurrent_1',
      createdAt: '2026-11-19T10:00:00.000Z',
      mode: 'pairs',
      targetScore: 2005,
      team1: { name: 'A', players: ['P1'] },
      team2: { name: 'B', players: ['P2'] },
      rounds: [
        {
          roundId: 'rnd_1',
          roundNumber: 1,
          team1Score: 300,
          team2Score: 200,
          createdAt: '2026-11-19T10:10:00.000Z',
          updatedAt: '2026-11-19T10:10:00.000Z',
        },
      ],
      deletedRoundIds: [],
      isFinished: false,
    };

    const devA = {
      ...base,
      stateUpdatedAt: '2026-11-19T10:20:00.000Z',
      rounds: [
        ...base.rounds,
        {
          roundId: 'rnd_devA_2',
          roundNumber: 2,
          team1Score: 450,
          team2Score: 150,
          createdAt: '2026-11-19T10:20:00.000Z',
          updatedAt: '2026-11-19T10:20:00.000Z',
        },
      ],
    };

    const devB = {
      ...base,
      stateUpdatedAt: '2026-11-19T10:25:00.000Z',
      rounds: [
        ...base.rounds,
        {
          roundId: 'rnd_devB_2',
          roundNumber: 2,
          team1Score: 200,
          team2Score: 500,
          createdAt: '2026-11-19T10:25:00.000Z',
          updatedAt: '2026-11-19T10:25:00.000Z',
        },
      ],
    };

    const mergedAB = reconcileGames(devA, devB);
    const mergedBA = reconcileGames(devB, devA);

    expect(mergedAB.rounds).toHaveLength(3);
    expect(mergedAB.rounds.map(r => r.roundId)).toEqual(['rnd_1', 'rnd_devA_2', 'rnd_devB_2']);
    expect(mergedAB.rounds.map(r => r.roundNumber)).toEqual([1, 2, 3]);
    expect(mergedBA.rounds.map(r => r.roundId)).toEqual(mergedAB.rounds.map(r => r.roundId));
  });

  it('risolve modifiche concorrenti sulla stessa mano via LWW (updatedAt più recente vince)', () => {
    const local = {
      id: 'game_lww',
      mode: 'pairs',
      targetScore: 2005,
      team1: { name: 'A', players: ['P1'] },
      team2: { name: 'B', players: ['P2'] },
      rounds: [
        {
          roundId: 'rnd_shared',
          roundNumber: 1,
          team1Score: 400,
          team2Score: 100,
          createdAt: '2026-11-19T10:00:00.000Z',
          updatedAt: '2026-11-19T10:05:00.000Z',
        },
      ],
    };

    const remote = {
      ...local,
      rounds: [
        {
          roundId: 'rnd_shared',
          roundNumber: 1,
          team1Score: 550,
          team2Score: 100,
          createdAt: '2026-11-19T10:00:00.000Z',
          updatedAt: '2026-11-19T10:12:00.000Z',
        },
      ],
    };

    const merged = reconcileGames(local, remote);
    expect(merged.rounds).toHaveLength(1);
    expect(merged.rounds[0].team1Score).toBe(550);
  });

  it('propaga eliminazione di una mano intermedia senza duplicati né resurrezioni (tombstone)', () => {
    const r1 = { roundId: 'rnd_1', roundNumber: 1, team1Score: 300, team2Score: 100, createdAt: '2026-11-19T10:00:00.000Z', updatedAt: '2026-11-19T10:00:00.000Z' };
    const r2 = { roundId: 'rnd_2', roundNumber: 2, team1Score: 400, team2Score: 200, createdAt: '2026-11-19T10:10:00.000Z', updatedAt: '2026-11-19T10:10:00.000Z' };
    const r3 = { roundId: 'rnd_3', roundNumber: 3, team1Score: 500, team2Score: 150, createdAt: '2026-11-19T10:20:00.000Z', updatedAt: '2026-11-19T10:20:00.000Z' };

    // Dispositivo A ha cancellato r2 e rinumerato r3 -> #2
    const devA = {
      id: 'game_del_mid',
      mode: 'pairs',
      targetScore: 2005,
      team1: { name: 'A', players: [] },
      team2: { name: 'B', players: [] },
      rounds: [r1, { ...r3, roundNumber: 2 }],
      deletedRoundIds: ['rnd_2'],
      stateUpdatedAt: '2026-11-19T10:30:00.000Z',
    };

    // Dispositivo B ha ancora tutte e 3 le mani + ne ha aggiunta una quarta r4
    const r4 = { roundId: 'rnd_4', roundNumber: 4, team1Score: 250, team2Score: 350, createdAt: '2026-11-19T10:25:00.000Z', updatedAt: '2026-11-19T10:25:00.000Z' };
    const devB = {
      id: 'game_del_mid',
      mode: 'pairs',
      targetScore: 2005,
      team1: { name: 'A', players: [] },
      team2: { name: 'B', players: [] },
      rounds: [r1, r2, r3, r4],
      deletedRoundIds: [],
      stateUpdatedAt: '2026-11-19T10:25:00.000Z',
    };

    const merged = reconcileGames(devA, devB);
    expect(merged.rounds.map(r => r.roundId)).toEqual(['rnd_1', 'rnd_3', 'rnd_4']);
    expect(merged.rounds.map(r => r.roundNumber)).toEqual([1, 2, 3]);
    expect(merged.deletedRoundIds).toContain('rnd_2');
  });

  it('mantiene aperta la partita in caso di parità esatta al targetScore fino allo spareggio', () => {
    const tiedGame = {
      id: 'game_tie_sync',
      mode: 'pairs',
      targetScore: 2005,
      team1: { name: 'A', players: [] },
      team2: { name: 'B', players: [] },
      rounds: [
        { roundId: 'r1', roundNumber: 1, team1Score: 1005, team2Score: 1005, createdAt: '2026-11-19T10:00:00.000Z', updatedAt: '2026-11-19T10:00:00.000Z' },
        { roundId: 'r2', roundNumber: 2, team1Score: 1000, team2Score: 1000, createdAt: '2026-11-19T10:10:00.000Z', updatedAt: '2026-11-19T10:10:00.000Z' },
      ],
    };

    const merged = reconcileGames(tiedGame, tiedGame);
    expect(merged.isFinished).toBe(false);
    expect(merged.winner).toBeNull();
  });

  it('gestisce oltre 250 modifiche consecutive senza troncamenti né perdita di dati', () => {
    let state = {
      id: 'game_250_edits',
      mode: 'pairs',
      targetScore: 10000,
      team1: { name: 'A', players: [] },
      team2: { name: 'B', players: [] },
      rounds: [],
      deletedRoundIds: [],
    };

    for (let i = 1; i <= 250; i++) {
      const round = ensureRoundIdentity({
        roundId: `rnd_edit_${i % 25}`,
        roundNumber: (i % 25) + 1,
        team1Score: 10 * i,
        team2Score: 5 * i,
        createdAt: `2026-11-19T10:00:${String(i % 25).padStart(2, '0')}.000Z`,
        updatedAt: new Date(Date.UTC(2026, 10, 19, 10, 0, 0) + i * 1000).toISOString(),
      });
      state = reconcileGames(state, { ...state, rounds: [round] });
    }

    expect(state.rounds).toHaveLength(25);
    expect(state.rounds[0].roundNumber).toBe(1);
    expect(state.rounds[24].roundNumber).toBe(25);
  });
});
