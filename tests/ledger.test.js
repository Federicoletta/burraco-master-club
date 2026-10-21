import { describe, it, expect } from 'vitest';
import {
  computeBlockHash,
  calculateBlockContentHash,
  createGenesisBlock,
  appendBlock,
  verifyChainIntegrity,
  reconstructGameStateFromChain,
  mergeChainsCRDT,
  migrateLegacyGameToLedger,
  EVENT_TYPES
} from '../src/utils/ledger';

describe('Burraco Distributed Ledger & CRDT Event-Sourcing', () => {
  it('calcola hash deterministici coerenti per stringhe identiche', () => {
    const str = JSON.stringify({ index: 1, text: 'Mano Burraco' });
    const h1 = computeBlockHash(str);
    const h2 = computeBlockHash(str);
    expect(h1).toBe(h2);
    expect(h1.length).toBe(16);
  });

  it('crea un blocco Genesis valido e rispetta le specifiche di integrità', () => {
    const genesis = createGenesisBlock({
      id: 'game_test_1',
      mode: 'pairs',
      targetScore: 2005,
      team1: { name: 'I Campioni', players: ['Marco', 'Anna'] },
      team2: { name: 'I Rivali', players: ['Luca', 'Sofia'] },
    });

    expect(genesis.index).toBe(0);
    expect(genesis.prevHash).toBe('GENESIS_00000000');
    expect(genesis.type).toBe(EVENT_TYPES.GAME_CREATED);

    const verification = verifyChainIntegrity([genesis]);
    expect(verification.valid).toBe(true);
  });

  it('aggiunge round sequenziali preservando la catena crittografica', () => {
    let chain = [createGenesisBlock({ id: 'game_100', targetScore: 2005 })];

    chain = appendBlock(chain, EVENT_TYPES.ROUND_ADDED, {
      roundNumber: 1,
      team1Points: 450,
      team2Points: 120,
    }, { uid: 'user_1', name: 'Mario' });

    chain = appendBlock(chain, EVENT_TYPES.ROUND_ADDED, {
      roundNumber: 2,
      team1Points: 600,
      team2Points: 300,
    }, { uid: 'user_2', name: 'Anna' });

    expect(chain.length).toBe(3);
    expect(chain[1].index).toBe(1);
    expect(chain[1].prevHash).toBe(chain[0].hash);
    expect(chain[2].index).toBe(2);
    expect(chain[2].prevHash).toBe(chain[1].hash);

    const verification = verifyChainIntegrity(chain);
    expect(verification.valid).toBe(true);
  });

  it('rileva tentativi di manomissione o alterazione dati nella catena', () => {
    let chain = [createGenesisBlock({ id: 'game_tamper' })];
    chain = appendBlock(chain, EVENT_TYPES.ROUND_ADDED, { roundNumber: 1, team1Points: 100 });
    chain = appendBlock(chain, EVENT_TYPES.ROUND_ADDED, { roundNumber: 2, team1Points: 200 });

    // Manomissione dolosa di un punteggio nel blocco 1
    const tampered = JSON.parse(JSON.stringify(chain));
    tampered[1].payload.team1Points = 9999;

    const verification = verifyChainIntegrity(tampered);
    expect(verification.valid).toBe(false);
    expect(verification.brokenIndex).toBe(1);
  });

  it('ricostruisce fedelmente lo stato della partita e determina la vittoria', () => {
    let chain = [createGenesisBlock({
      id: 'game_replay',
      targetScore: 1005,
      team1: { name: 'Alpha', players: ['A1'] },
      team2: { name: 'Beta', players: ['B1'] },
    })];

    chain = appendBlock(chain, EVENT_TYPES.ROUND_ADDED, {
      roundNumber: 1,
      team1Points: 400,
      team2Points: 200,
    });
    chain = appendBlock(chain, EVENT_TYPES.ROUND_ADDED, {
      roundNumber: 2,
      team1Points: 700, // Totale Alpha: 1100 >= 1005
      team2Points: 300,
    });

    const state = reconstructGameStateFromChain(chain);
    expect(state).not.toBeNull();
    expect(state.rounds.length).toBe(2);
    expect(state.isFinished).toBe(true);
    expect(state.winner).toBe('team1');
  });

  it('gestisce correttamente l annullamento di una mano (ROUND_REVERTED)', () => {
    let chain = [createGenesisBlock({ id: 'game_undo', targetScore: 2005 })];
    chain = appendBlock(chain, EVENT_TYPES.ROUND_ADDED, { roundNumber: 1, team1Points: 400, team2Points: 200 });
    chain = appendBlock(chain, EVENT_TYPES.ROUND_ADDED, { roundNumber: 2, team1Points: 500, team2Points: 100 });
    
    // Annullamento della mano 2
    chain = appendBlock(chain, EVENT_TYPES.ROUND_REVERTED, { roundNumber: 2 });

    const state = reconstructGameStateFromChain(chain);
    expect(state.rounds.length).toBe(1);
    expect(state.rounds[0].team1Points).toBe(400);
    expect(verifyChainIntegrity(chain).valid).toBe(true);
  });

  it('fonde due catene concorrenti tramite algoritmo deterministico CRDT', () => {
    const genesis = createGenesisBlock({ id: 'game_crdt' });
    let branchA = [genesis];
    let branchB = [genesis];

    // Dispositivo A registra la mano 1
    branchA = appendBlock(branchA, EVENT_TYPES.ROUND_ADDED, {
      roundNumber: 1,
      team1Points: 300,
      team2Points: 100,
    }, { uid: 'userA', name: 'Mario' });

    // Dispositivo B modifica il target score
    branchB = appendBlock(branchB, EVENT_TYPES.TARGET_UPDATED, {
      targetScore: 2505,
    }, { uid: 'userB', name: 'Anna' });

    // Fusione CRDT dei due rami
    const merged = mergeChainsCRDT(branchA, branchB);

    expect(merged.length).toBe(3);
    const verification = verifyChainIntegrity(merged);
    expect(verification.valid).toBe(true);

    const mergedState = reconstructGameStateFromChain(merged);
    expect(mergedState.rounds.length).toBe(1);
    expect(mergedState.targetScore).toBe(2505);
  });

  it('migra in modo trasparente una vecchia partita legacy in un ledger crittografico', () => {
    const legacyGame = {
      id: 'legacy_123',
      createdAt: '2026-10-20T10:00:00.000Z',
      mode: 'pairs',
      targetScore: 1505,
      team1: { name: 'Vecchia 1', players: ['P1'] },
      team2: { name: 'Vecchia 2', players: ['P2'] },
      rounds: [
        { roundNumber: 1, team1Points: 300, team2Points: 200 },
        { roundNumber: 2, team1Points: 500, team2Points: 150 },
      ],
      isFinished: false,
    };

    const chain = migrateLegacyGameToLedger(legacyGame);
    expect(chain.length).toBe(3); // Genesis + 2 round
    expect(verifyChainIntegrity(chain).valid).toBe(true);

    const state = reconstructGameStateFromChain(chain);
    expect(state.id).toBe('legacy_123');
    expect(state.rounds.length).toBe(2);
    expect(state.team1.name).toBe('Vecchia 1');
  });
});
