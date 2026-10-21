/**
 * Burraco Distributed Ledger & CRDT Event-Sourcing Engine
 * 
 * Fornisce un registro a catena di blocchi (Append-Only Event Log)
 * per garantire immutabilità, integrità crittografica e fusione deterministica (CRDT)
 * delle partite tra dispositivi multipli e in modalità offline-first.
 */

/**
 * Funzione hash deterministica a 32-bit (FNV-1a estesa in formato esadecimale)
 * Eseguibile in modo sincrono e ad alte prestazioni sia in ambiente browser che in test Node/Vitest.
 */
export function computeBlockHash(dataString) {
  let h1 = 0x811c9dc5;
  let h2 = 0x9e3779b9;
  for (let i = 0; i < dataString.length; i++) {
    const ch = dataString.charCodeAt(i);
    h1 ^= ch;
    h1 = Math.imul(h1, 0x01000193);
    h2 ^= ch;
    h2 = Math.imul(h2, 0x5bd1e995);
  }
  const part1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const part2 = (h2 >>> 0).toString(16).padStart(8, '0');
  return `${part1}${part2}`;
}

export const EVENT_TYPES = {
  GAME_CREATED: 'GAME_CREATED',
  ROUND_ADDED: 'ROUND_ADDED',
  ROUND_REVERTED: 'ROUND_REVERTED',
  TEAMS_UPDATED: 'TEAMS_UPDATED',
  TARGET_UPDATED: 'TARGET_UPDATED',
  GAME_FINISHED: 'GAME_FINISHED',
  TABLE_CLOSED: 'TABLE_CLOSED',
};

/**
 * Normalizza l'identificativo dell'autore per l'hash
 */
function getAuthorKey(author) {
  if (!author) return 'system';
  if (typeof author === 'string') return author;
  return author.uid || author.name || author.deviceId || 'system';
}

/**
 * Genera l'impronta (hash) di un singolo blocco
 */
export function calculateBlockContentHash(index, prevHash, type, payload, timestamp, author) {
  const content = JSON.stringify({
    index,
    prevHash,
    type,
    payload,
    timestamp,
    authorKey: getAuthorKey(author),
  });
  return computeBlockHash(content);
}

/**
 * Crea il blocco zero (Genesis) all'avvio della partita
 */
export function createGenesisBlock(initialData, author = null) {
  const timestamp = initialData?.createdAt || new Date().toISOString();
  const authorObj = {
    uid: author?.uid || null,
    name: author?.displayName || author?.name || 'Organizzatore',
    deviceId: author?.deviceId || 'local',
  };

  const type = EVENT_TYPES.GAME_CREATED;
  const payload = {
    id: initialData?.id || `game_${Date.now()}`,
    mode: initialData?.mode || 'pairs',
    allowSemipulito: Boolean(initialData?.allowSemipulito ?? true),
    targetScore: Number(initialData?.targetScore) || 2005,
    team1: initialData?.team1 || { name: 'Coppia 1', players: [] },
    team2: initialData?.team2 || { name: 'Coppia 2', players: [] },
    team3: initialData?.team3 || (initialData?.mode === 'trio' ? { name: 'Giocatore 3', players: [] } : null),
  };

  const prevHash = 'GENESIS_00000000';
  const hash = calculateBlockContentHash(0, prevHash, type, payload, timestamp, authorObj);

  return {
    index: 0,
    id: `blk_0_${hash.slice(0, 8)}`,
    type,
    payload,
    timestamp,
    author: authorObj,
    prevHash,
    hash,
  };
}

/**
 * Aggiunge un nuovo blocco alla catena
 */
export function appendBlock(chain, type, payload, author = null) {
  if (!Array.isArray(chain) || chain.length === 0) {
    throw new Error('Impossibile aggiungere a una catena vuota: inizializzare prima il blocco Genesis.');
  }

  const lastBlock = chain[chain.length - 1];
  const nextIndex = lastBlock.index + 1;
  const timestamp = new Date().toISOString();
  const authorObj = {
    uid: author?.uid || null,
    name: author?.displayName || author?.name || 'Giocatore',
    deviceId: author?.deviceId || 'local',
  };

  const hash = calculateBlockContentHash(nextIndex, lastBlock.hash, type, payload, timestamp, authorObj);

  const newBlock = {
    index: nextIndex,
    id: `blk_${nextIndex}_${hash.slice(0, 8)}`,
    type,
    payload,
    timestamp,
    author: authorObj,
    prevHash: lastBlock.hash,
    hash,
  };

  return [...chain, newBlock];
}

/**
 * Verifica l'integrità crittografica di una catena di blocchi
 * Restituisce { valid: boolean, error?: string, brokenIndex?: number }
 */
export function verifyChainIntegrity(chain) {
  if (!Array.isArray(chain) || chain.length === 0) {
    return { valid: false, error: 'Catena non presente o vuota' };
  }

  // Verifica blocco Genesis
  const genesis = chain[0];
  if (genesis.index !== 0 || genesis.prevHash !== 'GENESIS_00000000') {
    return { valid: false, error: 'Blocco Genesis non valido', brokenIndex: 0 };
  }

  const expectedGenesisHash = calculateBlockContentHash(
    0,
    genesis.prevHash,
    genesis.type,
    genesis.payload,
    genesis.timestamp,
    genesis.author
  );
  if (genesis.hash !== expectedGenesisHash) {
    return { valid: false, error: 'Hash del blocco Genesis non corrispondente', brokenIndex: 0 };
  }

  // Verifica blocchi successivi
  for (let i = 1; i < chain.length; i++) {
    const current = chain[i];
    const previous = chain[i - 1];

    if (current.index !== i) {
      return { valid: false, error: `Indice non sequenziale al blocco ${i}`, brokenIndex: i };
    }
    if (current.prevHash !== previous.hash) {
      return { valid: false, error: `Catena spezzata: prevHash non corrispondente al blocco ${i}`, brokenIndex: i };
    }

    const calculatedHash = calculateBlockContentHash(
      current.index,
      current.prevHash,
      current.type,
      current.payload,
      current.timestamp,
      current.author
    );
    if (current.hash !== calculatedHash) {
      return { valid: false, error: `Hash alterato al blocco ${i}`, brokenIndex: i };
    }
  }

  return { valid: true };
}

/**
 * Ricostruisce lo stato completo della partita (`game`) ripercorrendo la catena dei blocchi
 */
export function reconstructGameStateFromChain(chain, baseMetadata = {}) {
  if (!Array.isArray(chain) || chain.length === 0) {
    return null;
  }

  const genesis = chain[0];
  const payload = genesis.payload || {};

  const state = {
    id: payload.id || baseMetadata.id || `game_${Date.now()}`,
    createdAt: genesis.timestamp,
    mode: payload.mode || 'pairs',
    allowSemipulito: Boolean(payload.allowSemipulito ?? true),
    targetScore: Number(payload.targetScore) || 2005,
    team1: { ...(payload.team1 || { name: 'Coppia 1', players: [] }) },
    team2: { ...(payload.team2 || { name: 'Coppia 2', players: [] }) },
    team3: payload.team3 ? { ...payload.team3 } : null,
    rounds: [],
    winner: null,
    isFinished: false,
    tableClosed: false,
    ledgerChainLength: chain.length,
    ledgerLastHash: chain[chain.length - 1].hash,
    ...baseMetadata,
  };

  // Esegui la catena degli eventi sequenzialmente
  for (let i = 1; i < chain.length; i++) {
    const block = chain[i];
    const data = block.payload;

    switch (block.type) {
      case EVENT_TYPES.ROUND_ADDED:
        if (data && typeof data === 'object') {
          const roundObj = {
            ...data,
            team1Score: Number(data.team1Score ?? data.team1Points ?? 0),
            team2Score: Number(data.team2Score ?? data.team2Points ?? 0),
            team3Score: Number(data.team3Score ?? data.team3Points ?? 0),
            ledgerBlockId: block.id,
            recordedAt: block.timestamp,
            recordedBy: block.author?.name || 'Giocatore',
          };
          const existingIdx = data.roundNumber
            ? state.rounds.findIndex(r => r.roundNumber === data.roundNumber)
            : -1;
          if (existingIdx >= 0) {
            state.rounds[existingIdx] = roundObj;
          } else {
            state.rounds.push(roundObj);
          }
          checkGameCompletion(state);
        }
        break;

      case EVENT_TYPES.ROUND_REVERTED:
        if (state.rounds.length > 0) {
          if (data?.roundNumber) {
            state.rounds = state.rounds.filter(r => r.roundNumber !== data.roundNumber);
          } else {
            state.rounds.pop();
          }
          checkGameCompletion(state);
        }
        break;

      case EVENT_TYPES.TEAMS_UPDATED:
        if (data?.team1) state.team1 = { ...data.team1 };
        if (data?.team2) state.team2 = { ...data.team2 };
        if (data?.team3) state.team3 = { ...data.team3 };
        break;

      case EVENT_TYPES.TARGET_UPDATED:
        if (data?.targetScore) {
          state.targetScore = Number(data.targetScore);
          checkGameCompletion(state);
        }
        break;

      case EVENT_TYPES.GAME_FINISHED:
        state.isFinished = true;
        if (data?.winner) state.winner = data.winner;
        break;

      case EVENT_TYPES.TABLE_CLOSED:
        state.tableClosed = true;
        break;

      default:
        break;
    }
  }

  return state;
}

/**
 * Verifica se una squadra ha raggiunto o superato il target di vittoria
 */
function checkGameCompletion(state) {
  let s1 = 0;
  let s2 = 0;
  let s3 = 0;

  for (const r of state.rounds) {
    s1 += Number(r.team1Score ?? r.team1Points ?? 0);
    s2 += Number(r.team2Score ?? r.team2Points ?? 0);
    if (state.mode === 'trio') {
      s3 += Number(r.team3Score ?? r.team3Points ?? 0);
    }
  }

  const target = Number(state.targetScore) || 2005;
  const isFinished = s1 >= target || s2 >= target || (state.mode === 'trio' && s3 >= target);

  state.isFinished = isFinished;
  if (isFinished) {
    if (state.mode === 'trio') {
      if (s1 > s2 && s1 > s3) state.winner = 'team1';
      else if (s2 > s1 && s2 > s3) state.winner = 'team2';
      else if (s3 > s1 && s3 > s2) state.winner = 'team3';
    } else {
      if (s1 > s2) state.winner = 'team1';
      else if (s2 > s1) state.winner = 'team2';
    }
  } else {
    state.winner = null;
  }
}

/**
 * Fonde due catene CRDT in modo deterministico
 */
export function mergeChainsCRDT(chainA, chainB) {
  if (!Array.isArray(chainA) || chainA.length === 0) return Array.isArray(chainB) ? chainB : [];
  if (!Array.isArray(chainB) || chainB.length === 0) return chainA;

  if (chainA.length >= chainB.length) {
    const isPrefix = chainB.every((b, idx) => b.hash === chainA[idx]?.hash);
    if (isPrefix) return chainA;
  } else {
    const isPrefix = chainA.every((b, idx) => b.hash === chainB[idx]?.hash);
    if (isPrefix) return chainB;
  }

  const map = new Map();
  [...chainA, ...chainB].forEach(block => {
    if (block && block.id) {
      if (!map.has(block.id)) {
        map.set(block.id, block);
      }
    }
  });

  const uniqueBlocks = Array.from(map.values());
  const genesis = uniqueBlocks.find(b => b.index === 0) || chainA[0] || chainB[0];
  const others = uniqueBlocks.filter(b => b.index !== 0);

  others.sort((a, b) => {
    const timeA = new Date(a.timestamp || 0).getTime();
    const timeB = new Date(b.timestamp || 0).getTime();
    if (timeA !== timeB) return timeA - timeB;
    return (a.hash || '').localeCompare(b.hash || '');
  });

  let currentPrevHash = genesis.hash;
  const coherentChain = [genesis];

  for (let i = 0; i < others.length; i++) {
    const b = others[i];
    const newIdx = i + 1;
    const newHash = calculateBlockContentHash(
      newIdx,
      currentPrevHash,
      b.type,
      b.payload,
      b.timestamp,
      b.author
    );

    const reindexedBlock = {
      ...b,
      index: newIdx,
      prevHash: currentPrevHash,
      hash: newHash,
    };

    coherentChain.push(reindexedBlock);
    currentPrevHash = newHash;
  }

  return coherentChain;
}

/**
 * Retrocompatibilità: converte una partita legacy in un ledger
 */
export function migrateLegacyGameToLedger(legacyGame, author = null) {
  if (!legacyGame) return null;

  if (Array.isArray(legacyGame.ledgerChain) && legacyGame.ledgerChain.length > 0) {
    const check = verifyChainIntegrity(legacyGame.ledgerChain);
    if (check.valid) return legacyGame.ledgerChain;
  }

  let chain = [createGenesisBlock(legacyGame, author)];

  if (Array.isArray(legacyGame.rounds)) {
    for (const round of legacyGame.rounds) {
      chain = appendBlock(chain, EVENT_TYPES.ROUND_ADDED, round, author);
    }
  }

  if (legacyGame.isFinished) {
    chain = appendBlock(chain, EVENT_TYPES.GAME_FINISHED, { winner: legacyGame.winner }, author);
  }

  if (legacyGame.tableClosed) {
    chain = appendBlock(chain, EVENT_TYPES.TABLE_CLOSED, {}, author);
  }

  return chain;
}
