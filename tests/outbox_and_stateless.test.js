import { describe, it, expect, beforeEach } from 'vitest';
import {
  addToOutboxQueue,
  getOutboxQueue,
  removeFromOutboxQueue,
  clearOutboxQueue
} from '../src/utils/storage';
import {
  encodeGameToUrlToken,
  decodeGameFromUrlToken,
  generateStatelessGameShareUrl
} from '../src/utils/statelessGame';

// In-memory mock di localStorage per Vitest
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

describe('Coda di Sincronizzazione Offline (Outbox Queue Pattern)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('aggiunge e recupera correttamente partite nella coda offline', () => {
    expect(getOutboxQueue()).toEqual([]);

    const game1 = { id: 'game_offline_1', rounds: [{ roundNumber: 1, team1Score: 400 }] };
    addToOutboxQueue(game1);

    const queue = getOutboxQueue();
    expect(queue.length).toBe(1);
    expect(queue[0].id).toBe('game_offline_1');
  });

  it('aggiorna una partita già esistente nella coda senza duplicarla', () => {
    const game = { id: 'game_offline_dup', rounds: [{ roundNumber: 1 }] };
    addToOutboxQueue(game);

    const updated = { id: 'game_offline_dup', rounds: [{ roundNumber: 1 }, { roundNumber: 2 }] };
    addToOutboxQueue(updated);

    const queue = getOutboxQueue();
    expect(queue.length).toBe(1);
    expect(queue[0].rounds.length).toBe(2);
  });

  it('rimuove correttamente elementi sincronizzati dalla coda', () => {
    addToOutboxQueue({ id: 'g1' });
    addToOutboxQueue({ id: 'g2' });
    expect(getOutboxQueue().length).toBe(2);

    removeFromOutboxQueue('g1');
    const remaining = getOutboxQueue();
    expect(remaining.length).toBe(1);
    expect(remaining[0].id).toBe('g2');
  });
});

describe('Paracadute Stateless Game (State-in-URL)', () => {
  const sampleGame = {
    id: 'game_stateless_123',
    createdAt: '2026-10-21T08:00:00.000Z',
    mode: 'pairs',
    allowSemipulito: true,
    targetScore: 2005,
    team1: { name: 'I Campioni dell\'Adriatico', players: ['Mario', 'Giuseppe'] },
    team2: { name: 'Le Regine di Cuori', players: ['Anna', 'Lucia'] },
    rounds: [
      {
        roundNumber: 1,
        team1Score: 450,
        team2Score: 120,
        team1Points: 450,
        team2Points: 120,
        recordedBy: 'Mario'
      },
      {
        roundNumber: 2,
        team1Score: 600,
        team2Score: 300,
        team1Points: 600,
        team2Points: 300,
        recordedBy: 'Anna'
      }
    ],
    winner: null,
    isFinished: false,
    ledgerLastHash: 'a1b2c3d4e5f6'
  };

  it('codifica e decodifica fedelmente una partita mantenendo accenti e punteggi', () => {
    const token = encodeGameToUrlToken(sampleGame);
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(20);

    const decoded = decodeGameFromUrlToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded.id).toBe('game_stateless_123');
    expect(decoded.team1.name).toBe('I Campioni dell\'Adriatico');
    expect(decoded.team2.name).toBe('Le Regine di Cuori');
    expect(decoded.rounds.length).toBe(2);
    expect(decoded.rounds[0].team1Score).toBe(450);
    expect(decoded.rounds[1].recordedBy).toBe('Anna');
    expect(decoded.ledgerLastHash).toBe('a1b2c3d4e5f6');
  });

  it('gestisce correttamente token con prefisso #backup=', () => {
    const token = encodeGameToUrlToken(sampleGame);
    const withPrefix = `#backup=${token}`;
    const decoded = decodeGameFromUrlToken(withPrefix);
    expect(decoded).not.toBeNull();
    expect(decoded.id).toBe(sampleGame.id);
  });

  it('restituisce null in caso di token corrotto o malformato', () => {
    expect(decodeGameFromUrlToken('token_totalmente_invalido_!@#')).toBeNull();
    expect(decodeGameFromUrlToken('')).toBeNull();
    expect(decodeGameFromUrlToken(null)).toBeNull();
  });

  it('genera un URL di backup valido condivisibile su WhatsApp', () => {
    const url = generateStatelessGameShareUrl(sampleGame, 'https://burraco-score-fedec.web.app/');
    expect(url).toContain('https://burraco-score-fedec.web.app/#backup=');
  });
});
