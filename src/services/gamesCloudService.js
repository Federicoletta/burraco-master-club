import {
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  collection,
  getDocs,
  deleteDoc,
  runTransaction,
  serverTimestamp,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import {
  db,
  auth,
  OperationType,
  isPermissionOrQuotaError,
  handleFirestoreError,
  computeGameShortPin,
  sanitizeForFirestore,
  getDocsWithOrderFallback,
  subscribeWithOrderFallback,
} from './firebaseClient';
import { normalizeLegacyGame, reconcileGames } from '../utils/roundSync';

// Cache in memoria per evitare riscritture ripetitive di burraco_pins (preserva createdAt e risparmia scritture)
const registeredPinsCache = new Set();

/**
 * Registra o aggiorna l'indice rapido del PIN per trovare il tavolo in O(1) senza sovrascrivere createdAt
 */
export async function registerGamePin(pin, gameId, createdAt = null) {
  if (!db || !pin || !gameId) return false;
  const cleanPin = String(pin).trim();
  const cleanGameId = String(gameId).trim();
  if (!cleanPin || !cleanGameId) return false;

  const cacheKey = `${cleanPin}:${cleanGameId}`;
  if (registeredPinsCache.has(cacheKey)) {
    return true;
  }

  const pinPath = `burraco_pins/${cleanPin}`;
  try {
    const pinRef = doc(db, 'burraco_pins', cleanPin);
    const existingSnap = await getDoc(pinRef);
    if (existingSnap.exists()) {
      const existingData = existingSnap.data();
      if (existingData?.gameId === cleanGameId) {
        registeredPinsCache.add(cacheKey);
        return true;
      }
    }

    await setDoc(pinRef, {
      pin: cleanPin,
      gameId: cleanGameId,
      updatedAt: serverTimestamp(),
      createdAt: createdAt || new Date().toISOString()
    }, { merge: true });
    registeredPinsCache.add(cacheKey);
    return true;
  } catch (err) {
    if (isPermissionOrQuotaError(err)) {
      handleFirestoreError(err, OperationType.WRITE, pinPath);
    }
    console.warn('[registerGamePin] Avviso:', err.message);
    return false;
  }
}

/**
 * Salva o aggiorna una partita nel cloud database Firestore con tracciamento proprietario
 * Con protezione salvaguardia multi-dispositivo contro sovrascritture di mani perse
 */
export async function syncGameToCloud(game, currentUser = null, force = false) {
  if (!db || !game?.id) {
    console.warn('[syncGameToCloud] Impossibile sincronizzare: db o game.id mancante:', { hasDb: Boolean(db), id: game?.id });
    return false;
  }
  const gamePath = `burraco_games/${game.id}`;
  try {
    const gameRef = doc(db, 'burraco_games', game.id);

    const normalizedLocal = normalizeLegacyGame(game);
    let gameToWrite = normalizedLocal;

    if (!force) {
      try {
        const snap = await getDoc(gameRef);
        if (snap.exists()) {
          gameToWrite = reconcileGames(normalizedLocal, snap.data());
        }
      } catch (err) {
        console.warn('Controllo/riconciliazione versione remota non riuscita:', err);
      }
    }

    const cleanTeam = (team, fallbackName) => {
      if (!team || typeof team !== 'object') return { name: fallbackName, players: [] };
      const cleaned = {
        name: String(team.name || fallbackName).trim().slice(0, 100) || fallbackName,
        players: Array.isArray(team.players)
          ? team.players.map(p => String(p || '').trim().slice(0, 100)).filter(Boolean)
          : []
      };
      if (team.id) cleaned.id = String(team.id).slice(0, 100);
      return cleaned;
    };

    const playerUids = Array.isArray(gameToWrite.playerUids) ? [...gameToWrite.playerUids] : [];
    if (currentUser?.uid && !playerUids.includes(currentUser.uid)) {
      playerUids.push(currentUser.uid);
    }
    const playerEmails = Array.isArray(gameToWrite.playerEmails) ? [...gameToWrite.playerEmails] : [];
    if (currentUser?.email && !playerEmails.includes(currentUser.email)) {
      playerEmails.push(currentUser.email);
    }

    const cleanRounds = (Array.isArray(gameToWrite.rounds) ? gameToWrite.rounds : []).map(r => ({ ...r }));
    const cleanDeletedRoundIds = (Array.isArray(gameToWrite.deletedRoundIds) ? gameToWrite.deletedRoundIds : [])
      .filter(id => typeof id === 'string' && id.trim().length > 0)
      .map(id => id.trim().slice(0, 64))
      .slice(-100);

    const allowedGameData = {
      id: String(gameToWrite.id),
      mode: ['pairs', 'singles', 'trio'].includes(gameToWrite.mode) ? gameToWrite.mode : 'pairs',
      allowSemipulito: Boolean(gameToWrite.allowSemipulito ?? true),
      targetScore: Number(gameToWrite.targetScore) || 2005,
      team1: cleanTeam(gameToWrite.team1, 'Coppia 1'),
      team2: cleanTeam(gameToWrite.team2, 'Coppia 2'),
      rounds: cleanRounds,
      deletedRoundIds: cleanDeletedRoundIds,
      isFinished: Boolean(gameToWrite.isFinished),
      tableClosed: Boolean(gameToWrite.tableClosed),
      suspendedAt: gameToWrite.suspendedAt || null,
      stateUpdatedAt: gameToWrite.stateUpdatedAt || new Date().toISOString(),
      ownerUid: gameToWrite.ownerUid !== undefined ? (gameToWrite.ownerUid || null) : (currentUser?.uid || null),
      ownerEmail: gameToWrite.ownerEmail !== undefined ? (gameToWrite.ownerEmail || null) : (currentUser?.email || null),
      ownerName: gameToWrite.ownerName !== undefined ? (gameToWrite.ownerName || null) : (currentUser?.displayName || null),
      playerUids: playerUids.slice(0, 10),
      playerEmails: playerEmails.slice(0, 10),
      updatedAt: serverTimestamp(),
    };

    if (gameToWrite.mode === 'trio' || gameToWrite.team3) {
      allowedGameData.team3 = cleanTeam(gameToWrite.team3, 'Giocatore 3');
    }

    if (gameToWrite.winner) {
      allowedGameData.winner = gameToWrite.winner;
    } else {
      allowedGameData.winner = null;
    }
    if (gameToWrite.createdAt) allowedGameData.createdAt = gameToWrite.createdAt;
    if (gameToWrite.completedAt) {
      allowedGameData.completedAt = gameToWrite.completedAt;
    } else {
      allowedGameData.completedAt = null;
    }

    if (gameToWrite.tournamentId) allowedGameData.tournamentId = String(gameToWrite.tournamentId).slice(0, 100);
    if (gameToWrite.tournamentName) allowedGameData.tournamentName = String(gameToWrite.tournamentName).slice(0, 100);
    if (gameToWrite.tournamentMatchId) allowedGameData.tournamentMatchId = String(gameToWrite.tournamentMatchId).slice(0, 100);
    if (typeof gameToWrite.tournamentRoundNumber === 'number') allowedGameData.tournamentRoundNumber = gameToWrite.tournamentRoundNumber;
    if (typeof gameToWrite.tournamentTableNumber === 'number') allowedGameData.tournamentTableNumber = gameToWrite.tournamentTableNumber;

    if (gameToWrite.telemetry && typeof gameToWrite.telemetry === 'object') {
      allowedGameData.telemetry = gameToWrite.telemetry;
    }

    const payload = sanitizeForFirestore(allowedGameData);
    await setDoc(gameRef, payload, { merge: true });

    const shortPin = computeGameShortPin(game.id);
    if (shortPin && shortPin.length >= 4) {
      registerGamePin(shortPin, game.id, game.createdAt || null).catch(() => {});
    }

    return true;
  } catch (err) {
    if (isPermissionOrQuotaError(err)) {
      handleFirestoreError(err, OperationType.WRITE, gamePath);
    }
    console.error('[syncGameToCloud] Errore salvataggio Firestore:', err?.code, err?.message, err);
    return false;
  }
}

/**
 * Cerca e recupera una partita nel Cloud per PIN a 6 cifre, ID completo o Link incollato
 */
export async function findGameByPinOrId(pinOrId) {
  if (!db || !pinOrId) return null;
  const input = String(pinOrId).trim();

  if (input.includes('game=')) {
    try {
      const match = input.match(/game=([a-zA-Z0-9_-]+)/);
      if (match && match[1]) return findGameByPinOrId(match[1]);
    } catch {
      // fallback
    }
  }

  const cleanDigits = input.replace(/\D/g, '');
  if (cleanDigits.length >= 4 && cleanDigits.length <= 10) {
    try {
      const pinRef = doc(db, 'burraco_pins', cleanDigits);
      const pinSnap = await getDoc(pinRef);
      if (pinSnap.exists()) {
        const pinData = pinSnap.data();
        if (pinData?.gameId) {
          const gameSnap = await getDoc(doc(db, 'burraco_games', pinData.gameId));
          if (gameSnap.exists()) return gameSnap.data();
        }
      }
    } catch (pinErr) {
      console.warn('Avviso lookup rapido burraco_pins:', pinErr);
    }
  }

  try {
    const snap = await getDoc(doc(db, 'burraco_games', input));
    if (snap.exists()) return snap.data();
  } catch (err) {
    console.warn('Avviso findGameById:', err);
  }

  if (!input.startsWith('game_')) {
    try {
      const snap = await getDoc(doc(db, 'burraco_games', `game_${input}`));
      if (snap.exists()) return snap.data();
    } catch {
      // ignore
    }
  }

  if (cleanDigits.length >= 4 && auth?.currentUser?.uid) {
    try {
      const colRef = collection(db, 'burraco_games');
      let querySnap;
      try {
        querySnap = await getDocs(query(
          colRef,
          where('ownerUid', '==', auth.currentUser.uid),
          orderBy('createdAt', 'desc'),
          limit(30)
        ));
      } catch {
        querySnap = await getDocs(query(
          colRef,
          where('ownerUid', '==', auth.currentUser.uid),
          limit(30)
        ));
      }
      for (const d of querySnap.docs) {
        if (d.id.endsWith(cleanDigits)) {
          return d.data();
        }
      }
    } catch (err) {
      console.warn('Avviso scansione PIN:', err);
    }
  }

  return null;
}

/**
 * Ascolta in tempo reale le modifiche di una partita (Real-time listener)
 */
export function subscribeToCloudGame(gameId, onUpdate, onNotFound) {
  if (!db || !gameId) return () => {};
  const gamePath = `burraco_games/${gameId}`;
  try {
    const gameRef = doc(db, 'burraco_games', gameId);
    return onSnapshot(gameRef, (docSnap) => {
      if (docSnap.exists()) {
        onUpdate(docSnap.data());
      } else if (onNotFound) {
        onNotFound();
      }
    }, (err) => {
      if (isPermissionOrQuotaError(err)) {
        handleFirestoreError(err, OperationType.GET, gamePath);
      }
      console.warn('Errore listener Firestore:', err.message);
    });
  } catch (err) {
    console.warn('subscribeToCloudGame error:', err);
    return () => {};
  }
}

/**
 * Carica le partite archiviate dal cloud per l'utente specificato (ordinate per data decrescente)
 */
export async function loadCloudGamesHistory(currentUser = null) {
  if (!db || !currentUser?.uid) return [];
  try {
    const colRef = collection(db, 'burraco_games');
    const gamesMap = new Map();

    try {
      const snapOwner = await getDocsWithOrderFallback(
        query(colRef, where('ownerUid', '==', currentUser.uid), orderBy('createdAt', 'desc'), limit(60)),
        query(colRef, where('ownerUid', '==', currentUser.uid), limit(60)),
        'burraco_games'
      );
      snapOwner.forEach(docSnap => gamesMap.set(docSnap.id, docSnap.data()));
    } catch (e1) {
      console.warn('Errore query ownerUid:', e1.message);
    }

    try {
      const snapPart = await getDocsWithOrderFallback(
        query(colRef, where('playerUids', 'array-contains', currentUser.uid), orderBy('createdAt', 'desc'), limit(40)),
        query(colRef, where('playerUids', 'array-contains', currentUser.uid), limit(40)),
        'burraco_games'
      );
      snapPart.forEach(docSnap => gamesMap.set(docSnap.id, docSnap.data()));
    } catch (e2) {
      console.warn('Errore query playerUids:', e2.message);
    }

    const list = Array.from(gamesMap.values())
      .filter(data => data && data.id && (data.isFinished || (data.rounds && data.rounds.length > 0) || (data.createdAt && (Date.now() - new Date(data.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000))))
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    return list;
  } catch (err) {
    console.warn('Errore caricamento partite da Firestore:', err.message);
    return [];
  }
}

/**
 * Elimina una partita archiviata da Firestore e pulisce l'eventuale PIN orfano in burraco_pins
 */
export async function deleteGameFromCloud(gameId) {
  if (!db || !gameId) return false;
  const gamePath = `burraco_games/${gameId}`;
  try {
    const shortPin = computeGameShortPin(gameId);
    if (shortPin && shortPin.length >= 4) {
      try {
        const pinRef = doc(db, 'burraco_pins', shortPin);
        const pinSnap = await getDoc(pinRef);
        if (pinSnap.exists() && pinSnap.data()?.gameId === gameId) {
          await deleteDoc(pinRef);
        }
        registeredPinsCache.delete(`${shortPin}:${gameId}`);
      } catch (pinErr) {
        console.warn('Avviso rimozione PIN orfano:', pinErr?.message);
      }
    }

    const gameRef = doc(db, 'burraco_games', gameId);
    await deleteDoc(gameRef);
    return true;
  } catch (err) {
    if (isPermissionOrQuotaError(err)) {
      handleFirestoreError(err, OperationType.DELETE, gamePath);
    }
    console.warn('Errore deleteGameFromCloud:', err.message);
    return false;
  }
}

/**
 * Ascolta in tempo reale lo storico partite da Firestore con isolamento utente e propagazione eliminazioni
 */
export function subscribeToCloudGamesHistory(currentUser, onUpdate) {
  if (!db) return () => {};
  try {
    if (!currentUser?.uid) {
      if (onUpdate) onUpdate([], { isPartial: false });
      return () => {};
    }

    const colRef = collection(db, 'burraco_games');
    let ownerMap = new Map();
    let partMap = new Map();
    let ownerReady = false;
    let partReady = false;
    let ownerFailed = false;
    let partFailed = false;

    const emitMerged = () => {
      if ((!ownerReady && !ownerFailed) || (!partReady && !partFailed)) return;
      if (!ownerReady && !partReady) return;

      const merged = new Map();
      partMap.forEach((val, key) => merged.set(key, val));
      ownerMap.forEach((val, key) => merged.set(key, val));

      const list = Array.from(merged.values())
        .filter(data => data && data.id && (data.isFinished || (data.rounds && data.rounds.length > 0) || (data.createdAt && (Date.now() - new Date(data.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000))))
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      if (onUpdate) onUpdate(list, { isPartial: ownerFailed || partFailed });
    };

    const unsubOwner = subscribeWithOrderFallback(
      query(colRef, where('ownerUid', '==', currentUser.uid), orderBy('createdAt', 'desc'), limit(60)),
      query(colRef, where('ownerUid', '==', currentUser.uid), limit(60)),
      (snapshot) => {
        const nextOwner = new Map();
        snapshot.forEach(docSnap => nextOwner.set(docSnap.id, docSnap.data()));
        ownerMap = nextOwner;
        ownerReady = true;
        ownerFailed = false;
        emitMerged();
      },
      'burraco_games',
      () => {
        ownerFailed = true;
        emitMerged();
      }
    );

    const unsubPart = subscribeWithOrderFallback(
      query(colRef, where('playerUids', 'array-contains', currentUser.uid), orderBy('createdAt', 'desc'), limit(40)),
      query(colRef, where('playerUids', 'array-contains', currentUser.uid), limit(40)),
      (snapshot) => {
        const nextPart = new Map();
        snapshot.forEach(docSnap => nextPart.set(docSnap.id, docSnap.data()));
        partMap = nextPart;
        partReady = true;
        partFailed = false;
        emitMerged();
      },
      'burraco_games',
      () => {
        partFailed = true;
        emitMerged();
      }
    );

    return () => {
      unsubOwner();
      unsubPart();
    };
  } catch (err) {
    console.warn('subscribeToCloudGamesHistory error:', err);
    return () => {};
  }
}

/**
 * Registra in modo atomico (runTransaction) la presenza dell'utente autenticato nella partita cloud
 */
export async function joinCloudGame(gameId, currentUser) {
  if (!db || !gameId || !currentUser?.uid) return;
  const gamePath = `burraco_games/${gameId}`;
  try {
    const gameRef = doc(db, 'burraco_games', gameId);
    const userEmail = (currentUser.email || '').trim().toLowerCase();

    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(gameRef);
      if (!snap.exists()) return;

      const data = snap.data();
      const currentUids = Array.isArray(data.playerUids) ? data.playerUids : [];
      const currentEmails = Array.isArray(data.playerEmails) ? data.playerEmails : [];

      const needsUid = !currentUids.includes(currentUser.uid);
      const needsEmail = Boolean(userEmail) && !currentEmails.includes(userEmail);

      if (!needsUid && !needsEmail) return;

      const updatedUids = needsUid ? [...currentUids, currentUser.uid].slice(0, 10) : currentUids.slice(0, 10);
      const updatedEmails = needsEmail ? [...currentEmails, userEmail].slice(0, 10) : currentEmails.slice(0, 10);

      transaction.set(gameRef, {
        playerUids: updatedUids,
        playerEmails: updatedEmails,
        updatedAt: serverTimestamp()
      }, { merge: true });
    });
  } catch (err) {
    if (isPermissionOrQuotaError(err)) {
      handleFirestoreError(err, OperationType.UPDATE, gamePath);
    }
    console.warn('Errore joinCloudGame:', err.message);
  }
}
