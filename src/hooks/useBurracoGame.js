import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAlert } from '../context/confirmContextStore';
import {
  getActiveGame,
  saveActiveGame,
  getGamesHistory,
  getHistoryKey,
  archiveCurrentGame,
  deleteGameFromHistory,
  computeUserCareerStats,
  safeSetItem,
  addToOutboxQueue,
  getOutboxQueue,
  removeFromOutboxQueue
} from '../utils/storage';
import { decodeGameFromUrlToken } from '../utils/statelessGame';
import {
  syncGameToCloud,
  findGameByPinOrId,
  subscribeToCloudGame,
  subscribeToCloudGamesHistory,
  deleteGameFromCloud,
  joinCloudGame,
  fetchTablePlayers,
  updateUserCareerStats
} from '../services/firebase';
import { sendGameInvite } from '../services/social';
import { computeGameTelemetry } from '../utils/telemetry';
import {
  appendBlock,
  mergeChainsCRDT,
  migrateLegacyGameToLedger,
  reconstructGameStateFromChain,
  EVENT_TYPES
} from '../utils/ledger';

function computeTeamTotalsAndWinner(rounds, mode, targetScore = 2505, forceWinner = false) {
  const isTrio = mode === 'trio';
  let t1Total = 0;
  let t2Total = 0;
  let t3Total = 0;

  (rounds || []).forEach(r => {
    t1Total += Number(r?.team1Score) || 0;
    t2Total += Number(r?.team2Score) || 0;
    t3Total += Number(r?.team3Score) || 0;
  });

  const target = Number(targetScore) || 2505;
  const isTargetReached = isTrio
    ? (t1Total >= target || t2Total >= target || t3Total >= target)
    : (t1Total >= target || t2Total >= target);

  let winner = null;
  if (isTargetReached || forceWinner) {
    if (isTrio) {
      if (t1Total >= t2Total && t1Total >= t3Total) winner = 'team1';
      else if (t2Total >= t1Total && t2Total >= t3Total) winner = 'team2';
      else winner = 'team3';
    } else {
      winner = t1Total >= t2Total ? 'team1' : 'team2';
    }
  }

  return { t1Total, t2Total, t3Total, isTargetReached, winner };
}

function appendLedgerEvent(game, eventType, payload, author) {
  let chain = null;
  try {
    chain = migrateLegacyGameToLedger(game, author);
    if (chain) {
      chain = appendBlock(chain, eventType, payload, author);
    }
  } catch (chainErr) {
    console.warn(`Avviso registrazione blocco ledger (${eventType}):`, chainErr);
  }
  return {
    ledgerChain: chain || game?.ledgerChain || null,
    ledgerLastHash: chain && chain.length > 0 ? chain[chain.length - 1].hash : (game?.ledgerLastHash || null),
  };
}

function upsertHistoryGame(userKey, game, setGamesHistory) {
  try {
    const history = getGamesHistory(userKey);
    const hIndex = history.findIndex(g => g?.id === game.id);
    if (hIndex >= 0) {
      const newHistory = [...history];
      newHistory[hIndex] = game;
      safeSetItem(getHistoryKey(userKey), JSON.stringify(newHistory));
      setGamesHistory(newHistory);
      return newHistory;
    }
  } catch (histErr) {
    console.warn('Errore salvataggio storico locale:', histErr);
  }
  return null;
}

function updateCareerStatsInBackground(user, updatedHistory, targetGame) {
  if (!user?.uid) return;
  const stats = computeUserCareerStats(user, updatedHistory, targetGame);
  if (stats) {
    updateUserCareerStats(user.uid, stats).catch(err => {
      console.warn('Avviso aggiornamento careerStats cloud:', err);
    });
  }
}

export function useBurracoGame({
  currentUser,
  friendsList = [],
  activeTournament = null,
  handleUpdateTournament = () => {},
  onCelebrate = () => {},
}) {
  const customAlert = useAlert();
  const [activeGame, setActiveGame] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('game')) return null;
    }
    const current = getActiveGame();
    const hasRealRounds = current && Array.isArray(current.rounds) && current.rounds.length > 0;
    const isClosed = current && (Boolean(current.tableClosed) || Boolean(current.isFinished));
    if (hasRealRounds && !isClosed) return current;
    saveActiveGame(null);
    return null;
  });
  const [gamesHistory, setGamesHistory] = useState(() => getGamesHistory());
  const [isCloudJoined, setIsCloudJoined] = useState(
    () => typeof window !== 'undefined' && Boolean(new URLSearchParams(window.location.search).get('game'))
  );
  const [tablePlayers, setTablePlayers] = useState([]);
  const [newGameInitialSetup, setNewGameInitialSetup] = useState(null);
  const [syncStatus, setSyncStatus] = useState(() => (typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'synced'));

  const lastFetchedRosterKeyRef = useRef('');
  const offlineEventsCountRef = useRef(0);
  const pendingSyncIdsRef = useRef(new Set());

  const currentUserRef = useRef(currentUser);
  const friendsListRef = useRef(friendsList);
  const activeTournamentRef = useRef(activeTournament);
  const handleUpdateTournamentRef = useRef(handleUpdateTournament);
  const onCelebrateRef = useRef(onCelebrate);
  const activeGameRef = useRef(activeGame);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);
  useEffect(() => {
    friendsListRef.current = friendsList;
  }, [friendsList]);
  useEffect(() => {
    activeTournamentRef.current = activeTournament;
  }, [activeTournament]);
  useEffect(() => {
    handleUpdateTournamentRef.current = handleUpdateTournament;
  }, [handleUpdateTournament]);
  useEffect(() => {
    onCelebrateRef.current = onCelebrate;
  }, [onCelebrate]);
  useEffect(() => {
    activeGameRef.current = activeGame;
  }, [activeGame]);

  const currentUid = currentUser?.uid || null;
  const currentEmail = (currentUser?.email || '').trim().toLowerCase();

  const flushOutboxQueue = useCallback(async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;
    await Promise.resolve();
    const queue = getOutboxQueue();
    if (!queue || queue.length === 0) return;
    setSyncStatus('syncing');
    for (const item of queue) {
      try {
        const ok = await syncGameToCloud(item, currentUserRef.current, true);
        if (ok) {
          removeFromOutboxQueue(item.id);
        }
      } catch (err) {
        console.warn('[Outbox] Errore sincronizzazione elemento accodato:', err);
      }
    }
    const remaining = getOutboxQueue();
    setSyncStatus(remaining.length === 0 ? 'synced' : 'offline');
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setSyncStatus('synced');
      flushOutboxQueue();
    };
    const handleOffline = () => {
      offlineEventsCountRef.current += 1;
      setSyncStatus('offline');
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    let flushTimer = null;
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      flushTimer = setTimeout(() => {
        flushOutboxQueue();
      }, 0);
    }

    return () => {
      if (flushTimer) clearTimeout(flushTimer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [flushOutboxQueue]);

  const syncWithStatus = useCallback(async (gameToSync, force = false) => {
    if (!gameToSync?.id) return false;
    setSyncStatus('syncing');
    pendingSyncIdsRef.current.add(gameToSync.id);
    let ok = false;
    try {
      ok = await syncGameToCloud(gameToSync, currentUserRef.current, force);
    } catch (err) {
      console.warn('[syncWithStatus] Errore sincronizzazione cloud:', err?.message || err);
      ok = false;
    } finally {
      pendingSyncIdsRef.current.delete(gameToSync.id);
    }
    if (!ok) {
      addToOutboxQueue(gameToSync);
    } else {
      removeFromOutboxQueue(gameToSync.id);
    }
    setSyncStatus(ok ? 'synced' : 'offline');
    return ok;
  }, []);

  // Giocatori ricavati dinamicamente dallo storico partite e dalla partita in corso
  const recentPlayers = useMemo(() => {
    const namesSet = new Set();
    const extractFromGame = (game) => {
      if (!game) return;
      if (Array.isArray(game.team1?.players)) game.team1.players.forEach(p => p && typeof p === 'string' && namesSet.add(p.trim()));
      if (Array.isArray(game.team2?.players)) game.team2.players.forEach(p => p && typeof p === 'string' && namesSet.add(p.trim()));
      if (Array.isArray(game.team3?.players)) game.team3.players.forEach(p => p && typeof p === 'string' && namesSet.add(p.trim()));
    };
    extractFromGame(activeGame);
    (gamesHistory || []).forEach(extractFromGame);
    return Array.from(namesSet).filter(Boolean);
  }, [gamesHistory, activeGame]);

  // 1. Controllo Paracadute d'Emergenza Stateless Game (#backup=...)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.location.hash || !window.location.hash.includes('backup=')) {
      return;
    }
    let cancelled = false;
    Promise.resolve().then(() => {
      if (cancelled) return;
      try {
        const restoredGame = decodeGameFromUrlToken(window.location.hash);
        if (restoredGame && restoredGame.id) {
          saveActiveGame(restoredGame);
          setActiveGame(restoredGame);
          syncWithStatus(restoredGame, true);
          try {
            window.history.replaceState({}, '', window.location.pathname + window.location.search);
          } catch {}
          if (typeof customAlert === 'function') {
            customAlert({
              title: 'Partita Ripristinata!',
              message: `Il tavolo "${restoredGame.team1?.name} vs ${restoredGame.team2?.name}" è stato ripristinato con successo dal link di backup!`,
              variant: 'success'
            });
          }
        }
      } catch (backupErr) {
        console.warn('Errore ripristino backup URL:', backupErr);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [customAlert, syncWithStatus]);

  // 2. Isolamento dati storico partite per account utente & sync cloud (senza resuscitare partite eliminate)
  useEffect(() => {
    const userKey = currentUid || 'guest';
    let cancelled = false;

    Promise.resolve().then(() => {
      if (!cancelled) {
        setGamesHistory(getGamesHistory(userKey));
      }
    });

    if (!currentUid) {
      return () => {
        cancelled = true;
      };
    }

    const unsubHistory = subscribeToCloudGamesHistory({ uid: currentUid }, (cloudHistory, meta = {}) => {
      if (cancelled || !Array.isArray(cloudHistory)) return;
      const localGames = getGamesHistory(userKey);
      const outboxIds = new Set((getOutboxQueue() || []).map(g => g?.id).filter(Boolean));
      const activeId = activeGameRef.current?.id;

      const map = new Map();
      // Conserva localmente le partite se la risposta cloud è parziale, in coda offline, in sync, o attiva
      localGames.forEach(g => {
        if (!g?.id) return;
        if (meta?.isPartial || outboxIds.has(g.id) || pendingSyncIdsRef.current.has(g.id) || g.id === activeId) {
          map.set(g.id, g);
        }
      });

      cloudHistory.forEach(cloudGame => {
        if (!cloudGame?.id) return;
        const localMatch = map.get(cloudGame.id);
        if (localMatch && (localMatch.rounds?.length || 0) > (cloudGame.rounds?.length || 0)) {
          return;
        }
        map.set(cloudGame.id, cloudGame);
      });

      const merged = Array.from(map.values()).sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      );

      setGamesHistory(merged);
      safeSetItem(getHistoryKey(userKey), JSON.stringify(merged));
    });

    return () => {
      cancelled = true;
      unsubHistory();
    };
  }, [currentUid]);

  // 3. Ascolto real-time della partita attiva da Firestore (Multi-device live sync)
  useEffect(() => {
    const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const urlGameId = params ? params.get('game') : null;
    const targetId = urlGameId || activeGame?.id;

    if (!targetId) return;

    lastFetchedRosterKeyRef.current = '';

    // Esegue joinCloudGame solo se l'utente autenticato non è già registrato sul tavolo
    const user = currentUserRef.current;
    if (currentUid && user) {
      const currentActive = activeGameRef.current;
      const alreadyHasUid = currentActive?.id === targetId &&
        Array.isArray(currentActive.playerUids) &&
        currentActive.playerUids.includes(currentUid);
      const alreadyHasEmail = !currentEmail || (
        currentActive?.id === targetId &&
        Array.isArray(currentActive.playerEmails) &&
        currentActive.playerEmails.some(e => (e || '').toLowerCase() === currentEmail)
      );
      if (!alreadyHasUid || !alreadyHasEmail) {
        joinCloudGame(targetId, user);
      }
    }

    const unsubscribe = subscribeToCloudGame(
      targetId,
      (cloudGame) => {
        if (cloudGame && cloudGame.id === targetId) {
          // Se l'host ha chiuso il tavolo, avvisa i partecipanti e svuota il tavolo
          if (cloudGame.tableClosed) {
            setActiveGame(null);
            saveActiveGame(null);
            setIsCloudJoined(false);
            if (typeof sessionStorage !== 'undefined') {
              sessionStorage.setItem('burraco_table_closed_explicitly', 'true');
            }
            try {
              const url = new URL(window.location.href);
              url.searchParams.delete('game');
              window.history.replaceState({}, '', url.pathname);
            } catch {
              // ignore
            }
            if (typeof customAlert === 'function') {
              customAlert({
                title: 'Tavolo Chiuso',
                message: "L'organizzatore ha chiuso questo tavolo di gioco. La partita rimane salvata nell'archivio.",
                variant: 'info'
              });
            }
            return;
          }

          setActiveGame(prev => {
            let nextGame = cloudGame;
            const prevRounds = Array.isArray(prev?.rounds) ? prev.rounds : [];
            const cloudRounds = Array.isArray(cloudGame.rounds) ? cloudGame.rounds : [];

            // Se entrambi i dispositivi hanno ledgerChain, esegui fusione deterministica CRDT
            if (prev?.id === targetId && Array.isArray(prev?.ledgerChain) && Array.isArray(cloudGame?.ledgerChain)) {
              try {
                const mergedChain = mergeChainsCRDT(prev.ledgerChain, cloudGame.ledgerChain);
                const reconstructed = reconstructGameStateFromChain(mergedChain, {
                  ...cloudGame,
                  ledgerChain: mergedChain,
                });
                if (reconstructed) {
                  nextGame = reconstructed;
                }
              } catch (crdtErr) {
                console.warn('[Multiplayer Sync] Avviso merge CRDT:', crdtErr);
              }
            } else if (prev?.id === targetId && prevRounds.length > cloudRounds.length) {
              console.warn(`[Multiplayer Sync] Stato locale ha ${prevRounds.length} mani, cloud ne ha ${cloudRounds.length}. Mantengo lo stato locale.`);
              nextGame = prev;
            }

            // Salvaguardia rounds: non perdere MAI le mani registrate nel cloud o in locale
            if (cloudRounds.length > (nextGame.rounds?.length || 0)) {
              nextGame = {
                ...nextGame,
                rounds: cloudRounds,
                winner: cloudGame.winner !== undefined ? cloudGame.winner : nextGame.winner,
                isFinished: cloudGame.isFinished ?? nextGame.isFinished,
              };
            }
            if (prev?.id === targetId && prevRounds.length > (nextGame.rounds?.length || 0)) {
              nextGame = {
                ...nextGame,
                rounds: prevRounds,
                winner: prev.winner !== undefined ? prev.winner : nextGame.winner,
                isFinished: prev.isFinished ?? nextGame.isFinished,
              };
            }

            saveActiveGame(nextGame);
            return nextGame;
          });

          setSyncStatus('synced');

          if ((cloudGame.playerUids && cloudGame.playerUids.length > 0) || (cloudGame.playerEmails && cloudGame.playerEmails.length > 0)) {
            const rosterKey = `${(cloudGame.playerUids || []).slice().sort().join(',')}|${(cloudGame.playerEmails || []).slice().sort().join(',')}`;
            if (rosterKey !== lastFetchedRosterKeyRef.current) {
              lastFetchedRosterKeyRef.current = rosterKey;
              fetchTablePlayers(cloudGame.playerUids, cloudGame.playerEmails).then(players => {
                if (Array.isArray(players) && players.length > 0) {
                  setTablePlayers(players);
                }
              });
            }
          }
        }
      },
      () => {
        if (urlGameId) {
          customAlert({
            title: 'Tavolo non trovato',
            message: `Il tavolo "${urlGameId}" non è stato trovato o è stato eliminato.`,
            variant: 'warning'
          });
          const url = new URL(window.location.href);
          url.searchParams.delete('game');
          window.history.replaceState({}, '', url.pathname);
          setIsCloudJoined(false);
          const currentLocal = getActiveGame();
          if (currentLocal) {
            setActiveGame(currentLocal);
          }
        }
      }
    );

    return () => unsubscribe();
  }, [activeGame?.id, currentUid, currentEmail, customAlert]);

  // Avvio nuova partita
  const handleStartGame = useCallback((newGame) => {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('burraco_table_closed_explicitly');
    }
    const user = currentUserRef.current;
    const friends = friendsListRef.current || [];
    const currentActive = activeGameRef.current;
    const userKey = user?.uid || 'guest';

    if (currentActive && currentActive.rounds && currentActive.rounds.length > 0) {
      const updatedHistory = archiveCurrentGame(currentActive, userKey);
      setGamesHistory(updatedHistory);
      if (updatedHistory && updatedHistory[0]) {
        syncWithStatus(updatedHistory[0], false);
      }
    }

    const allPlayers = [
      ...(newGame.team1?.players || []),
      ...(newGame.team2?.players || []),
      ...(newGame.team3?.players || [])
    ].map(p => typeof p === 'string' ? p.trim() : '').filter(Boolean);

    // Separa gli amici in gioco tra Amici Stretti (entrano direttamente) e Amici Normali (richiedono invito)
    const registeredPlayerUids = user?.uid ? [user.uid] : [];
    const registeredPlayerEmails = user?.email ? [user.email] : [];
    const pendingInviteFriends = [];

    if (user && friends.length > 0) {
      friends.forEach(friend => {
        const friendName = friend.displayName || friend.email || '';
        const isInGame = allPlayers.some(
          p => p.toLowerCase() === friendName.toLowerCase() || p.toLowerCase() === (friend.email || '').toLowerCase()
        );
        if (isInGame) {
          if (friend.isCloseFriend) {
            if (friend.uid && !registeredPlayerUids.includes(friend.uid)) registeredPlayerUids.push(friend.uid);
            if (friend.email && !registeredPlayerEmails.includes(friend.email)) registeredPlayerEmails.push(friend.email);
          } else {
            pendingInviteFriends.push(friend);
          }
        }
      });
    }

    const author = user ? { uid: user.uid, name: user.displayName } : null;
    let initialChain = null;
    try {
      initialChain = migrateLegacyGameToLedger(newGame, author);
    } catch (chainErr) {
      console.warn('Avviso inizializzazione ledger:', chainErr);
    }

    const gameWithOwnership = {
      ...newGame,
      ownerUid: user ? user.uid : null,
      ownerEmail: user?.email || null,
      ownerName: user?.displayName || null,
      playerUids: registeredPlayerUids,
      playerEmails: registeredPlayerEmails,
      ledgerChain: initialChain,
      ledgerLastHash: initialChain && initialChain.length > 0 ? initialChain[initialChain.length - 1].hash : null,
    };

    setActiveGame(gameWithOwnership);
    saveActiveGame(gameWithOwnership);

    const currentHistory = getGamesHistory(userKey);
    const updatedHistory = [gameWithOwnership, ...currentHistory.filter(g => g.id !== gameWithOwnership.id)];
    setGamesHistory(updatedHistory);
    safeSetItem(getHistoryKey(userKey), JSON.stringify(updatedHistory));

    syncWithStatus(gameWithOwnership, true);

    if (user && pendingInviteFriends.length > 0) {
      pendingInviteFriends.forEach(friend => {
        const friendName = friend.displayName || friend.email || '';
        const teamName = (newGame.team1?.players || []).some(p => p.toLowerCase() === friendName.toLowerCase())
          ? newGame.team1?.name
          : (newGame.team2?.players || []).some(p => p.toLowerCase() === friendName.toLowerCase())
          ? newGame.team2?.name
          : newGame.team3?.name || 'In Partita';

        sendGameInvite(user, friend, gameWithOwnership, teamName).catch(err => {
          console.warn('Avviso invio notifica partita:', err);
        });
      });
    }
  }, [syncWithStatus]);

  // Salva o aggiorna una mano
  const handleSaveRound = useCallback((roundData) => {
    const current = activeGameRef.current;
    if (!current) return;
    const user = currentUserRef.current;
    const userKey = user?.uid || 'guest';

    let updatedRounds;
    const existingIndex = (current.rounds || []).findIndex(
      r => r.roundNumber === roundData.roundNumber
    );

    if (existingIndex >= 0) {
      updatedRounds = [...current.rounds];
      updatedRounds[existingIndex] = roundData;
    } else {
      updatedRounds = [...(current.rounds || []), roundData];
    }

    const { t1Total, t2Total, isTargetReached, winner } = computeTeamTotalsAndWinner(
      updatedRounds,
      current.mode,
      current.targetScore
    );

    const author = user ? { uid: user.uid, name: user.displayName } : null;
    const ledger = appendLedgerEvent(current, EVENT_TYPES.ROUND_ADDED, roundData, author);

    const updatedGame = {
      ...current,
      rounds: updatedRounds,
      winner: winner || null,
      isFinished: isTargetReached,
      completedAt: isTargetReached ? (current.completedAt || new Date().toISOString()) : null,
      ...ledger,
    };

    if (isTargetReached) {
      updatedGame.telemetry = computeGameTelemetry(updatedGame, {
        offlineEventsCount: offlineEventsCountRef.current
      });
    }

    setActiveGame(updatedGame);
    saveActiveGame(updatedGame);
    syncWithStatus(updatedGame, true);
    upsertHistoryGame(userKey, updatedGame, setGamesHistory);

    const tourn = activeTournamentRef.current;
    if (current.tournamentMatchId && tourn?.rounds) {
      try {
        const tournUpdatedRounds = (tourn.rounds || []).map(r => ({
          ...r,
          matches: (r.matches || []).map(m => {
            if (m.id === current.tournamentMatchId) {
              return {
                ...m,
                team1Score: t1Total,
                team2Score: t2Total,
                status: winner ? 'completed' : 'in_progress',
                winnerId: winner ? (winner === 'team1' ? m.team1Id : m.team2Id) : null,
                completedAt: winner ? new Date().toISOString() : m.completedAt,
              };
            }
            return m;
          })
        }));
        handleUpdateTournamentRef.current({ ...tourn, rounds: tournUpdatedRounds });
      } catch (tournErr) {
        console.warn('Errore sync match torneo:', tournErr);
      }
    }

    if (isTargetReached) {
      try {
        onCelebrateRef.current();
      } catch (celErr) {
        console.warn('Errore celebrazione vittoria:', celErr);
      }
    }
  }, [syncWithStatus]);

  // Annulla l'ultima mano
  const handleDeleteLastRound = useCallback(async (customConfirm) => {
    const current = activeGameRef.current;
    if (!current || !current.rounds || current.rounds.length === 0) return;

    const ok = typeof customConfirm === 'function'
      ? await customConfirm({
          title: 'Annulla Ultima Mano',
          message: "Vuoi davvero cancellare l'ultima mano inserita dal tabellone?",
          confirmText: 'Sì, annulla',
          variant: 'danger'
        })
      : window.confirm("Vuoi davvero cancellare l'ultima mano inserita?");
    if (!ok) return;

    const latest = activeGameRef.current;
    if (!latest || !latest.rounds || latest.rounds.length === 0) return;

    const user = currentUserRef.current;
    const userKey = user?.uid || 'guest';
    const updatedRounds = latest.rounds.slice(0, -1);
    const { isTargetReached, winner } = computeTeamTotalsAndWinner(
      updatedRounds,
      latest.mode,
      latest.targetScore
    );

    const author = user ? { uid: user.uid, name: user.displayName } : null;
    const ledger = appendLedgerEvent(latest, EVENT_TYPES.ROUND_REVERTED, { roundNumber: latest.rounds.length }, author);

    const updatedGame = {
      ...latest,
      rounds: updatedRounds,
      winner,
      isFinished: isTargetReached,
      completedAt: isTargetReached ? (latest.completedAt || new Date().toISOString()) : null,
      ...ledger,
    };

    setActiveGame(updatedGame);
    saveActiveGame(updatedGame);
    syncWithStatus(updatedGame, true);
    upsertHistoryGame(userKey, updatedGame, setGamesHistory);
  }, [syncWithStatus]);

  // Cancella una specifica mano dal tabellone (foglio segnapunti)
  const handleDeleteRound = useCallback(async (roundNumber, customConfirm) => {
    const current = activeGameRef.current;
    if (!current || !current.rounds || current.rounds.length === 0) return;

    const roundIndex = (current.rounds || []).findIndex(
      r => r.roundNumber === roundNumber
    );
    if (roundIndex === -1) return;

    const targetRound = current.rounds[roundIndex];
    const isTrio = current.mode === 'trio';
    const scoreSummary = isTrio
      ? `${targetRound.team1Score || 0} vs ${targetRound.team2Score || 0} vs ${targetRound.team3Score || 0} pt`
      : `${targetRound.team1Score || 0} vs ${targetRound.team2Score || 0} pt`;

    const ok = typeof customConfirm === 'function'
      ? await customConfirm({
          title: `Elimina Mano #${roundNumber}`,
          message: `Vuoi davvero cancellare la Mano #${roundNumber} (${scoreSummary})? I punti progressivi e i totali verranno ricalcolati automaticamente.`,
          confirmText: "Elimina Mano",
          variant: "danger"
        })
      : window.confirm(`Vuoi davvero cancellare la Mano #${roundNumber}?`);
    if (!ok) return;

    const latest = activeGameRef.current;
    if (!latest || !latest.rounds) return;
    const latestIdx = latest.rounds.findIndex(r => r.roundNumber === roundNumber);
    if (latestIdx === -1) return;

    const remainingRounds = latest.rounds
      .filter((_, idx) => idx !== latestIdx)
      .map((r, newIdx) => ({
        ...r,
        roundNumber: newIdx + 1
      }));

    const { isTargetReached, winner } = computeTeamTotalsAndWinner(
      remainingRounds,
      latest.mode,
      latest.targetScore
    );

    const user = currentUserRef.current;
    const userKey = user?.uid || 'guest';
    const author = user ? { uid: user.uid, name: user.displayName } : null;
    const ledger = appendLedgerEvent(latest, EVENT_TYPES.ROUND_REVERTED, { roundNumber }, author);

    const updatedGame = {
      ...latest,
      rounds: remainingRounds,
      winner,
      isFinished: isTargetReached,
      completedAt: isTargetReached ? (latest.completedAt || new Date().toISOString()) : null,
      ...ledger,
    };

    setActiveGame(updatedGame);
    saveActiveGame(updatedGame);
    syncWithStatus(updatedGame, true);
    upsertHistoryGame(userKey, updatedGame, setGamesHistory);
  }, [syncWithStatus]);

  // Aggiorna squadre
  const handleUpdateTeams = useCallback((updatedTeam1, updatedTeam2, updatedTeam3) => {
    const current = activeGameRef.current;
    if (!current) return;

    const user = currentUserRef.current;
    const userKey = user?.uid || 'guest';
    const author = user ? { uid: user.uid, name: user.displayName } : null;
    const ledger = appendLedgerEvent(
      current,
      EVENT_TYPES.TEAMS_UPDATED,
      {
        team1: updatedTeam1,
        team2: updatedTeam2,
        team3: current.mode === 'trio' && updatedTeam3 ? updatedTeam3 : null,
      },
      author
    );

    const updatedGame = {
      ...current,
      team1: updatedTeam1,
      team2: updatedTeam2,
      ...(current.mode === 'trio' && updatedTeam3 ? { team3: updatedTeam3 } : {}),
      ...ledger,
    };

    setActiveGame(updatedGame);
    saveActiveGame(updatedGame);
    syncWithStatus(updatedGame, true);
    upsertHistoryGame(userKey, updatedGame, setGamesHistory);
  }, [syncWithStatus]);

  // Conclude la partita (accetta un eventuale gameOverride per chiusura diretta da Archivio)
  const handleEndGame = useCallback((gameOverride = null) => {
    const current = (gameOverride && gameOverride.id) ? gameOverride : activeGameRef.current;
    if (!current) return;

    const user = currentUserRef.current;
    const userKey = user?.uid || 'guest';
    const { t1Total, t2Total, winner } = computeTeamTotalsAndWinner(
      current.rounds,
      current.mode,
      current.targetScore,
      true
    );

    const author = user ? { uid: user.uid, name: user.displayName } : null;
    const ledger = appendLedgerEvent(current, EVENT_TYPES.GAME_FINISHED, { winner }, author);

    const updatedGame = {
      ...current,
      tableClosed: false,
      winner,
      isFinished: true,
      completedAt: new Date().toISOString(),
      ...ledger,
    };
    updatedGame.telemetry = computeGameTelemetry(updatedGame, {
      offlineEventsCount: offlineEventsCountRef.current
    });

    setActiveGame(updatedGame);
    saveActiveGame(updatedGame);
    syncWithStatus(updatedGame, true);

    const tourn = activeTournamentRef.current;
    if (current.tournamentMatchId && tourn?.rounds) {
      const winnerTeamId = winner === 'team1' ? current.team1?.id : current.team2?.id;
      const tournUpdatedRounds = tourn.rounds.map(r => ({
        ...r,
        matches: r.matches.map(m => {
          if (m.id === current.tournamentMatchId) {
            return {
              ...m,
              team1Score: t1Total,
              team2Score: t2Total,
              status: 'completed',
              winnerId: t1Total === t2Total ? 'tie' : winnerTeamId,
              completedAt: new Date().toISOString(),
            };
          }
          return m;
        })
      }));
      handleUpdateTournamentRef.current({ ...tourn, rounds: tournUpdatedRounds });
    }

    const updatedHistory = archiveCurrentGame(updatedGame, userKey);
    setGamesHistory(updatedHistory);
    updateCareerStatsInBackground(user, updatedHistory, updatedGame);
    onCelebrateRef.current();
  }, [syncWithStatus]);

  // Rivincita
  const handleRematch = useCallback(() => {
    const current = activeGameRef.current;
    if (!current) return;
    const user = currentUserRef.current;
    const userKey = user?.uid || 'guest';
    const updatedHistory = archiveCurrentGame(current, userKey);
    setGamesHistory(updatedHistory);
    if (updatedHistory && updatedHistory[0]) {
      syncWithStatus(updatedHistory[0], true);
    }
    updateCareerStatsInBackground(user, updatedHistory, current);

    const rematchGame = {
      id: 'game_' + Date.now(),
      createdAt: new Date().toISOString(),
      mode: current.mode,
      allowSemipulito: current.allowSemipulito,
      targetScore: current.targetScore,
      team1: current.team1,
      team2: current.team2,
      ...(current.mode === 'trio' ? { team3: current.team3 } : {}),
      rounds: [],
      winner: null,
      isFinished: false,
      ownerUid: current.ownerUid || (user ? user.uid : null),
      ownerEmail: current.ownerEmail || user?.email || null,
      ownerName: current.ownerName || user?.displayName || null,
      playerUids: current.playerUids || (user ? [user.uid] : []),
      playerEmails: current.playerEmails || (user?.email ? [user.email] : []),
    };

    setActiveGame(rematchGame);
    saveActiveGame(rematchGame);
    syncWithStatus(rematchGame, true);
  }, [syncWithStatus]);

  // Archivia e prepara nuova partita pulita
  const handleArchiveAndNew = useCallback((onOpenNewGame) => {
    const current = activeGameRef.current;
    if (current) {
      const user = currentUserRef.current;
      const userKey = user?.uid || 'guest';
      const { winner: computedWinner } = computeTeamTotalsAndWinner(
        current.rounds,
        current.mode,
        current.targetScore,
        true
      );

      const finishedGame = {
        ...current,
        winner: current.winner || computedWinner,
        isFinished: true,
        completedAt: current.completedAt || new Date().toISOString(),
      };

      const updatedHistory = archiveCurrentGame(finishedGame, userKey);
      setGamesHistory(updatedHistory);
      syncWithStatus(finishedGame, true);
      updateCareerStatsInBackground(user, updatedHistory, finishedGame);
    }

    if (typeof window !== 'undefined' && window.location.search.includes('game=')) {
      const url = new URL(window.location.href);
      url.searchParams.delete('game');
      window.history.replaceState({}, '', url.pathname);
    }
    setIsCloudJoined(false);

    saveActiveGame(null);
    setActiveGame(null);

    if (typeof onOpenNewGame === 'function') {
      onOpenNewGame();
    }
  }, [syncWithStatus]);

  // Chiudi tavolo di gioco (sospendi e torna alla schermata principale)
  const handleCloseTable = useCallback(async (customConfirm) => {
    const current = activeGameRef.current;
    if (!current) return;

    const hasRounds = current.rounds && current.rounds.length > 0;
    const ok = typeof customConfirm === 'function'
      ? await customConfirm({
          title: 'Chiudi Tavolo',
          message: hasRounds
            ? `Vuoi chiudere questo tavolo? La partita corrente (${current.rounds.length} mani) rimarrà salvata al sicuro nell'archivio cloud e potrai riprenderla quando vuoi.`
            : 'Vuoi chiudere questo tavolo e tornare alla schermata iniziale?',
          confirmText: 'Chiudi Tavolo',
          cancelText: 'Continua a giocare',
          variant: 'warning'
        })
      : window.confirm('Vuoi chiudere questo tavolo?');
    if (!ok) return;

    const latest = activeGameRef.current || current;
    const closedGame = {
      ...latest,
      tableClosed: true,
      telemetry: computeGameTelemetry({ ...latest, tableClosed: true }, {
        offlineEventsCount: offlineEventsCountRef.current
      })
    };
    await syncWithStatus(closedGame, true);

    const userKey = currentUserRef.current?.uid || 'guest';
    const currentHistory = getGamesHistory(userKey);
    const updatedHistory = [closedGame, ...currentHistory.filter(g => g.id !== closedGame.id)];
    setGamesHistory(updatedHistory);
    safeSetItem(getHistoryKey(userKey), JSON.stringify(updatedHistory));

    saveActiveGame(null);
    setActiveGame(null);
    setIsCloudJoined(false);
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('burraco_table_closed_explicitly', 'true');
    }

    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('game');
      window.history.replaceState({}, '', url.pathname);
    } catch {
      // ignore
    }
  }, [syncWithStatus]);

  // Scollegati dal tavolo condiviso
  const handleLeaveCloudTable = useCallback(async (customConfirm) => {
    const ok = typeof customConfirm === 'function'
      ? await customConfirm({
          title: 'Scollegati dal Tavolo',
          message: 'Vuoi scollegarti da questo tavolo condiviso online e tornare alla schermata iniziale?',
          confirmText: 'Sì, scollegati',
          variant: 'warning'
        })
      : window.confirm("Vuoi scollegarti da questo tavolo condiviso?");
    if (ok) {
      try {
        const url = new URL(window.location.href);
        url.searchParams.delete('game');
        window.history.replaceState({}, '', url.pathname);
      } catch {
        // ignore
      }
      setIsCloudJoined(false);
      setActiveGame(null);
      saveActiveGame(null);
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('burraco_table_closed_explicitly', 'true');
      }
    }
  }, []);

  // Eliminazione partita dallo storico
  const handleDeleteGameHistory = useCallback((gameId) => {
    const userKey = currentUserRef.current?.uid || 'guest';
    const updated = deleteGameFromHistory(gameId, userKey);
    setGamesHistory(updated);
    removeFromOutboxQueue(gameId);
    deleteGameFromCloud(gameId).catch((err) => {
      console.warn('Errore eliminazione partita cloud:', err?.message || err);
    });
  }, []);

  // Condivisione WhatsApp / Appunti
  const handleShareGame = useCallback(() => {
    const current = activeGameRef.current;
    if (!current) return;
    const isTrio = current.mode === 'trio';
    const { t1Total, t2Total, t3Total } = computeTeamTotalsAndWinner(current.rounds, current.mode, current.targetScore);

    let text;
    if (isTrio) {
      text = `🃏 Burraco a 3 Score:
♦ ${current.team1.name} (${(current.team1.players || []).join(' & ')}): ${t1Total} pt
♠ ${current.team2.name} (${(current.team2.players || []).join(' & ')}): ${t2Total} pt
♥ ${current.team3?.name || 'Giocatore 3'} (${(current.team3?.players || []).join(' & ')}): ${t3Total} pt
Mani giocate: ${current.rounds.length} (Traguardo: ${current.targetScore} pt)`;
    } else {
      text = `🃏 Burraco Score:
♦ ${current.team1.name} (${current.team1.players.join(' & ')}): ${t1Total} pt
♠ ${current.team2.name} (${current.team2.players.join(' & ')}): ${t2Total} pt
Mani giocate: ${current.rounds.length} (Traguardo: ${current.targetScore} pt)`;
    }

    if (navigator.share) {
      navigator.share({ title: 'Punteggio Burraco', text });
    } else {
      navigator.clipboard.writeText(text);
      customAlert({
        title: 'Punteggio Copiato',
        message: 'Punteggio copiato negli appunti! Puoi incollarlo su WhatsApp o inviarlo agli amici.',
        variant: 'success'
      });
    }
  }, [customAlert]);

  // Riprendi partita passata o tavolo da PIN (riapre tableClosed nel cloud PRIMA di attivare il listener)
  const handleResumeGame = useCallback(async (gameOrId) => {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('burraco_table_closed_explicitly');
    }
    let targetGame = gameOrId;
    if (typeof gameOrId === 'string') {
      targetGame = await findGameByPinOrId(gameOrId);
      if (!targetGame) {
        const userKey = currentUserRef.current?.uid || 'guest';
        targetGame = (getGamesHistory(userKey) || []).find(g => g?.id === gameOrId);
      }
    }
    if (!targetGame || typeof targetGame !== 'object' || !targetGame.id) {
      console.warn('handleResumeGame: partita non valida', gameOrId);
      return null;
    }

    const resumedGame = {
      ...targetGame,
      tableClosed: false,
    };

    // Rimuove subito tableClosed: true su Firestore prima di montare il listener real-time
    if (targetGame.tableClosed && (typeof navigator === 'undefined' || navigator.onLine)) {
      await syncWithStatus(resumedGame, true);
    } else {
      syncWithStatus(resumedGame, true);
    }

    setActiveGame(resumedGame);
    saveActiveGame(resumedGame);
    setIsCloudJoined(true);

    try {
      const url = new URL(window.location.href);
      url.searchParams.set('game', resumedGame.id);
      window.history.replaceState({}, '', url.toString());
    } catch {}

    return resumedGame;
  }, [syncWithStatus]);

  // Salvataggio manuale forzato con feedback (Cloud Firestore + Locale)
  const handleManualSave = useCallback(async () => {
    const current = activeGameRef.current;
    if (!current) return { success: false, reason: 'no_game' };

    const user = currentUserRef.current;
    const userKey = user?.uid || 'guest';
    saveActiveGame(current);
    setGamesHistory(prev => {
      const filtered = (prev || []).filter(g => g?.id !== current.id);
      const updated = [current, ...filtered];
      safeSetItem(getHistoryKey(userKey), JSON.stringify(updated));
      return updated;
    });

    setSyncStatus('syncing');
    try {
      const ok = await syncGameToCloud(current, user, true);
      if (ok) removeFromOutboxQueue(current.id);
      setSyncStatus(ok ? 'synced' : 'offline');
      return { success: ok, isOffline: !ok };
    } catch (err) {
      console.warn('Errore salvataggio manuale nel cloud:', err);
      setSyncStatus('offline');
      return { success: false, isOffline: true, error: err };
    }
  }, []);

  // Importazione dati
  const handleDataImported = useCallback((importedGames, replaceCloud = false) => {
    const userKey = currentUserRef.current?.uid || 'guest';
    const localGames = getGamesHistory(userKey);
    if (Array.isArray(importedGames)) {
      let merged;
      if (replaceCloud) {
        merged = [...importedGames].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      } else {
        const map = new Map();
        localGames.forEach(g => { if (g && g.id) map.set(g.id, g); });
        importedGames.forEach(g => { if (g && g.id) map.set(g.id, g); });
        merged = Array.from(map.values()).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      }

      safeSetItem(getHistoryKey(userKey), JSON.stringify(merged));
      setGamesHistory(merged);
    } else {
      setGamesHistory(localGames);
    }
    const current = getActiveGame();
    if (current) setActiveGame(current);
  }, []);

  // Gioca incontro torneo sul tavolo principale
  const handlePlayTournamentMatch = useCallback((match, tournament, onTournamentMatchStarted) => {
    if (!match || !tournament) return;

    const current = activeGameRef.current;
    if (current && current.rounds && current.rounds.length > 0 && current.tournamentMatchId !== match.id) {
      const userKey = currentUserRef.current?.uid || 'guest';
      const updatedHistory = archiveCurrentGame(current, userKey);
      setGamesHistory(updatedHistory);
      if (updatedHistory && updatedHistory[0]) {
        syncWithStatus(updatedHistory[0], false);
      }
    }

    const tournamentGame = {
      id: match.gameId || ('game_' + Date.now()),
      createdAt: new Date().toISOString(),
      mode: 'pairs',
      allowSemipulito: true,
      targetScore: tournament.targetScore || 2505,
      tournamentId: tournament.id,
      tournamentName: tournament.name,
      tournamentMatchId: match.id,
      tournamentRoundNumber: match.roundNumber,
      tournamentTableNumber: match.tableNumber,
      team1: {
        id: match.team1Id,
        name: match.team1Name,
        players: match.team1Players || [],
      },
      team2: {
        id: match.team2Id,
        name: match.team2Name,
        players: match.team2Players || [],
      },
      rounds: [],
      winner: null,
      isFinished: false,
    };

    if (match.status !== 'completed') {
      const updatedRounds = tournament.rounds.map(r => ({
        ...r,
        matches: r.matches.map(m => {
          if (m.id === match.id) {
            return {
              ...m,
              status: 'in_progress',
              gameId: tournamentGame.id,
            };
          }
          return m;
        })
      }));
      handleUpdateTournamentRef.current({ ...tournament, rounds: updatedRounds });
    }

    setActiveGame(tournamentGame);
    saveActiveGame(tournamentGame);
    syncWithStatus(tournamentGame, false);

    if (typeof onTournamentMatchStarted === 'function') {
      onTournamentMatchStarted();
    }
  }, [syncWithStatus]);

  // Sfida un amico
  const handleChallengeFriend = useCallback((friend, onOpenNewGameModal) => {
    const myName = currentUserRef.current?.displayName || 'Io';
    const friendName = friend.displayName || friend.email || 'Amico';
    setNewGameInitialSetup({
      mode: 'pairs',
      p1A: myName,
      p2A: friendName,
      team1Name: `Coppia ${myName}`,
      team2Name: `Coppia ${friendName}`
    });
    if (typeof onOpenNewGameModal === 'function') {
      onOpenNewGameModal();
    }
  }, []);

  return useMemo(() => ({
    activeGame,
    setActiveGame,
    gamesHistory,
    setGamesHistory,
    recentPlayers,
    isCloudJoined,
    setIsCloudJoined,
    syncStatus,
    tablePlayers,
    setTablePlayers,
    newGameInitialSetup,
    setNewGameInitialSetup,
    handleStartGame,
    handleSaveRound,
    handleDeleteRound,
    handleDeleteLastRound,
    handleUpdateTeams,
    handleEndGame,
    handleCloseTable,
    handleManualSave,
    handleRematch,
    handleArchiveAndNew,
    handleLeaveCloudTable,
    handleDeleteGameHistory,
    handleShareGame,
    handleResumeGame,
    handleDataImported,
    handlePlayTournamentMatch,
    handleChallengeFriend,
  }), [
    activeGame,
    gamesHistory,
    recentPlayers,
    isCloudJoined,
    syncStatus,
    tablePlayers,
    newGameInitialSetup,
    handleStartGame,
    handleSaveRound,
    handleDeleteRound,
    handleDeleteLastRound,
    handleUpdateTeams,
    handleEndGame,
    handleCloseTable,
    handleManualSave,
    handleRematch,
    handleArchiveAndNew,
    handleLeaveCloudTable,
    handleDeleteGameHistory,
    handleShareGame,
    handleResumeGame,
    handleDataImported,
    handlePlayTournamentMatch,
    handleChallengeFriend,
  ]);
}
