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

  const flushOutboxQueue = useCallback(async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;
    await Promise.resolve();
    const queue = getOutboxQueue();
    if (!queue || queue.length === 0) return;
    setSyncStatus('syncing');
    for (const item of queue) {
      try {
        const ok = await syncGameToCloud(item, currentUser, true);
        if (ok) {
          removeFromOutboxQueue(item.id);
        }
      } catch (err) {
        console.warn('[Outbox] Errore sincronizzazione elemento accodato:', err);
      }
    }
    const remaining = getOutboxQueue();
    setSyncStatus(remaining.length === 0 ? 'synced' : 'offline');
  }, [currentUser]);

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
    if (!gameToSync) return false;
    setSyncStatus('syncing');
    let ok = false;
    try {
      ok = await syncGameToCloud(gameToSync, currentUser, force);
    } catch (err) {
      console.warn('[syncWithStatus] Errore sincronizzazione cloud:', err?.message || err);
      ok = false;
    }
    if (!ok) {
      addToOutboxQueue(gameToSync);
    } else {
      removeFromOutboxQueue(gameToSync.id);
    }
    setSyncStatus(ok ? 'synced' : 'offline');
    return ok;
  }, [currentUser]);

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

  // 2. Isolamento dati storico partite per account utente
  useEffect(() => {
    const userKey = currentUser ? currentUser.uid : 'guest';
    let cancelled = false;

    Promise.resolve().then(() => {
      if (!cancelled) {
        setGamesHistory(getGamesHistory(userKey));
      }
    });

    const unsubHistory = subscribeToCloudGamesHistory(currentUser, (cloudHistory) => {
      if (Array.isArray(cloudHistory)) {
        const localGames = getGamesHistory(userKey);
        const map = new Map();
        localGames.forEach(g => { if (g && g.id) map.set(g.id, g); });
        cloudHistory.forEach(g => { if (g && g.id) map.set(g.id, g); });
        const merged = Array.from(map.values()).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

        setGamesHistory(merged);
        safeSetItem(getHistoryKey(userKey), JSON.stringify(merged));
      }
    });

    return () => {
      cancelled = true;
      unsubHistory();
    };
  }, [currentUser]);

  // 3. Ascolto real-time della partita attiva da Firestore (Multi-device live sync)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlGameId = params.get('game');
    const targetId = urlGameId || activeGame?.id;

    if (!targetId) return;

    if (currentUser) {
      joinCloudGame(targetId, currentUser);
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
  }, [activeGame?.id, currentUser, customAlert]);

  // Avvio nuova partita
  const handleStartGame = (newGame) => {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('burraco_table_closed_explicitly');
    }
    const userKey = currentUser ? currentUser.uid : 'guest';
    if (activeGame && activeGame.rounds && activeGame.rounds.length > 0) {
      const updatedHistory = archiveCurrentGame(activeGame, userKey);
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
    const registeredPlayerUids = currentUser ? [currentUser.uid] : [];
    const registeredPlayerEmails = currentUser?.email ? [currentUser.email] : [];
    const pendingInviteFriends = [];

    if (currentUser && friendsList.length > 0) {
      friendsList.forEach(friend => {
        const friendName = friend.displayName || friend.email;
        const isInGame = allPlayers.some(
          p => p.toLowerCase() === friendName.toLowerCase() || p.toLowerCase() === (friend.email || '').toLowerCase()
        );
        if (isInGame) {
          if (friend.isCloseFriend) {
            // ⭐ Amico Stretto: entra direttamente al tavolo senza dover attendere invito
            if (friend.uid && !registeredPlayerUids.includes(friend.uid)) registeredPlayerUids.push(friend.uid);
            if (friend.email && !registeredPlayerEmails.includes(friend.email)) registeredPlayerEmails.push(friend.email);
          } else {
            // 👤 Amico Normale: deve accettare l'invito prima di entrare nel tavolo
            pendingInviteFriends.push(friend);
          }
        }
      });
    }

    const author = currentUser ? { uid: currentUser.uid, name: currentUser.displayName } : null;
    let initialChain = null;
    try {
      initialChain = migrateLegacyGameToLedger(newGame, author);
    } catch (chainErr) {
      console.warn('Avviso inizializzazione ledger:', chainErr);
    }

    const gameWithOwnership = {
      ...newGame,
      ownerUid: currentUser ? currentUser.uid : null,
      ownerEmail: currentUser?.email || null,
      ownerName: currentUser?.displayName || null,
      playerUids: registeredPlayerUids,
      playerEmails: registeredPlayerEmails,
      ledgerChain: initialChain,
      ledgerLastHash: initialChain && initialChain.length > 0 ? initialChain[initialChain.length - 1].hash : null,
    };

    setActiveGame(gameWithOwnership);
    saveActiveGame(gameWithOwnership);

    // Salva subito nella cronologia locale per non perdere mai la partita appena avviata
    const currentHistory = getGamesHistory(userKey);
    const updatedHistory = [gameWithOwnership, ...currentHistory.filter(g => g.id !== gameWithOwnership.id)];
    setGamesHistory(updatedHistory);
    safeSetItem(getHistoryKey(userKey), JSON.stringify(updatedHistory));

    // Sincronizza IMMEDIATAMENTE e incondizionatamente su Firestore nel Cloud (force = true)
    syncWithStatus(gameWithOwnership, true);

    // Invia inviti di gioco SOLO agli Amici Normali (gli Amici Stretti sono già dentro)
    if (currentUser && pendingInviteFriends.length > 0) {
      pendingInviteFriends.forEach(friend => {
        const friendName = friend.displayName || friend.email;
        const teamName = (newGame.team1?.players || []).some(p => p.toLowerCase() === friendName.toLowerCase())
          ? newGame.team1?.name
          : (newGame.team2?.players || []).some(p => p.toLowerCase() === friendName.toLowerCase())
          ? newGame.team2?.name
          : newGame.team3?.name || 'In Partita';

        sendGameInvite(currentUser, friend, gameWithOwnership, teamName).catch(err => {
          console.warn('Avviso invio notifica partita:', err);
        });
      });
    }
  };

  // Salva o aggiorna una mano
  const handleSaveRound = (roundData) => {
    if (!activeGame) return;

    let updatedRounds;
    const existingIndex = (activeGame.rounds || []).findIndex(
      r => r.roundNumber === roundData.roundNumber
    );

    if (existingIndex >= 0) {
      updatedRounds = [...activeGame.rounds];
      updatedRounds[existingIndex] = roundData;
    } else {
      updatedRounds = [...(activeGame.rounds || []), roundData];
    }

    let t1Total = 0;
    let t2Total = 0;
    let t3Total = 0;
    const isTrio = activeGame.mode === 'trio';

    updatedRounds.forEach(r => {
      t1Total += r.team1Score || 0;
      t2Total += r.team2Score || 0;
      t3Total += r.team3Score || 0;
    });

    const target = activeGame.targetScore || 2505;
    let winner = null;
    let shouldCelebrate = false;

    if (isTrio) {
      if (t1Total >= target || t2Total >= target || t3Total >= target) {
        if (t1Total >= t2Total && t1Total >= t3Total) winner = 'team1';
        else if (t2Total >= t1Total && t2Total >= t3Total) winner = 'team2';
        else winner = 'team3';
        shouldCelebrate = true;
      }
    } else {
      if (t1Total >= target || t2Total >= target) {
        winner = t1Total >= t2Total ? 'team1' : 'team2';
        shouldCelebrate = true;
      }
    }

    const author = currentUser ? { uid: currentUser.uid, name: currentUser.displayName } : null;
    let chain = null;
    try {
      chain = migrateLegacyGameToLedger(activeGame, author);
      if (chain) {
        chain = appendBlock(chain, EVENT_TYPES.ROUND_ADDED, roundData, author);
      }
    } catch (chainErr) {
      console.warn('Avviso registrazione blocco ledger round:', chainErr);
    }

    const isFinished = Boolean(winner);
    const updatedGame = {
      ...activeGame,
      rounds: updatedRounds,
      winner: winner || null,
      isFinished,
      completedAt: isFinished ? (activeGame.completedAt || new Date().toISOString()) : null,
      ledgerChain: chain || activeGame.ledgerChain || null,
      ledgerLastHash: chain && chain.length > 0 ? chain[chain.length - 1].hash : (activeGame.ledgerLastHash || null),
    };

    if (isFinished) {
      updatedGame.telemetry = computeGameTelemetry(updatedGame, {
        offlineEventsCount: offlineEventsCountRef.current
      });
    }

    setActiveGame(updatedGame);
    saveActiveGame(updatedGame);
    syncWithStatus(updatedGame, true);

    try {
      const userKey = currentUser ? currentUser.uid : 'guest';
      const history = getGamesHistory(userKey);
      const hIndex = history.findIndex(g => g.id === updatedGame.id);
      if (hIndex >= 0) {
        const newHistory = [...history];
        newHistory[hIndex] = updatedGame;
        safeSetItem(getHistoryKey(userKey), JSON.stringify(newHistory));
        setGamesHistory(newHistory);
      }
    } catch (histErr) {
      console.warn('Errore salvataggio storico locale:', histErr);
    }

    if (activeGame.tournamentMatchId && activeTournament?.rounds) {
      try {
        const tournUpdatedRounds = (activeTournament.rounds || []).map(r => ({
          ...r,
          matches: (r.matches || []).map(m => {
            if (m.id === activeGame.tournamentMatchId) {
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
        handleUpdateTournament({ ...activeTournament, rounds: tournUpdatedRounds });
      } catch (tournErr) {
        console.warn('Errore sync match torneo:', tournErr);
      }
    }

    if (shouldCelebrate) {
      try {
        onCelebrate();
      } catch (celErr) {
        console.warn('Errore celebrazione vittoria:', celErr);
      }
    }
  };

  // Annulla l'ultima mano
  const handleDeleteLastRound = async (customConfirm) => {
    if (!activeGame || !activeGame.rounds || activeGame.rounds.length === 0) return;
    const ok = typeof customConfirm === 'function'
      ? await customConfirm({
          title: 'Annulla Ultima Mano',
          message: "Vuoi davvero cancellare l'ultima mano inserita dal tabellone?",
          confirmText: 'Sì, annulla',
          variant: 'danger'
        })
      : window.confirm("Vuoi davvero cancellare l'ultima mano inserita?");
    if (!ok) return;

    const updatedRounds = activeGame.rounds.slice(0, -1);
    const author = currentUser ? { uid: currentUser.uid, name: currentUser.displayName } : null;
    let chain = null;
    try {
      chain = migrateLegacyGameToLedger(activeGame, author);
      if (chain) {
        chain = appendBlock(chain, EVENT_TYPES.ROUND_REVERTED, { roundNumber: activeGame.rounds?.length }, author);
      }
    } catch (chainErr) {
      console.warn('Avviso registrazione blocco revert ledger:', chainErr);
    }

    const updatedGame = {
      ...activeGame,
      rounds: updatedRounds,
      winner: null,
      isFinished: false,
      ledgerChain: chain || activeGame.ledgerChain || null,
      ledgerLastHash: chain && chain.length > 0 ? chain[chain.length - 1].hash : (activeGame.ledgerLastHash || null),
    };

    setActiveGame(updatedGame);
    saveActiveGame(updatedGame);
    syncWithStatus(updatedGame, true);

    const userKey = currentUser ? currentUser.uid : 'guest';
    const history = getGamesHistory(userKey);
    const hIndex = history.findIndex(g => g.id === updatedGame.id);
    if (hIndex >= 0) {
      const newHistory = [...history];
      newHistory[hIndex] = updatedGame;
      safeSetItem(getHistoryKey(userKey), JSON.stringify(newHistory));
      setGamesHistory(newHistory);
    }
  };

  // Cancella una specifica mano dal tabellone (foglio segnapunti)
  const handleDeleteRound = async (roundNumber, customConfirm) => {
    if (!activeGame || !activeGame.rounds || activeGame.rounds.length === 0) return;

    const roundIndex = (activeGame.rounds || []).findIndex(
      r => r.roundNumber === roundNumber
    );
    if (roundIndex === -1) return;

    const targetRound = activeGame.rounds[roundIndex];
    const isTrio = activeGame.mode === 'trio';
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

    // Rimuovi la mano e riallinea i numeri di mano (1, 2, 3...)
    const remainingRounds = activeGame.rounds
      .filter((_, idx) => idx !== roundIndex)
      .map((r, newIdx) => ({
        ...r,
        roundNumber: newIdx + 1
      }));

    // Ricalcola totali e traguardo
    let t1Total = 0;
    let t2Total = 0;
    let t3Total = 0;
    remainingRounds.forEach(r => {
      t1Total += Number(r.team1Score) || 0;
      t2Total += Number(r.team2Score) || 0;
      t3Total += Number(r.team3Score) || 0;
    });

    const target = activeGame.targetScore || 2505;
    const isTargetReached = isTrio
      ? (t1Total >= target || t2Total >= target || t3Total >= target)
      : (t1Total >= target || t2Total >= target);

    let winner = null;
    if (isTargetReached) {
      if (isTrio) {
        if (t1Total >= t2Total && t1Total >= t3Total) winner = 'team1';
        else if (t2Total >= t1Total && t2Total >= t3Total) winner = 'team2';
        else winner = 'team3';
      } else {
        winner = t1Total >= t2Total ? 'team1' : 'team2';
      }
    }

    const author = currentUser ? { uid: currentUser.uid, name: currentUser.displayName } : null;
    let chain = null;
    try {
      chain = migrateLegacyGameToLedger(activeGame, author);
      if (chain) {
        chain = appendBlock(chain, EVENT_TYPES.ROUND_REVERTED, { roundNumber }, author);
      }
    } catch (chainErr) {
      console.warn('Avviso registrazione blocco revert ledger:', chainErr);
    }

    const updatedGame = {
      ...activeGame,
      rounds: remainingRounds,
      winner,
      isFinished: isTargetReached,
      ledgerChain: chain || activeGame.ledgerChain || null,
      ledgerLastHash: chain && chain.length > 0 ? chain[chain.length - 1].hash : (activeGame.ledgerLastHash || null),
    };

    setActiveGame(updatedGame);
    saveActiveGame(updatedGame);
    syncWithStatus(updatedGame, true);

    const userKey = currentUser ? currentUser.uid : 'guest';
    const history = getGamesHistory(userKey);
    const hIndex = history.findIndex(g => g.id === updatedGame.id);
    if (hIndex >= 0) {
      const newHistory = [...history];
      newHistory[hIndex] = updatedGame;
      safeSetItem(getHistoryKey(userKey), JSON.stringify(newHistory));
      setGamesHistory(newHistory);
    }
  };

  // Aggiorna squadre
  const handleUpdateTeams = (updatedTeam1, updatedTeam2, updatedTeam3) => {
    if (!activeGame) return;

    const author = currentUser ? { uid: currentUser.uid, name: currentUser.displayName } : null;
    let chain = null;
    try {
      chain = migrateLegacyGameToLedger(activeGame, author);
      if (chain) {
        chain = appendBlock(chain, EVENT_TYPES.TEAMS_UPDATED, {
          team1: updatedTeam1,
          team2: updatedTeam2,
          team3: activeGame.mode === 'trio' && updatedTeam3 ? updatedTeam3 : null,
        }, author);
      }
    } catch (chainErr) {
      console.warn('Avviso teams updated ledger:', chainErr);
    }

    const updatedGame = {
      ...activeGame,
      team1: updatedTeam1,
      team2: updatedTeam2,
      ...(activeGame.mode === 'trio' && updatedTeam3 ? { team3: updatedTeam3 } : {}),
      ledgerChain: chain || activeGame.ledgerChain || null,
      ledgerLastHash: chain && chain.length > 0 ? chain[chain.length - 1].hash : (activeGame.ledgerLastHash || null),
    };

    setActiveGame(updatedGame);
    saveActiveGame(updatedGame);
    syncWithStatus(updatedGame, true);

    const userKey = currentUser ? currentUser.uid : 'guest';
    const history = getGamesHistory(userKey);
    const hIndex = history.findIndex(g => g.id === updatedGame.id);
    if (hIndex >= 0) {
      const newHistory = [...history];
      newHistory[hIndex] = updatedGame;
      safeSetItem(getHistoryKey(userKey), JSON.stringify(newHistory));
      setGamesHistory(newHistory);
    }
  };

  // Conclude la partita
  const handleEndGame = () => {
    if (!activeGame) return;
    const isTrio = activeGame.mode === 'trio';
    const t1Total = (activeGame.rounds || []).reduce((acc, r) => acc + (r.team1Score || 0), 0);
    const t2Total = (activeGame.rounds || []).reduce((acc, r) => acc + (r.team2Score || 0), 0);
    const t3Total = (activeGame.rounds || []).reduce((acc, r) => acc + (r.team3Score || 0), 0);

    let winner = 'team1';
    if (isTrio) {
      if (t1Total >= t2Total && t1Total >= t3Total) winner = 'team1';
      else if (t2Total >= t1Total && t2Total >= t3Total) winner = 'team2';
      else winner = 'team3';
    } else {
      winner = t1Total >= t2Total ? 'team1' : 'team2';
    }

    const author = currentUser ? { uid: currentUser.uid, name: currentUser.displayName } : null;
    let chain = null;
    try {
      chain = migrateLegacyGameToLedger(activeGame, author);
      if (chain) {
        chain = appendBlock(chain, EVENT_TYPES.GAME_FINISHED, { winner }, author);
      }
    } catch (chainErr) {
      console.warn('Avviso game finished ledger:', chainErr);
    }

    const updatedGame = {
      ...activeGame,
      winner,
      isFinished: true,
      completedAt: new Date().toISOString(),
      ledgerChain: chain || activeGame.ledgerChain || null,
      ledgerLastHash: chain && chain.length > 0 ? chain[chain.length - 1].hash : (activeGame.ledgerLastHash || null),
    };
    updatedGame.telemetry = computeGameTelemetry(updatedGame, {
      offlineEventsCount: offlineEventsCountRef.current
    });

    setActiveGame(updatedGame);
    saveActiveGame(updatedGame);
    syncWithStatus(updatedGame, true);

    if (activeGame.tournamentMatchId && activeTournament?.rounds) {
      const winnerTeamId = winner === 'team1' ? activeGame.team1?.id : activeGame.team2?.id;
      const tournUpdatedRounds = activeTournament.rounds.map(r => ({
        ...r,
        matches: r.matches.map(m => {
          if (m.id === activeGame.tournamentMatchId) {
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
      handleUpdateTournament({ ...activeTournament, rounds: tournUpdatedRounds });
    }

    const userKey = currentUser ? currentUser.uid : 'guest';
    const updatedHistory = archiveCurrentGame(updatedGame, userKey);
    setGamesHistory(updatedHistory);

    if (currentUser) {
      const stats = computeUserCareerStats(currentUser, updatedHistory, updatedGame);
      if (stats) {
        updateUserCareerStats(currentUser.uid, stats).catch(err => {
          console.warn('Avviso aggiornamento careerStats cloud:', err);
        });
      }
    }

    onCelebrate();
  };

  // Rivincita
  const handleRematch = () => {
    if (!activeGame) return;
    const userKey = currentUser ? currentUser.uid : 'guest';
    const updatedHistory = archiveCurrentGame(activeGame, userKey);
    setGamesHistory(updatedHistory);
    if (updatedHistory && updatedHistory[0]) {
      syncWithStatus(updatedHistory[0], true);
    }
    if (currentUser) {
      const stats = computeUserCareerStats(currentUser, updatedHistory, activeGame);
      if (stats) {
        updateUserCareerStats(currentUser.uid, stats).catch(err => {
          console.warn('Avviso aggiornamento careerStats cloud:', err);
        });
      }
    }

    const rematchGame = {
      id: 'game_' + Date.now(),
      createdAt: new Date().toISOString(),
      mode: activeGame.mode,
      allowSemipulito: activeGame.allowSemipulito,
      targetScore: activeGame.targetScore,
      team1: activeGame.team1,
      team2: activeGame.team2,
      ...(activeGame.mode === 'trio' ? { team3: activeGame.team3 } : {}),
      rounds: [],
      winner: null,
      isFinished: false,
      ownerUid: activeGame.ownerUid || (currentUser ? currentUser.uid : null),
      ownerEmail: activeGame.ownerEmail || currentUser?.email || null,
      ownerName: activeGame.ownerName || currentUser?.displayName || null,
      playerUids: activeGame.playerUids || (currentUser ? [currentUser.uid] : []),
      playerEmails: activeGame.playerEmails || (currentUser?.email ? [currentUser.email] : []),
    };

    setActiveGame(rematchGame);
    saveActiveGame(rematchGame);
    syncWithStatus(rematchGame, true);
  };

  // Archivia e prepara nuova partita pulita
  const handleArchiveAndNew = (onOpenNewGame) => {
    if (activeGame) {
      const userKey = currentUser ? currentUser.uid : 'guest';
      const isTrio = activeGame.mode === 'trio';
      const t1Total = (activeGame.rounds || []).reduce((acc, r) => acc + (r.team1Score || 0), 0);
      const t2Total = (activeGame.rounds || []).reduce((acc, r) => acc + (r.team2Score || 0), 0);
      const t3Total = (activeGame.rounds || []).reduce((acc, r) => acc + (r.team3Score || 0), 0);

      let winner = activeGame.winner;
      if (!winner) {
        if (isTrio) {
          if (t1Total >= t2Total && t1Total >= t3Total) winner = 'team1';
          else if (t2Total >= t1Total && t2Total >= t3Total) winner = 'team2';
          else winner = 'team3';
        } else {
          winner = t1Total >= t2Total ? 'team1' : 'team2';
        }
      }

      const finishedGame = {
        ...activeGame,
        winner,
        isFinished: true,
        completedAt: activeGame.completedAt || new Date().toISOString(),
      };

      const updatedHistory = archiveCurrentGame(finishedGame, userKey);
      setGamesHistory(updatedHistory);
      syncWithStatus(finishedGame, true);

      if (currentUser) {
        const stats = computeUserCareerStats(currentUser, updatedHistory, finishedGame);
        if (stats) {
          updateUserCareerStats(currentUser.uid, stats).catch(err => {
            console.warn('Avviso aggiornamento careerStats cloud:', err);
          });
        }
      }
    }

    if (window.location.search.includes('game=')) {
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
  };

  // Chiudi tavolo di gioco (sospendi e torna alla schermata principale)
  const handleCloseTable = async (customConfirm) => {
    if (!activeGame) return;

    const hasRounds = activeGame.rounds && activeGame.rounds.length > 0;
    const ok = typeof customConfirm === 'function'
      ? await customConfirm({
          title: 'Chiudi Tavolo',
          message: hasRounds
            ? `Vuoi chiudere questo tavolo? La partita corrente (${activeGame.rounds.length} mani) rimarrà salvata al sicuro nell'archivio cloud e potrai riprenderla quando vuoi.`
            : 'Vuoi chiudere questo tavolo e tornare alla schermata iniziale?',
          confirmText: 'Chiudi Tavolo',
          cancelText: 'Continua a giocare',
          variant: 'warning'
        })
      : window.confirm('Vuoi chiudere questo tavolo?');

    if (!ok) return;

    // 1. Marca il tavolo come chiuso nel cloud per avvisare gli altri dispositivi collegati
    const closedGame = {
      ...activeGame,
      tableClosed: true,
      telemetry: computeGameTelemetry({ ...activeGame, tableClosed: true }, {
        offlineEventsCount: offlineEventsCountRef.current
      })
    };
    await syncWithStatus(closedGame, true);

    // 2. Salva la partita nello storico locale
    const userKey = currentUser ? currentUser.uid : 'guest';
    const currentHistory = getGamesHistory(userKey);
    const updatedHistory = [closedGame, ...currentHistory.filter(g => g.id !== closedGame.id)];
    setGamesHistory(updatedHistory);
    safeSetItem(getHistoryKey(userKey), JSON.stringify(updatedHistory));

    // 3. Rimuovi la partita attiva locale e memorizza che il tavolo è stato chiuso intenzionalmente
    saveActiveGame(null);
    setActiveGame(null);
    setIsCloudJoined(false);
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('burraco_table_closed_explicitly', 'true');
    }

    // 4. Rimuovi eventuale parametro ?game= dall'URL
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('game');
      window.history.replaceState({}, '', url.pathname);
    } catch {
      // ignore
    }
  };

  // Scollegati dal tavolo condiviso
  const handleLeaveCloudTable = async (customConfirm) => {
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
  };

  // Eliminazione partita dallo storico
  const handleDeleteGameHistory = (gameId) => {
    const userKey = currentUser ? currentUser.uid : 'guest';
    const updated = deleteGameFromHistory(gameId, userKey);
    setGamesHistory(updated);
    deleteGameFromCloud(gameId).catch((err) => {
      console.warn('Errore eliminazione partita cloud:', err?.message || err);
    });
  };

  // Condivisione WhatsApp / Appunti
  const handleShareGame = () => {
    if (!activeGame) return;
    const isTrio = activeGame.mode === 'trio';
    const t1Total = (activeGame.rounds || []).reduce((acc, r) => acc + (r.team1Score || 0), 0);
    const t2Total = (activeGame.rounds || []).reduce((acc, r) => acc + (r.team2Score || 0), 0);
    const t3Total = (activeGame.rounds || []).reduce((acc, r) => acc + (r.team3Score || 0), 0);

    let text;
    if (isTrio) {
      text = `🃏 Burraco a 3 Score:
♦ ${activeGame.team1.name} (${(activeGame.team1.players || []).join(' & ')}): ${t1Total} pt
♠ ${activeGame.team2.name} (${(activeGame.team2.players || []).join(' & ')}): ${t2Total} pt
♥ ${activeGame.team3?.name || 'Giocatore 3'} (${(activeGame.team3?.players || []).join(' & ')}): ${t3Total} pt
Mani giocate: ${activeGame.rounds.length} (Traguardo: ${activeGame.targetScore} pt)`;
    } else {
      text = `🃏 Burraco Score:
♦ ${activeGame.team1.name} (${activeGame.team1.players.join(' & ')}): ${t1Total} pt
♠ ${activeGame.team2.name} (${activeGame.team2.players.join(' & ')}): ${t2Total} pt
Mani giocate: ${activeGame.rounds.length} (Traguardo: ${activeGame.targetScore} pt)`;
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
  };

  // Riprendi partita passata o tavolo da PIN
  const handleResumeGame = async (gameOrId) => {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('burraco_table_closed_explicitly');
    }
    let targetGame = gameOrId;
    if (typeof gameOrId === 'string') {
      targetGame = await findGameByPinOrId(gameOrId);
      if (!targetGame) {
        const userKey = currentUser ? currentUser.uid : 'guest';
        targetGame = (getGamesHistory(userKey) || []).find(g => g?.id === gameOrId);
      }
    }
    if (!targetGame || typeof targetGame !== 'object' || !targetGame.id) {
      console.warn('handleResumeGame: partita non valida', gameOrId);
      return;
    }

    const resumedGame = {
      ...targetGame,
      tableClosed: false,
    };
    setActiveGame(resumedGame);
    saveActiveGame(resumedGame);
    setIsCloudJoined(true);

    try {
      const url = new URL(window.location.href);
      url.searchParams.set('game', resumedGame.id);
      window.history.replaceState({}, '', url.toString());
    } catch {}

    syncWithStatus(resumedGame, true);
  };

  // Salvataggio manuale forzato con feedback (Cloud Firestore + Locale)
  const handleManualSave = useCallback(async () => {
    if (!activeGame) return { success: false, reason: 'no_game' };

    const userKey = currentUser ? currentUser.uid : 'guest';
    // 1. Salva subito in localStorage (stato attivo e storico)
    saveActiveGame(activeGame);
    setGamesHistory(prev => {
      const filtered = (prev || []).filter(g => g?.id !== activeGame.id);
      const updated = [activeGame, ...filtered];
      safeSetItem(getHistoryKey(userKey), JSON.stringify(updated));
      return updated;
    });

    // 2. Sincronizza nel Cloud Firestore (force: true)
    setSyncStatus('syncing');
    try {
      const ok = await syncGameToCloud(activeGame, currentUser, true);
      setSyncStatus(ok ? 'synced' : 'offline');
      return { success: ok, isOffline: !ok };
    } catch (err) {
      console.warn('Errore salvataggio manuale nel cloud:', err);
      setSyncStatus('offline');
      return { success: false, isOffline: true, error: err };
    }
  }, [activeGame, currentUser]);

  // Importazione dati
  const handleDataImported = (importedGames) => {
    const userKey = currentUser ? currentUser.uid : 'guest';
    const localGames = getGamesHistory(userKey);
    if (Array.isArray(importedGames)) {
      const map = new Map();
      localGames.forEach(g => { if (g && g.id) map.set(g.id, g); });
      importedGames.forEach(g => { if (g && g.id) map.set(g.id, g); });
      const merged = Array.from(map.values()).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

      localStorage.setItem(getHistoryKey(userKey), JSON.stringify(merged));
      setGamesHistory(merged);
    } else {
      setGamesHistory(localGames);
    }
    const current = getActiveGame();
    if (current) setActiveGame(current);
  };

  // Gioca incontro torneo sul tavolo principale
  const handlePlayTournamentMatch = (match, tournament, onTournamentMatchStarted) => {
    if (!match || !tournament) return;

    if (activeGame && activeGame.rounds && activeGame.rounds.length > 0 && activeGame.tournamentMatchId !== match.id) {
      const userKey = currentUser ? currentUser.uid : 'guest';
      const updatedHistory = archiveCurrentGame(activeGame, userKey);
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
      handleUpdateTournament({ ...tournament, rounds: updatedRounds });
    }

    setActiveGame(tournamentGame);
    saveActiveGame(tournamentGame);
    syncWithStatus(tournamentGame, false);

    if (typeof onTournamentMatchStarted === 'function') {
      onTournamentMatchStarted();
    }
  };

  // Sfida un amico
  const handleChallengeFriend = (friend, onOpenNewGameModal) => {
    const myName = currentUser?.displayName || 'Io';
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
  };

  return {
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
  };
}
