import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  saveActiveGame,
  getActiveGame,
  addToOutboxQueue,
  getOutboxQueue,
  removeFromOutboxQueue,
  archiveCurrentGame,
  getGamesHistory,
} from '../src/utils/storage';
import {
  encodeGameToUrlToken,
  decodeGameFromUrlToken,
  generateStatelessGameShareUrl,
} from '../src/utils/statelessGame';
import {
  createGenesisBlock,
  appendBlock,
  verifyChainIntegrity,
  mergeChainsCRDT,
  reconstructGameStateFromChain,
  EVENT_TYPES,
} from '../src/utils/ledger';
import {
  computeGameTelemetry,
  getClientPlatformInfo,
} from '../src/utils/telemetry';

// Mock localStorage e sessionStorage per Node/Vitest
const createStorageMock = () => {
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
};

global.localStorage = createStorageMock();
global.sessionStorage = createStorageMock();

describe('Chaos Engineering & Resilience Tests (Simulazione Sollecitazioni Estreme)', () => {
  beforeEach(() => {
    global.localStorage.clear();
    global.sessionStorage.clear();
    vi.restoreAllMocks();
  });

  describe('Scenario 1: Blocco Dispositivo / Standby Improvviso e Ripresa Partita', () => {
    it('preserva integre tutte le mani e il ledger dopo simulazione standby e spegnimento temporaneo', () => {
      // 1. Inizio partita regolare
      const gameId = 'game_resilience_standby_' + Date.now();
      let game = {
        id: gameId,
        createdAt: new Date().toISOString(),
        mode: 'pairs',
        allowSemipulito: true,
        targetScore: 2005,
        team1: { name: 'Squadra Nord', players: ['Alice', 'Bob'] },
        team2: { name: 'Squadra Sud', players: ['Carlo', 'Diana'] },
        rounds: [
          { roundNumber: 1, team1Score: 450, team2Score: 120, entryMode: 'guided' }
        ],
        isFinished: false,
        winner: null,
      };

      // Inizializza ledger blockchain
      let chain = [createGenesisBlock(game, { uid: 'u1', name: 'Alice' })];
      chain = appendBlock(chain, EVENT_TYPES.ROUND_ADDED, game.rounds[0], { uid: 'u1', name: 'Alice' });
      game.ledgerChain = chain;
      game.ledgerLastHash = chain[chain.length - 1].hash;

      // Salva nel persistent storage
      saveActiveGame(game);

      // 2. SIMULAZIONE DISPOSITIVO IN STANDBY / SCREEN LOCK:
      // Si simula passaggio in background (sessionStorage/RAM state persa o interrotta)
      const simulatedColdStartGame = getActiveGame();
      expect(simulatedColdStartGame).not.toBeNull();
      expect(simulatedColdStartGame.id).toBe(gameId);
      expect(simulatedColdStartGame.rounds).toHaveLength(1);
      expect(simulatedColdStartGame.rounds[0].team1Score).toBe(450);

      // 3. Ripresa della partita e aggiunta seconda mano
      const round2 = { roundNumber: 2, team1Score: 680, team2Score: 890, entryMode: 'guided' };
      chain = appendBlock(chain, EVENT_TYPES.ROUND_ADDED, round2, { uid: 'u1', name: 'Alice' });
      const updatedGame = {
        ...simulatedColdStartGame,
        rounds: [...simulatedColdStartGame.rounds, round2],
        ledgerChain: chain,
        ledgerLastHash: chain[chain.length - 1].hash,
      };
      saveActiveGame(updatedGame);

      // 4. Verifica integrità totale dopo risveglio e calcolo progressivi
      const restored = getActiveGame();
      expect(restored.rounds).toHaveLength(2);
      const totalT1 = restored.rounds.reduce((acc, r) => acc + r.team1Score, 0);
      const totalT2 = restored.rounds.reduce((acc, r) => acc + r.team2Score, 0);
      expect(totalT1).toBe(1130);
      expect(totalT2).toBe(1010);
      expect(verifyChainIntegrity(restored.ledgerChain).valid).toBe(true);
    });
  });

  describe('Scenario 2: Interruzione Connessione & Coda Outbox Resiliente', () => {
    it('accoda le mani offline nella outbox queue e le drena automaticamente alla riconnessione', () => {
      const offlineGameId = 'game_offline_' + Date.now();
      const baseGame = {
        id: offlineGameId,
        mode: 'pairs',
        targetScore: 2005,
        team1: { name: 'I Rossi', players: ['P1'] },
        team2: { name: 'I Blu', players: ['P2'] },
        rounds: [],
      };

      // 1. Simula caduta connessione di rete
      let isOnline = false;

      // 2. Il giocatore gioca 3 mani completamente offline
      for (let i = 1; i <= 3; i++) {
        const round = { roundNumber: i, team1Score: 200 * i, team2Score: 150 * i };
        baseGame.rounds.push(round);
        baseGame.updatedAt = new Date().toISOString();

        // Se offline, l'applicazione inserisce nella Outbox Queue
        if (!isOnline) {
          addToOutboxQueue(baseGame);
        }
      }

      // Verifica che la Outbox Queue contenga l'ultimo snapshot valido della partita
      const queuedItems = getOutboxQueue();
      expect(queuedItems.length).toBeGreaterThanOrEqual(1);
      const queuedGame = queuedItems.find(g => g.id === offlineGameId);
      expect(queuedGame).toBeDefined();
      expect(queuedGame.rounds).toHaveLength(3);

      // 3. Simula riconnessione della rete (evento 'online')
      isOnline = true;
      const syncedItems = [];
      const fakeSyncToCloud = (item) => {
        syncedItems.push(item);
        return true;
      };

      // Svuotamento (drain) della outbox queue
      for (const item of getOutboxQueue()) {
        const success = fakeSyncToCloud(item);
        if (success) {
          removeFromOutboxQueue(item.id);
        }
      }

      // Verifica che la coda sia completamente svuotata e sincronizzata senza perdite
      expect(getOutboxQueue()).toHaveLength(0);
      expect(syncedItems).toHaveLength(1);
      expect(syncedItems[0].rounds).toHaveLength(3);
      expect(syncedItems[0].rounds[2].team1Score).toBe(600);
    });
  });

  describe('Scenario 3: Pulizia Totale Cache / Storage (Disaster Recovery via Paracadute)', () => {
    it('recupera al 100% la partita tramite URL Token Stateless dopo cancellazione distruttiva di localStorage', () => {
      const criticalGame = {
        id: 'game_disaster_' + Date.now(),
        createdAt: '2026-10-21T12:00:00.000Z',
        mode: 'pairs',
        allowSemipulito: true,
        targetScore: 2005,
        team1: { name: 'Campioni', players: ['Marco', 'Lucia'] },
        team2: { name: 'Sfidanti', players: ['Giorgio', 'Paola'] },
        rounds: [
          { roundNumber: 1, team1Score: 500, team2Score: 200, entryMode: 'guided' },
          { roundNumber: 2, team1Score: 350, team2Score: 400, entryMode: 'guided' },
          { roundNumber: 3, team1Score: 600, team2Score: 150, entryMode: 'quick' },
        ],
        isFinished: false,
        winner: null,
      };

      // Genera il link / token paracadute (es. inviato via WhatsApp o salvato su clipboard)
      const token = encodeGameToUrlToken(criticalGame);
      expect(token).toBeDefined();
      expect(token.length).toBeGreaterThan(20);

      // SIMULAZIONE DISASTRO: Cancellazione totale della cache/dati del browser
      global.localStorage.clear();
      global.sessionStorage.clear();

      // Verifica che il local storage sia vuoto
      expect(getActiveGame()).toBeNull();

      // RECUPERO DI EMERGENZA (Stateless Disaster Recovery via Token)
      const recoveredGame = decodeGameFromUrlToken(token);
      expect(recoveredGame).not.toBeNull();
      expect(recoveredGame.id).toBe(criticalGame.id);
      expect(recoveredGame.rounds).toHaveLength(3);
      expect(recoveredGame.team1.name).toBe('Campioni');
      expect(recoveredGame.team2.name).toBe('Sfidanti');

      // Calcolo punti post-recupero
      const t1 = recoveredGame.rounds.reduce((acc, r) => acc + r.team1Score, 0);
      const t2 = recoveredGame.rounds.reduce((acc, r) => acc + r.team2Score, 0);
      expect(t1).toBe(1450);
      expect(t2).toBe(750);

      // Salva nuovamente nel client
      saveActiveGame(recoveredGame);
      expect(getActiveGame()).not.toBeNull();
    });

    it('genera un URL di backup condivisibile valido con prefisso hash #backup=', () => {
      const sampleGame = {
        id: 'game_share_123',
        mode: 'trio',
        targetScore: 1505,
        team1: { name: 'T1', players: ['P1'] },
        team2: { name: 'T2', players: ['P2'] },
        team3: { name: 'T3', players: ['P3'] },
        rounds: [{ roundNumber: 1, team1Score: 300, team2Score: 200, team3Score: 100 }],
      };

      const shareUrl = generateStatelessGameShareUrl(sampleGame, 'https://burraco-score-fedec.web.app/');
      expect(shareUrl).toContain('https://burraco-score-fedec.web.app/#backup=');

      const extractedToken = shareUrl.split('#backup=')[1];
      const decoded = decodeGameFromUrlToken(extractedToken);
      expect(decoded).not.toBeNull();
      expect(decoded.id).toBe(sampleGame.id);
      expect(decoded.mode).toBe('trio');
    });
  });

  describe('Scenario 4: Conflitto Concorrente Multi-Dispositivo & CRDT Merge Determinismo', () => {
    it('risolve deterministicamente due rami divergenti registrati offline su dispositivi diversi', () => {
      const baseGame = {
        id: 'game_crdt_branch_' + Date.now(),
        createdAt: '2026-10-21T10:00:00.000Z',
        mode: 'pairs',
        allowSemipulito: true,
        targetScore: 2005,
        team1: { name: 'Tavolo A', players: ['A1'] },
        team2: { name: 'Tavolo B', players: ['B1'] },
        rounds: [
          { roundNumber: 1, team1Score: 300, team2Score: 250 }
        ],
      };

      // Catena base condivisa
      let baseChain = [createGenesisBlock(baseGame, { uid: 'host', name: 'Host' })];
      baseChain = appendBlock(baseChain, EVENT_TYPES.ROUND_ADDED, baseGame.rounds[0], { uid: 'host', name: 'Host' });

      // Dispositivo 1 aggiunge mano 2
      const round2Dev1 = { roundNumber: 2, team1Score: 400, team2Score: 100, device: 'dev1' };
      const chainDev1 = appendBlock(baseChain, EVENT_TYPES.ROUND_ADDED, round2Dev1, { uid: 'dev1', name: 'User 1' });

      // Dispositivo 2 aggiunge mano 3 (in concorrenza, senza conoscere dev1)
      const round3Dev2 = { roundNumber: 3, team1Score: 150, team2Score: 600, device: 'dev2' };
      const chainDev2 = appendBlock(baseChain, EVENT_TYPES.ROUND_ADDED, round3Dev2, { uid: 'dev2', name: 'User 2' });

      // Entrambi i rami sono validi localmente
      expect(verifyChainIntegrity(chainDev1).valid).toBe(true);
      expect(verifyChainIntegrity(chainDev2).valid).toBe(true);

      // FUSIONE CRDT DEI DUE RAMI DIVERGENTI
      const mergedChain = mergeChainsCRDT(chainDev1, chainDev2);

      // Verifica integrità della blockchain fusa
      expect(verifyChainIntegrity(mergedChain).valid).toBe(true);

      // Ricostruzione stato unificato
      const unifiedGame = reconstructGameStateFromChain(mergedChain);
      expect(unifiedGame.rounds.length).toBe(3); // Mano 1 + Mano 2 + Mano 3
      expect(unifiedGame.rounds.some(r => r.roundNumber === 1)).toBe(true);
      expect(unifiedGame.rounds.some(r => r.roundNumber === 2)).toBe(true);
      expect(unifiedGame.rounds.some(r => r.roundNumber === 3)).toBe(true);
    });
  });

  describe('Scenario 5: Telemetria Silenziosa e Metriche Diagnostiche', () => {
    it('raccoglie metriche conformi al limite di 30 campi di firestore.rules', () => {
      const sampleGame = {
        id: 'game_telemetry_test',
        createdAt: new Date(Date.now() - 35 * 60000).toISOString(), // Partita iniziata 35 minuti fa
        completedAt: new Date().toISOString(),
        mode: 'pairs',
        targetScore: 2005,
        isFinished: true,
        rounds: [
          { roundNumber: 1, entryMode: 'guided', team1Score: 400, team2Score: 200 },
          { roundNumber: 2, entryMode: 'guided', team1Score: 600, team2Score: 150 },
          { roundNumber: 3, entryMode: 'quick', team1Score: 300, team2Score: 500 },
        ],
        ledgerChain: [
          { type: 'GAME_CREATED' },
          { type: 'ROUND_ADDED' },
          { type: 'ROUND_REVERTED' },
          { type: 'ROUND_ADDED' },
          { type: 'ROUND_ADDED' },
        ]
      };

      const telemetry = computeGameTelemetry(sampleGame, { offlineEventsCount: 2 });
      expect(telemetry).not.toBeNull();
      expect(telemetry.durationMinutes).toBeGreaterThanOrEqual(34);
      expect(telemetry.handsCount).toBe(3);
      expect(telemetry.guidedHandsCount).toBe(2);
      expect(telemetry.quickHandsCount).toBe(1);
      expect(telemetry.revertsCount).toBe(1);
      expect(telemetry.offlineEventsCount).toBe(2);
      expect(telemetry.isFinished).toBe(true);
      expect(telemetry.mode).toBe('pairs');

      // Verifica che il numero di chiavi sia <= 30 per passare la regola Firestore
      const keysCount = Object.keys(telemetry).length;
      expect(keysCount).toBeLessThanOrEqual(30);
    });

    it('rileva in modo sicuro le informazioni di piattaforma browser/OS senza errori', () => {
      const info = getClientPlatformInfo();
      expect(info).toHaveProperty('isMobile');
      expect(info).toHaveProperty('os');
      expect(info).toHaveProperty('browser');
    });
  });
});
