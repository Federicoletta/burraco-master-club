import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAlert } from '../context/ConfirmContext';
import {
  getActiveGame,
  saveActiveGame,
  getGamesHistory,
  getHistoryKey,
  archiveCurrentGame,
  deleteGameFromHistory,
  computeUserCareerStats,
  safeSetItem
} from '../utils/storage';
import {
  syncGameToCloud,
  subscribeToCloudGame,
  subscribeToCloudGamesHistory,
  deleteGameFromCloud,
  joinCloudGame,
  fetchTablePlayers,
  updateUserCareerStats
} from '../services/firebase';
import { sendGameInvite } from '../services/social';

export function useBurracoGame({
  currentUser,
  friendsList = [],
  activeTournament = null,
  handleUpdateTournament = () => {},
  onCelebrate = () => {},
}) {
  const customAlert = useAlert();
  const [activeGame, setActiveGame] = useState(null);
  const [gamesHistory, setGamesHistory] = useState([]);
  const [isCloudJoined, setIsCloudJoined] = useState(false);
  const [tablePlayers, setTablePlayers] = useState([]);
  const [newGameInitialSetup, setNewGameInitialSetup] = useState(null);
  const [syncStatus, setSyncStatus] = useState(() => (typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'synced'));
  const lastFetchedRosterKeyRef = useRef('');

  useEffect(() => {
    const handleOnline = () => setSyncStatus('synced');
    const handleOffline = () => setSyncStatus('offline');
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const syncWithStatus = useCallback(async (gameToSync, force = false) => {
    if (!gameToSync) return false;
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setSyncStatus('offline');
      return false;
    }
    setSyncStatus('syncing');
    const ok = await syncGameToCloud(gameToSync, currentUser, force);
    setSyncStatus(ok ? 'synced' : (typeof navigator !== 'undefined' && navigator.onLine ? 'synced' : 'offline'));
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

  // 1. Caricamento iniziale & Controllo Link Condiviso (?game=...)
  useEffect(() => {
    const storedHistory = getGamesHistory();
    setGamesHistory(storedHistory);

    const params = new URLSearchParams(window.location.search);
    const urlGameId = params.get('game');

    if (urlGameId) {
      setIsCloudJoined(true);
    } else {
      const current = getActiveGame();
      if (current) {
        // Sanificazione vecchi nomi di prova di default se 0 round
        const mock = ['Marco', 'Anna', 'Luca', 'Sofia'];
        let needsClean = false;
        let cleanedGame = { ...current };
        if (!current.rounds || current.rounds.length === 0) {
          const t1 = current.team1?.players || [];
          const t2 = current.team2?.players || [];
          if (t1.some(p => mock.includes(p)) || t2.some(p => mock.includes(p))) {
            cleanedGame.team1 = {
              ...current.team1,
              players: t1.filter(p => !mock.includes(p))
            };
            cleanedGame.team2 = {
              ...current.team2,
              players: t2.filter(p => !mock.includes(p))
            };
            needsClean = true;
          }
        }
        if (needsClean) {
          saveActiveGame(cleanedGame);
          setActiveGame(cleanedGame);
        } else {
          setActiveGame(current);
        }
      } else {
        // Se non c'è una partita attiva in localStorage, controlla se c'è una partita in sospeso nello storico
        const pendingGame = (storedHistory || []).find(g => g && !g.isFinished && Array.isArray(g.rounds) && g.rounds.length > 0);
        if (pendingGame) {
          setActiveGame(pendingGame);
          saveActiveGame(pendingGame);
        } else {
          const initialGame = {
            id: 'game_' + Date.now(),
            createdAt: new Date().toISOString(),
            mode: 'pairs',
            allowSemipulito: true,
            targetScore: 2505,
            team1: {
              name: 'Coppia 1',
              players: [],
            },
            team2: {
              name: 'Coppia 2',
              players: [],
            },
            rounds: [],
            winner: null,
            isFinished: false,
          };
          setActiveGame(initialGame);
          saveActiveGame(initialGame);
        }
      }
    }
  }, []);

  // 2. Isolamento dati storico partite per account utente
  useEffect(() => {
    const userKey = currentUser ? currentUser.uid : 'guest';
    setGamesHistory(getGamesHistory(userKey));

    const unsubHistory = subscribeToCloudGamesHistory(currentUser, (cloudHistory) => {
      if (Array.isArray(cloudHistory)) {
        const localGames = getGamesHistory(userKey);
        const map = new Map();
        localGames.forEach(g => { if (g && g.id) map.set(g.id, g); });
        cloudHistory.forEach(g => { if (g && g.id) map.set(g.id, g); });
        const merged = Array.from(map.values()).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

        setGamesHistory(merged);
        safeSetItem(getHistoryKey(userKey), JSON.stringify(merged));

        // Se la partita attiva corrente ha 0 mani (es. dopo reset/reload/crash iPad),
        // ma nel cloud esiste una partita in sospeso recente dell'utente, ripristinala sul tavolo!
        setActiveGame(current => {
          if (!current || !current.rounds || current.rounds.length === 0) {
            const pendingCloudGame = merged.find(g => g && !g.isFinished && ((Array.isArray(g.rounds) && g.rounds.length > 0) || (g.createdAt && (Date.now() - new Date(g.createdAt).getTime() < 4 * 60 * 60 * 1000))));
            if (pendingCloudGame) {
              saveActiveGame(pendingCloudGame);
              return pendingCloudGame;
            }
          }
          return current;
        });
      }
    });

    return () => unsubHistory();
  }, [currentUser]);

  // 3. Ascolto real-time della partita attiva da Firestore (Multi-device live sync)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlGameId = params.get('game');
    const targetId = urlGameId || activeGame?.id;

    if (!targetId) return;

    if (urlGameId) {
      setIsCloudJoined(true);
    }

    if (currentUser) {
      joinCloudGame(targetId, currentUser);
    }

    const unsubscribe = subscribeToCloudGame(
      targetId, 
      (cloudGame) => {
        if (cloudGame && cloudGame.id === targetId) {
          setActiveGame(prev => {
            const prevRounds = Array.isArray(prev?.rounds) ? prev.rounds : [];
            const cloudRounds = Array.isArray(cloudGame.rounds) ? cloudGame.rounds : [];

            if (prev?.id === targetId && prevRounds.length > cloudRounds.length) {
              console.warn(`[Multiplayer Sync] Stato locale ha ${prevRounds.length} mani, cloud ne ha ${cloudRounds.length}. Mantengo lo stato locale.`);
              syncWithStatus(prev, true);
              return prev;
            }

            saveActiveGame(cloudGame);
            return cloudGame;
          });

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
  }, [activeGame?.id, currentUser, customAlert, syncWithStatus]);

  // Avvio nuova partita
  const handleStartGame = (newGame) => {
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

    const registeredPlayerUids = currentUser ? [currentUser.uid] : [];
    const registeredPlayerEmails = currentUser?.email ? [currentUser.email] : [];

    if (currentUser && friendsList.length > 0) {
      friendsList.forEach(friend => {
        const friendName = friend.displayName || friend.email;
        const isInGame = allPlayers.some(
          p => p.toLowerCase() === friendName.toLowerCase() || p.toLowerCase() === (friend.email || '').toLowerCase()
        );
        if (isInGame) {
          if (friend.uid && !registeredPlayerUids.includes(friend.uid)) registeredPlayerUids.push(friend.uid);
          if (friend.email && !registeredPlayerEmails.includes(friend.email)) registeredPlayerEmails.push(friend.email);
        }
      });
    }

    const gameWithOwnership = {
      ...newGame,
      ownerUid: currentUser ? currentUser.uid : null,
      ownerEmail: currentUser?.email || null,
      ownerName: currentUser?.displayName || null,
      playerUids: registeredPlayerUids,
      playerEmails: registeredPlayerEmails
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

    // Invita amici registrati se presenti
    if (currentUser && friendsList.length > 0) {
      friendsList.forEach(friend => {
        const friendName = friend.displayName || friend.email;
        const isInGame = allPlayers.some(
          p => p.toLowerCase() === friendName.toLowerCase() || p.toLowerCase() === (friend.email || '').toLowerCase()
        );
        if (isInGame) {
          const teamName = (newGame.team1?.players || []).some(p => p.toLowerCase() === friendName.toLowerCase())
            ? newGame.team1?.name
            : (newGame.team2?.players || []).some(p => p.toLowerCase() === friendName.toLowerCase())
            ? newGame.team2?.name
            : newGame.team3?.name || 'In Partita';

          sendGameInvite(currentUser, friend, gameWithOwnership, teamName).catch(err => {
            console.warn('Avviso invio notifica partita:', err);
          });
        }
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

    const updatedGame = {
      ...activeGame,
      rounds: updatedRounds,
      winner: winner || (activeGame.isFinished ? activeGame.winner : null),
      isFinished: Boolean(winner) || activeGame.isFinished || false,
    };

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
    const updatedGame = {
      ...activeGame,
      rounds: updatedRounds,
      winner: null,
      isFinished: false,
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

    const updatedGame = {
      ...activeGame,
      team1: updatedTeam1,
      team2: updatedTeam2,
      ...(activeGame.mode === 'trio' && updatedTeam3 ? { team3: updatedTeam3 } : {}),
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

    const updatedGame = {
      ...activeGame,
      winner,
      isFinished: true,
      completedAt: new Date().toISOString(),
    };

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

    const cleanGame = {
      id: 'game_' + Date.now(),
      createdAt: new Date().toISOString(),
      mode: activeGame?.mode || 'pairs',
      allowSemipulito: activeGame?.allowSemipulito ?? true,
      targetScore: activeGame?.targetScore || 2505,
      team1: {
        name: 'Coppia 1',
        players: [],
      },
      team2: {
        name: 'Coppia 2',
        players: [],
      },
      rounds: [],
      winner: null,
      isFinished: false,
    };
    setActiveGame(cleanGame);
    saveActiveGame(cleanGame);

    if (typeof onOpenNewGame === 'function') {
      onOpenNewGame();
    }
  };

  // Scollegati dal tavolo condiviso
  const handleLeaveCloudTable = async (customConfirm) => {
    const ok = typeof customConfirm === 'function'
      ? await customConfirm({
          title: 'Scollegati dal Tavolo',
          message: 'Vuoi scollegarti da questo tavolo condiviso online e tornare alla tua partita locale?',
          confirmText: 'Sì, scollegati',
          variant: 'warning'
        })
      : window.confirm("Vuoi scollegarti da questo tavolo condiviso e tornare a una tua partita locale?");
    if (ok) {
      const url = new URL(window.location.href);
      url.searchParams.delete('game');
      window.history.replaceState({}, '', url.pathname);
      setIsCloudJoined(false);

      const newLocalGame = {
        id: 'game_' + Date.now(),
        createdAt: new Date().toISOString(),
        mode: 'pairs',
        allowSemipulito: true,
        targetScore: 2505,
        team1: {
          name: 'Coppia 1',
          players: [],
        },
        team2: {
          name: 'Coppia 2',
          players: [],
        },
        rounds: [],
        winner: null,
        isFinished: false,
      };
      setActiveGame(newLocalGame);
      saveActiveGame(newLocalGame);
      syncWithStatus(newLocalGame, false);
    }
  };

  // Eliminazione partita dallo storico
  const handleDeleteGameHistory = (gameId) => {
    const userKey = currentUser ? currentUser.uid : 'guest';
    const updated = deleteGameFromHistory(gameId, userKey);
    setGamesHistory(updated);
    deleteGameFromCloud(gameId);
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

  // Riprendi partita passata
  const handleResumeGame = (game) => {
    setActiveGame(game);
    saveActiveGame(game);
    syncWithStatus(game, true);
  };

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
    tablePlayers,
    setTablePlayers,
    newGameInitialSetup,
    setNewGameInitialSetup,
    handleStartGame,
    handleSaveRound,
    handleDeleteLastRound,
    handleUpdateTeams,
    handleEndGame,
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
