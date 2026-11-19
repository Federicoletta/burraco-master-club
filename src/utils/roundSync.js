import { computeTeamTotalsAndWinner } from './gameHelpers';

const MAX_TOMBSTONES = 100;

/**
 * Genera un identificativo univoco immutabile per una nuova smazzata.
 */
export function generateRoundId() {
  const rand = Math.random().toString(36).slice(2, 6);
  return `rnd_${Date.now()}_${rand}`;
}

/**
 * Converte in modo sicuro ISO string, Firestore Timestamp, Date o numero in millisecondi.
 */
export function toTimestampMs(val) {
  if (!val) return 0;
  if (typeof val === 'number') return Number.isFinite(val) ? val : 0;
  if (typeof val?.toMillis === 'function') {
    const ms = val.toMillis();
    return Number.isFinite(ms) ? ms : 0;
  }
  if (typeof val?.seconds === 'number') {
    return val.seconds * 1000 + Math.floor((val.nanoseconds || 0) / 1e6);
  }
  const ms = new Date(val).getTime();
  return Number.isNaN(ms) ? 0 : ms;
}

/**
 * Converte in ISO string sicura se possibile, altrimenti restituisce null.
 */
export function toIsoOrNull(val) {
  if (!val) return null;
  if (typeof val === 'string') {
    const ms = new Date(val).getTime();
    return Number.isNaN(ms) ? null : val;
  }
  const ms = toTimestampMs(val);
  return ms > 0 ? new Date(ms).toISOString() : null;
}

/**
 * Garantisce che una smazzata abbia roundId, createdAt e updatedAt.
 * Per le smazzate legacy prive di roundId genera un ID deterministico
 * così che dispositivi diversi convergano sullo stesso identificativo.
 */
export function ensureRoundIdentity(round, idx = 0, fallbackTime = null) {
  if (!round || typeof round !== 'object') return round;
  const fallbackIso = toIsoOrNull(fallbackTime) || '1970-01-01T00:00:00.000Z';
  const rawCreated = toIsoOrNull(round.createdAt) || toIsoOrNull(round.timestamp) || fallbackIso;
  const rawUpdated = toIsoOrNull(round.updatedAt) || toIsoOrNull(round.timestamp) || rawCreated;

  let roundId = typeof round.roundId === 'string' && round.roundId.trim() ? round.roundId.trim() : '';
  if (!roundId) {
    const rn = round.roundNumber || idx + 1;
    const stampSource = String(round.timestamp || round.createdAt || fallbackTime || '0')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 32);
    roundId = `legacy_r${rn}_${stampSource}`.slice(0, 64);
  }

  return {
    ...round,
    roundId,
    roundNumber: Number(round.roundNumber) || idx + 1,
    createdAt: rawCreated,
    updatedAt: rawUpdated,
  };
}

/**
 * Normalizza qualsiasi documento partita (inclusi documenti legacy privi di roundId,
 * deletedRoundIds, suspendedAt, stateUpdatedAt o ancora dotati di ledgerChain).
 */
export function normalizeLegacyGame(game) {
  if (!game || typeof game !== 'object') return game;

  const createdAt = toIsoOrNull(game.createdAt) || game.createdAt || null;
  const rawRounds = Array.isArray(game.rounds) ? game.rounds : [];
  const rounds = rawRounds
    .filter(r => r && typeof r === 'object')
    .map((r, idx) => ensureRoundIdentity(r, idx, createdAt));

  const deletedRoundIds = Array.isArray(game.deletedRoundIds)
    ? Array.from(
        new Set(
          game.deletedRoundIds
            .filter(id => typeof id === 'string' && id.trim().length > 0)
            .map(id => id.trim().slice(0, 64))
        )
      ).slice(-MAX_TOMBSTONES)
    : [];

  const suspendedAt = game.suspendedAt ? (toIsoOrNull(game.suspendedAt) || game.suspendedAt) : null;
  const stateUpdatedAt =
    toIsoOrNull(game.stateUpdatedAt) ||
    toIsoOrNull(game.updatedAt) ||
    (rounds.length > 0 ? rounds[rounds.length - 1].updatedAt : null) ||
    createdAt ||
    new Date().toISOString();

  // Rimuove eventuali campi ledger legacy obsoleti senza errori
  const clean = { ...game };
  delete clean.ledgerChain;
  delete clean.ledgerLastHash;
  delete clean.ledgerChainLength;

  return {
    ...clean,
    rounds,
    deletedRoundIds,
    suspendedAt,
    stateUpdatedAt,
    tableClosed: Boolean(game.tableClosed),
    isFinished: Boolean(game.isFinished),
  };
}

function mergeUniqueStrings(listA = [], listB = [], limit = 10) {
  const out = [];
  const seen = new Set();
  for (const raw of [...(Array.isArray(listA) ? listA : []), ...(Array.isArray(listB) ? listB : [])]) {
    if (typeof raw !== 'string') continue;
    const val = raw.trim();
    if (!val || seen.has(val)) continue;
    seen.add(val);
    out.push(val);
    if (out.length >= limit) break;
  }
  return out;
}

function pickWinningRound(roundA, roundB) {
  const msA = toTimestampMs(roundA.updatedAt || roundA.timestamp || roundA.createdAt);
  const msB = toTimestampMs(roundB.updatedAt || roundB.timestamp || roundB.createdAt);
  if (msA > msB) return roundA;
  if (msB > msA) return roundB;

  // Tie-break deterministico e commutativo
  const strA = JSON.stringify(roundA);
  const strB = JSON.stringify(roundB);
  return strA >= strB ? roundA : roundB;
}

/**
 * Riconcilia deterministicamente due versioni (locale e remota) della stessa partita
 * usando identità per-mano (`roundId`), Last-Write-Wins su `updatedAt` e tombstone `deletedRoundIds`.
 * Completamente retrocompatibile con documenti legacy.
 */
export function reconcileGames(localGame, remoteGame) {
  if (!localGame) return remoteGame ? normalizeLegacyGame(remoteGame) : null;
  if (!remoteGame) return normalizeLegacyGame(localGame);

  const local = normalizeLegacyGame(localGame);
  const remote = normalizeLegacyGame(remoteGame);

  // 1. Unione tombstone (eliminazioni vincono sempre)
  const deletedSet = new Set([...local.deletedRoundIds, ...remote.deletedRoundIds]);
  const deletedRoundIds = Array.from(deletedSet).slice(-MAX_TOMBSTONES);

  // 2. Unione smazzate per roundId con LWW
  const roundsMap = new Map();
  for (const r of remote.rounds) {
    if (!r?.roundId || deletedSet.has(r.roundId)) continue;
    roundsMap.set(r.roundId, r);
  }
  for (const r of local.rounds) {
    if (!r?.roundId || deletedSet.has(r.roundId)) continue;
    if (roundsMap.has(r.roundId)) {
      roundsMap.set(r.roundId, pickWinningRound(roundsMap.get(r.roundId), r));
    } else {
      roundsMap.set(r.roundId, r);
    }
  }

  // 3. Ordinamento cronologico deterministico e rinumerazione 1..N
  const mergedRounds = Array.from(roundsMap.values())
    .sort((a, b) => {
      const ca = toTimestampMs(a.createdAt || a.timestamp);
      const cb = toTimestampMs(b.createdAt || b.timestamp);
      if (ca !== cb) return ca - cb;
      const na = Number(a.roundNumber) || 0;
      const nb = Number(b.roundNumber) || 0;
      if (na !== nb) return na - nb;
      return String(a.roundId).localeCompare(String(b.roundId));
    })
    .map((r, idx) => ({
      ...r,
      roundNumber: idx + 1,
    }));

  // 4. Risoluzione metadati tramite stateUpdatedAt LWW
  const localStateMs = toTimestampMs(local.stateUpdatedAt || local.updatedAt || local.createdAt);
  const remoteStateMs = toTimestampMs(remote.stateUpdatedAt || remote.updatedAt || remote.createdAt);
  const primary = localStateMs > remoteStateMs ? local : remote;
  const secondary = primary === local ? remote : local;

  const mode = primary.mode || secondary.mode || 'pairs';
  const targetScore = Number(primary.targetScore || secondary.targetScore) || 2005;

  // 5. Ricalcolo autoritativo punteggi, spareggio e vincitore
  const computed = computeTeamTotalsAndWinner(mergedRounds, mode, targetScore);

  let isFinished = computed.isFinished;
  let winner = computed.winner;
  let completedAt = computed.isFinished
    ? (primary.completedAt || secondary.completedAt || new Date().toISOString())
    : null;

  // Preserva conclusione manuale anticipata (handleEndGame) solo se il lato più recente l'ha chiusa
  // esplicitamente e non siamo in situazione di parità al target che richiede spareggio
  if (!computed.isFinished && !computed.isTieAtTarget && primary.isFinished && !primary.suspendedAt) {
    const manualTotals = computeTeamTotalsAndWinner(mergedRounds, mode, targetScore, true);
    isFinished = true;
    winner = manualTotals.winner || primary.winner || null;
    completedAt = primary.completedAt || new Date().toISOString();
  }

  const maxStateMs = Math.max(
    localStateMs,
    remoteStateMs,
    ...mergedRounds.map(r => toTimestampMs(r.updatedAt))
  );

  const mergedPlayerUids = mergeUniqueStrings(remote.playerUids, local.playerUids, 10);
  const mergedPlayerEmails = mergeUniqueStrings(remote.playerEmails, local.playerEmails, 10);

  return {
    ...secondary,
    ...primary,
    id: primary.id || secondary.id,
    mode,
    targetScore,
    rounds: mergedRounds,
    deletedRoundIds,
    isFinished,
    winner,
    completedAt,
    tableClosed: Boolean(primary.tableClosed),
    suspendedAt: isFinished ? null : (primary.suspendedAt || null),
    playerUids: mergedPlayerUids,
    playerEmails: mergedPlayerEmails,
    ownerUid: primary.ownerUid ?? secondary.ownerUid ?? null,
    ownerEmail: primary.ownerEmail ?? secondary.ownerEmail ?? null,
    ownerName: primary.ownerName ?? secondary.ownerName ?? null,
    stateUpdatedAt: maxStateMs > 0 ? new Date(maxStateMs).toISOString() : new Date().toISOString(),
  };
}
