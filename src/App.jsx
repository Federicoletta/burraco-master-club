import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import ScoreBoard from './components/ScoreBoard';
import NewGameModal from './components/NewGameModal';
import RoundCalculatorModal from './components/RoundCalculatorModal';
import PlayersStatsModal from './components/PlayersStatsModal';
import HistoryModal from './components/HistoryModal';
import VictoryModal from './components/VictoryModal';
import CloudSyncModal from './components/CloudSyncModal';
import RulesModal from './components/RulesModal';
import EditTeamsModal from './components/EditTeamsModal';
import TournamentModal from './components/TournamentModal';
import UserProfileModal from './components/UserProfileModal';
import NotificationsModal from './components/NotificationsModal';
import NotificationToast from './components/NotificationToast';
import { sound } from './utils/soundEffects';
import { 
  sendFriendRequest,
  respondToFriendRequest,
  sendGameInvite,
  respondToGameInvite,
  subscribeToMyNotifications,
  subscribeToMyFriends,
  subscribeToClubUsers,
  removeFriend
} from './services/social';
import { 
  getActiveGame, 
  saveActiveGame, 
  getGamesHistory, 
  archiveCurrentGame, 
  deleteGameFromHistory,
  getStoredPlayers,
  savePlayerName,
  deletePlayerName,
  renamePlayer,
  setStoredPlayers,
  computeUserCareerStats
} from './utils/storage';
import { 
  syncGameToCloud, 
  subscribeToCloudGame, 
  syncPlayersToCloud,
  subscribeToCloudPlayers,
  subscribeToCloudGamesHistory,
  deleteGameFromCloud,
  syncTournamentToCloud,
  subscribeToCloudTournament,
  loginWithGoogle,
  logoutUser,
  subscribeToAuth,
  syncUserGuestsToCloud,
  subscribeToUserGuests,
  cleanupLegacyCloudDatabase,
  joinCloudGame,
  fetchTablePlayers,
  updateUserCareerStats,
  subscribeToFriendsLiveProfiles
} from './services/firebase';
import {
  getActiveTournament,
  saveActiveTournament,
  archiveTournament
} from './utils/tournament';
import { Cloud, Trophy } from 'lucide-react';

export default function App() {
  const [activeGame, setActiveGame] = useState(null);
  const [gamesHistory, setGamesHistory] = useState([]);
  const [playersList, setPlayersList] = useState([]);
  const [isCloudJoined, setIsCloudJoined] = useState(false);

  // Tournament state
  const [activeTournament, setActiveTournament] = useState(null);
  const [isTournamentOpen, setIsTournamentOpen] = useState(false);

  // User Auth & Profile state
  const [currentUser, setCurrentUser] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Social & Notifications state
  const [notifications, setNotifications] = useState([]);
  const [friendsList, setFriendsList] = useState([]);
  const [clubUsers, setClubUsers] = useState([]);
  const [friendsLiveProfiles, setFriendsLiveProfiles] = useState([]);
  const [tablePlayers, setTablePlayers] = useState([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [toastNotification, setToastNotification] = useState(null);
  const [newGameInitialSetup, setNewGameInitialSetup] = useState(null);
  const prevNotifIdsRef = useRef([]);

  // Modals state
  const [isNewGameOpen, setIsNewGameOpen] = useState(false);
  const [isRoundCalcOpen, setIsRoundCalcOpen] = useState(false);
  const [isPlayersOpen, setIsPlayersOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isVictoryOpen, setIsVictoryOpen] = useState(false);
  const [isCloudModalOpen, setIsCloudModalOpen] = useState(false);
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isEditTeamsOpen, setIsEditTeamsOpen] = useState(false);
  const [roundToEdit, setRoundToEdit] = useState(null);

  // 1. Caricamento iniziale & Controllo Link Condiviso (?game=...)
  useEffect(() => {
    const storedPlayers = getStoredPlayers();
    setPlayersList(storedPlayers);

    const storedHistory = getGamesHistory();
    setGamesHistory(storedHistory);

    // Carica eventuale torneo attivo
    const storedTournament = getActiveTournament();
    if (storedTournament) {
      setActiveTournament(storedTournament);
      syncTournamentToCloud(storedTournament);
    }

    // Controlla se l'utente sta aprendo un link condiviso
    const params = new URLSearchParams(window.location.search);
    const urlGameId = params.get('game');

    if (urlGameId) {
      setIsCloudJoined(true);
      // Lascia che il listener in tempo reale scarichi i dati del tavolo
    } else {
      const current = getActiveGame();
      if (current) {
        // Se la partita attiva ha 0 round registrati e contiene i vecchi nomi di prova di default, ripuliscili
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
        // Inizializza con una partita pulita pronta per giocare (senza nomi fittizi preimpostati)
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
  }, []);

  // 2. Ascolto in tempo reale stato autenticazione Google
  useEffect(() => {
    const unsubAuth = subscribeToAuth((user) => {
      setCurrentUser(user);
    });
    return () => unsubAuth();
  }, []);

  // 2b. Isolamento dati per account (Storico e Rubrica Ospiti)
  useEffect(() => {
    const userKey = currentUser ? currentUser.uid : 'guest';
    setPlayersList(getStoredPlayers(userKey));
    setGamesHistory(getGamesHistory(userKey));

    // Pulizia cloud automatica una-tantum dei vecchi dati legacy senza proprietario
    if (currentUser) {
      if (localStorage.getItem('burraco_legacy_cleaned_v2') !== 'done') {
        cleanupLegacyCloudDatabase().then((ok) => {
          if (ok) {
            localStorage.setItem('burraco_legacy_cleaned_v2', 'done');
            setGamesHistory([]);
            setPlayersList([]);
          }
        });
      }
    }

    // 1. Ascolto real-time storico partite isolato per l'utente loggato
    const unsubHistory = subscribeToCloudGamesHistory(currentUser, (cloudHistory) => {
      if (Array.isArray(cloudHistory)) {
        setGamesHistory(cloudHistory);
        localStorage.setItem(currentUser ? `burraco_history_${currentUser.uid}` : 'burraco_history_guest', JSON.stringify(cloudHistory));
      }
    });

    // 2. Ascolto real-time rubrica ospiti isolata per l'account
    let unsubGuests = () => {};
    if (currentUser) {
      unsubGuests = subscribeToUserGuests(currentUser.uid, (cloudGuests) => {
        const merged = setStoredPlayers(cloudGuests, currentUser.uid);
        setPlayersList(merged || cloudGuests);
      });
    } else {
      unsubGuests = subscribeToCloudPlayers((cloudPlayers) => {
        const merged = setStoredPlayers(cloudPlayers, 'guest');
        setPlayersList(merged || cloudPlayers);
      });
    }

    return () => {
      unsubHistory();
      unsubGuests();
    };
  }, [currentUser]);

  // 2c. Ascolto in tempo reale Notifiche Pendenti e Amici Confermati con Suono e Toast
  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      setFriendsList([]);
      setToastNotification(null);
      prevNotifIdsRef.current = [];
      return;
    }
    const unsubNotifs = subscribeToMyNotifications(currentUser, (notifs) => {
      if (Array.isArray(notifs)) {
        // Se la notifica del toast non è più pendente, chiudi automaticamente il banner
        setToastNotification(prevToast => {
          if (!prevToast) return null;
          const isStillPending = notifs.some(n => n.id === prevToast.id && n.status === 'pending');
          return isStillPending ? prevToast : null;
        });

        // Controlla se c'è una notifica nuova appena arrivata
        const newPendings = notifs.filter(
          n => !prevNotifIdsRef.current.includes(n.id) && n.status === 'pending'
        );
        if (newPendings.length > 0) {
          sound.playNotification();
          setToastNotification(newPendings[0]);
        }
        prevNotifIdsRef.current = notifs.map(n => n.id);
      }
      setNotifications(notifs);
    });
    const unsubFriends = subscribeToMyFriends(currentUser, (friends) => {
      setFriendsList(friends);
    });
    const unsubClub = subscribeToClubUsers(currentUser, (cUsers) => {
      setClubUsers(cUsers);
    });
    return () => {
      unsubNotifs();
      unsubFriends();
      unsubClub();
    };
  }, [currentUser]);

  // 2d. Sincronizzazione automatica statistiche di carriera su Cloud (per sé e per tutti i compagni del tavolo)
  useEffect(() => {
    if (!currentUser?.uid) return;
    try {
      // 1. Sincronizza le mie statistiche
      const myStats = computeUserCareerStats(currentUser, gamesHistory, activeGame);
      if (myStats) {
        updateUserCareerStats(currentUser.uid, myStats);
      }

      // 2. Sincronizza anche per tutti gli altri amici o utenti registrati presenti al tavolo
      const candidates = [...(friendsList || []), ...(tablePlayers || []), ...(friendsLiveProfiles || [])];
      const seenUids = new Set([currentUser.uid]);
      candidates.forEach(cand => {
        if (!cand || !cand.uid || seenUids.has(cand.uid)) return;
        seenUids.add(cand.uid);
        const candStats = computeUserCareerStats(cand, gamesHistory, activeGame);
        if (candStats && candStats.totalPoints > 0) {
          const existing = cand.careerStats || {};
          const merged = {
            totalPoints: Math.max(Number(existing.totalPoints) || 0, Number(candStats.totalPoints) || 0),
            gamesPlayed: Math.max(Number(existing.gamesPlayed) || 0, Number(candStats.gamesPlayed) || 0),
            gamesWon: Math.max(Number(existing.gamesWon) || 0, Number(candStats.gamesWon) || 0),
            winRate: Math.max(Number(existing.winRate) || 0, Number(candStats.winRate) || 0),
            cleanBurrachi: Math.max(Number(existing.cleanBurrachi) || 0, Number(candStats.cleanBurrachi) || 0),
            semiCleanBurrachi: Math.max(Number(existing.semiCleanBurrachi) || 0, Number(candStats.semiCleanBurrachi) || 0),
            dirtyBurrachi: Math.max(Number(existing.dirtyBurrachi) || 0, Number(candStats.dirtyBurrachi) || 0),
            closures: Math.max(Number(existing.closures) || 0, Number(candStats.closures) || 0),
            bestHandScore: Math.max(Number(existing.bestHandScore) || 0, Number(candStats.bestHandScore) || 0),
            trophiesCount: Math.max(Number(existing.trophiesCount) || 0, Number(candStats.trophiesCount) || 0),
          };
          updateUserCareerStats(cand.uid, merged);
        }
      });
    } catch (e) {
      console.warn('Sync career stats error:', e);
    }
  }, [currentUser, gamesHistory, activeGame?.rounds, friendsList, tablePlayers]);

  // 2e. Ascolto in tempo reale dei profili e statistiche live degli amici confermati
  useEffect(() => {
    if (!currentUser || !Array.isArray(friendsList) || friendsList.length === 0) {
      setFriendsLiveProfiles([]);
      return;
    }
    const unsub = subscribeToFriendsLiveProfiles(friendsList, (liveProfiles) => {
      setFriendsLiveProfiles(liveProfiles);
    });
    return () => {
      if (unsub) unsub();
    };
  }, [currentUser, friendsList]);

  // 3. Ascolto real-time della partita attiva da Firestore (Multi-device live sync)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlGameId = params.get('game');
    const targetId = urlGameId || activeGame?.id;

    if (!targetId) return;

    if (urlGameId) {
      setIsCloudJoined(true);
    }

    // Registra la presenza dell'utente autenticato al tavolo
    if (currentUser) {
      joinCloudGame(targetId, currentUser);
    }

    const unsubscribe = subscribeToCloudGame(
      targetId, 
      (cloudGame) => {
        if (cloudGame && cloudGame.id === targetId) {
          // Salvaguardia multi-dispositivo: se lo stato locale possiede più mani rispetto al cloud,
          // NON retrocedere cancellando le mani locali! Al contrario, mantieni le mani e aggiorna il cloud!
          setActiveGame(prev => {
            const prevRounds = Array.isArray(prev?.rounds) ? prev.rounds : [];
            const cloudRounds = Array.isArray(cloudGame.rounds) ? cloudGame.rounds : [];

            if (prev?.id === targetId && prevRounds.length > cloudRounds.length) {
              console.warn(`[Multiplayer Sync] Stato locale ha ${prevRounds.length} mani, cloud ne ha ${cloudRounds.length}. Mantengo lo stato locale e aggiorno il cloud.`);
              syncGameToCloud(prev, currentUser, true);
              return prev;
            }

            saveActiveGame(cloudGame);
            return cloudGame;
          });

          // Recupera i profili degli utenti collegati a questo tavolo in tempo reale
          if ((cloudGame.playerUids && cloudGame.playerUids.length > 0) || (cloudGame.playerEmails && cloudGame.playerEmails.length > 0)) {
            fetchTablePlayers(cloudGame.playerUids, cloudGame.playerEmails).then(players => {
              if (Array.isArray(players) && players.length > 0) {
                setTablePlayers(players);
              }
            });
          }

          // Se la partita ha giocatori non ancora nella rubrica, aggiungili automaticamente
          const gamePlayers = [
            ...(cloudGame.team1?.players || []),
            ...(cloudGame.team2?.players || []),
            ...(cloudGame.team3?.players || [])
          ].filter(Boolean);

          if (gamePlayers.length > 0) {
            let updated = false;
            const currentStored = getStoredPlayers();
            gamePlayers.forEach(p => {
              if (!currentStored.includes(p)) {
                savePlayerName(p);
                updated = true;
              }
            });
            if (updated) {
              const newList = getStoredPlayers();
              setPlayersList(newList);
              syncPlayersToCloud(newList);
            }
          }
        }
      },
      () => {
        // onNotFound: se il tavolo specificato nel link non esiste su Firestore
        if (urlGameId) {
          alert(`Il tavolo "${urlGameId}" non è stato trovato o è stato eliminato.`);
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
  }, [activeGame?.id, currentUser]);

  // 4. Ascolto real-time del torneo attivo da Firestore
  useEffect(() => {
    if (!activeTournament?.id) return;
    const unsubTournament = subscribeToCloudTournament(activeTournament.id, (cloudTourn) => {
      if (cloudTourn && cloudTourn.id === activeTournament.id) {
        setActiveTournament(cloudTourn);
        saveActiveTournament(cloudTourn);
      }
    });
    return () => unsubTournament();
  }, [activeTournament?.id]);

  // Gestione Torneo: Avvio, Aggiornamento, Conclusione
  const handleStartTournament = (newTournament) => {
    setActiveTournament(newTournament);
    saveActiveTournament(newTournament);
    syncTournamentToCloud(newTournament);
    // Salva automaticamente tutti i giocatori del torneo in rubrica isolata
    const allTournPlayers = (newTournament.teams || []).flatMap(t => t.players || []).filter(Boolean);
    if (allTournPlayers.length > 0) {
      const userKey = currentUser ? currentUser.uid : 'guest';
      allTournPlayers.forEach(p => savePlayerName(p, userKey));
      const updated = getStoredPlayers(userKey);
      setPlayersList(updated);
      if (currentUser) {
        syncUserGuestsToCloud(currentUser.uid, updated);
      } else {
        syncPlayersToCloud(updated);
      }
    }
  };

  const handleUpdateTournament = (updatedTournament) => {
    setActiveTournament(updatedTournament);
    saveActiveTournament(updatedTournament);
    syncTournamentToCloud(updatedTournament);
  };

  const handleFinishTournament = () => {
    if (!activeTournament) return;
    archiveTournament(activeTournament);
    const finished = {
      ...activeTournament,
      status: 'completed',
      completedAt: new Date().toISOString(),
    };
    syncTournamentToCloud(finished);
    setActiveTournament(null);
    saveActiveTournament(null);
  };

  // Gioca un incontro di torneo sul tabellone principale
  const handlePlayTournamentMatch = (match, tournament) => {
    if (!match || !tournament) return;

    // Se c'è una partita corrente con mani registrate che NON è questa partita di torneo, archiviala prima
    if (activeGame && activeGame.rounds && activeGame.rounds.length > 0 && activeGame.tournamentMatchId !== match.id) {
      const updatedHistory = archiveCurrentGame(activeGame);
      setGamesHistory(updatedHistory);
      if (updatedHistory && updatedHistory[0]) {
        syncGameToCloud(updatedHistory[0]);
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

    // Segna il match come in_progress nel torneo se non completato
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
      const updatedTourn = { ...tournament, rounds: updatedRounds };
      handleUpdateTournament(updatedTourn);
    }

    setActiveGame(tournamentGame);
    saveActiveGame(tournamentGame);
    syncGameToCloud(tournamentGame);
    setIsTournamentOpen(false);
  };


  // Avvio nuova partita
  const handleStartGame = (newGame) => {
    const userKey = currentUser ? currentUser.uid : 'guest';
    if (activeGame && activeGame.rounds && activeGame.rounds.length > 0) {
      const updatedHistory = archiveCurrentGame(activeGame, userKey);
      setGamesHistory(updatedHistory);
      if (updatedHistory && updatedHistory[0]) {
        syncGameToCloud(updatedHistory[0], currentUser);
      }
    }

    // Salva i nomi dei giocatori nella rubrica partecipanti SOLO se sono nomi reali inseriti
    const allPlayers = [
      ...(newGame.team1?.players || []),
      ...(newGame.team2?.players || []),
      ...(newGame.team3?.players || [])
    ].map(p => typeof p === 'string' ? p.trim() : '').filter(Boolean);

    allPlayers.forEach(p => savePlayerName(p, userKey));
    const updatedPlayers = getStoredPlayers(userKey);
    setPlayersList(updatedPlayers);
    if (currentUser) {
      syncUserGuestsToCloud(currentUser.uid, updatedPlayers);
    } else {
      syncPlayersToCloud(updatedPlayers);
    }

    // Costruisci l'elenco dei partecipanti Google registrati
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
    syncGameToCloud(gameWithOwnership, currentUser);

    // Se l'utente è loggato e ci sono amici registrati in questa partita, invia loro un invito automatico!
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
      // Modifica di una mano esistente
      updatedRounds = [...activeGame.rounds];
      updatedRounds[existingIndex] = roundData;
    } else {
      // Nuova mano
      updatedRounds = [...(activeGame.rounds || []), roundData];
    }

    // Ricalcola totali per verificare eventuale vittoria
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
    syncGameToCloud(updatedGame, currentUser, true);

    // Se questa partita è già presente nello storico (es. ripresa per aggiungere o correggere una mano), aggiorna lo storico
    const userKey = currentUser ? currentUser.uid : 'guest';
    const history = getGamesHistory(userKey);
    const hIndex = history.findIndex(g => g.id === updatedGame.id);
    if (hIndex >= 0) {
      const newHistory = [...history];
      newHistory[hIndex] = updatedGame;
      localStorage.setItem(currentUser ? `burraco_history_${currentUser.uid}` : 'burraco_history_guest', JSON.stringify(newHistory));
      setGamesHistory(newHistory);
    }

    // Se questa partita appartiene a un incontro di torneo attivo, aggiorna il torneo
    if (activeGame.tournamentMatchId && activeTournament?.rounds) {
      const tournUpdatedRounds = activeTournament.rounds.map(r => ({
        ...r,
        matches: r.matches.map(m => {
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
      const tournUpdated = { ...activeTournament, rounds: tournUpdatedRounds };
      handleUpdateTournament(tournUpdated);
    }

    if (shouldCelebrate) {
      setIsVictoryOpen(true);
    }
  };

  // Annulla l'ultima mano
  const handleDeleteLastRound = () => {
    if (!activeGame || !activeGame.rounds || activeGame.rounds.length === 0) return;
    if (!window.confirm("Vuoi davvero cancellare l'ultima mano inserita?")) return;

    const updatedRounds = activeGame.rounds.slice(0, -1);
    const updatedGame = {
      ...activeGame,
      rounds: updatedRounds,
      winner: null,
      isFinished: false,
    };

    setActiveGame(updatedGame);
    saveActiveGame(updatedGame);
    syncGameToCloud(updatedGame, currentUser, true);

    // Se presente nello storico, aggiorna
    const userKey = currentUser ? currentUser.uid : 'guest';
    const history = getGamesHistory(userKey);
    const hIndex = history.findIndex(g => g.id === updatedGame.id);
    if (hIndex >= 0) {
      const newHistory = [...history];
      newHistory[hIndex] = updatedGame;
      localStorage.setItem(currentUser ? `burraco_history_${currentUser.uid}` : 'burraco_history_guest', JSON.stringify(newHistory));
      setGamesHistory(newHistory);
    }
  };

  // Aggiorna formazioni squadre e giocatori della partita attiva
  const handleUpdateTeams = (updatedTeam1, updatedTeam2, updatedTeam3) => {
    if (!activeGame) return;

    // Aggiungi eventuali nuovi partecipanti alla rubrica isolata
    const allPlayers = [
      ...(updatedTeam1.players || []),
      ...(updatedTeam2.players || []),
      ...(updatedTeam3?.players || [])
    ].filter(Boolean);

    const userKey = currentUser ? currentUser.uid : 'guest';
    allPlayers.forEach(p => savePlayerName(p, userKey));
    const updatedPlayers = getStoredPlayers(userKey);
    setPlayersList(updatedPlayers);
    if (currentUser) {
      syncUserGuestsToCloud(currentUser.uid, updatedPlayers);
    } else {
      syncPlayersToCloud(updatedPlayers);
    }

    const updatedGame = {
      ...activeGame,
      team1: updatedTeam1,
      team2: updatedTeam2,
      ...(activeGame.mode === 'trio' && updatedTeam3 ? { team3: updatedTeam3 } : {}),
    };

    setActiveGame(updatedGame);
    saveActiveGame(updatedGame);
    syncGameToCloud(updatedGame, currentUser);
  };

  // Conclude la partita e festeggia
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
    syncGameToCloud(updatedGame, currentUser, true);

    // Se la partita appartiene a un torneo attivo, contrassegna l'incontro come completato
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
      const tournUpdated = { ...activeTournament, rounds: tournUpdatedRounds };
      handleUpdateTournament(tournUpdated);
    }

    const userKey = currentUser ? currentUser.uid : 'guest';
    const updatedHistory = archiveCurrentGame(updatedGame, userKey);
    setGamesHistory(updatedHistory);

    setIsVictoryOpen(true);
  };

  // Rivincita con gli stessi giocatori
  const handleRematch = () => {
    if (!activeGame) return;
    const userKey = currentUser ? currentUser.uid : 'guest';
    const updatedHistory = archiveCurrentGame(activeGame, userKey);
    setGamesHistory(updatedHistory);
    if (updatedHistory && updatedHistory[0]) {
      syncGameToCloud(updatedHistory[0], currentUser, true);
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
    syncGameToCloud(rematchGame, currentUser, true);
    setIsVictoryOpen(false);
  };

  // Archivia e apri modal per nuova partita
  const handleArchiveAndNew = () => {
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
      syncGameToCloud(finishedGame, currentUser, true);
    }

    // Scollega dal tavolo condiviso se presente nell'URL
    if (window.location.search.includes('game=')) {
      const url = new URL(window.location.href);
      url.searchParams.delete('game');
      window.history.replaceState({}, '', url.pathname);
    }
    setIsCloudJoined(false);

    // Ripristina una partita attiva pulita con 0 mani pronte
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

    setIsVictoryOpen(false);
    handleOpenNewGame();
  };

  const handleOpenNewGame = () => {
    setNewGameInitialSetup(null);
    setIsNewGameOpen(true);
  };

  const handleChallengeFriend = (friend) => {
    setIsPlayersOpen(false);
    const myName = currentUser?.displayName || 'Io';
    const friendName = friend.displayName || friend.email || 'Amico';
    setNewGameInitialSetup({
      mode: 'pairs',
      p1A: myName,
      p2A: friendName,
      team1Name: `Coppia ${myName}`,
      team2Name: `Coppia ${friendName}`
    });
    setIsNewGameOpen(true);
  };

  // Gestione giocatori (sincronizzata in tempo reale con Firestore e isolata per account)
  const handleAddPlayer = (name) => {
    const userKey = currentUser ? currentUser.uid : 'guest';
    savePlayerName(name, userKey);
    const updated = getStoredPlayers(userKey);
    setPlayersList(updated);
    if (currentUser) {
      syncUserGuestsToCloud(currentUser.uid, updated);
    } else {
      syncPlayersToCloud(updated);
    }
  };

  const handleDeletePlayer = (name) => {
    const userKey = currentUser ? currentUser.uid : 'guest';
    const updated = deletePlayerName(name, userKey);
    setPlayersList(updated);
    if (currentUser) {
      syncUserGuestsToCloud(currentUser.uid, updated);
    } else {
      syncPlayersToCloud(updated);
    }
  };

  const handleRenamePlayer = (oldName, newName) => {
    const userKey = currentUser ? currentUser.uid : 'guest';
    const updated = renamePlayer(oldName, newName, userKey);
    setPlayersList(updated);
    if (currentUser) {
      syncUserGuestsToCloud(currentUser.uid, updated);
    } else {
      syncPlayersToCloud(updated);
    }

    // Ricarica la partita attiva aggiornata
    const currentActive = getActiveGame();
    if (currentActive) {
      setActiveGame(currentActive);
      syncGameToCloud(currentActive, currentUser);
    }
    // Ricarica lo storico aggiornato
    const currentHistory = getGamesHistory(userKey);
    if (currentHistory) {
      setGamesHistory(currentHistory);
    }
  };

  // Scollegati dal tavolo condiviso
  const handleLeaveCloudTable = () => {
    if (window.confirm("Vuoi scollegarti da questo tavolo condiviso e tornare a una tua partita locale?")) {
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
      syncGameToCloud(newLocalGame, currentUser);
    }
  };

  // Gestione archivio (sincronizzato sia in locale che su Firestore per utente)
  const handleDeleteGameHistory = (gameId) => {
    const userKey = currentUser ? currentUser.uid : 'guest';
    const updated = deleteGameFromHistory(gameId, userKey);
    setGamesHistory(updated);
    deleteGameFromCloud(gameId);
  };

  // Condivisione punteggio rapida (WhatsApp / Appunti)
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
      alert('Punteggio copiato negli appunti! Puoi incollarlo su WhatsApp o inviarlo agli amici.');
    }
  };

  // Riprendi una partita passata sul tabellone
  const handleResumeGame = (game) => {
    setActiveGame(game);
    saveActiveGame(game);
    syncGameToCloud(game, currentUser, true);
  };

  const handleDataImported = () => {
    setPlayersList(getStoredPlayers());
    setGamesHistory(getGamesHistory());
    const current = getActiveGame();
    if (current) setActiveGame(current);
  };

  // Gestione Login / Logout con Google Auth
  const handleLogin = async () => {
    try {
      const user = await loginWithGoogle();
      if (user?.displayName) {
        const currentStored = getStoredPlayers();
        if (!currentStored.includes(user.displayName)) {
          savePlayerName(user.displayName);
          const updated = getStoredPlayers();
          setPlayersList(updated);
          syncPlayersToCloud(updated);
        }
      }
    } catch (err) {
      console.error("Login fallito:", err);
      if (err.code !== 'auth/popup-closed-by-user') {
        alert("Accesso con Google non completato: " + (err.message || err));
      }
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      setIsProfileOpen(false);
    } catch (err) {
      console.error("Logout fallito:", err);
    }
  };

  // Gestione Social & Notifiche (Amicizie e Inviti alle Partite)
  const handleSendFriendRequest = async (target) => {
    if (!currentUser) throw new Error('Devi prima accedere con il tuo account Google');
    return await sendFriendRequest(currentUser, target);
  };

  const handleRemoveFriend = async (friendshipId) => {
    try {
      await removeFriend(friendshipId);
    } catch (err) {
      console.error('Errore rimozione amicizia:', err);
      alert('Impossibile rimuovere l\'amico: ' + (err.message || err));
    }
  };

  const handleAcceptFriendRequest = async (notification) => {
    try {
      setToastNotification(null);
      await respondToFriendRequest(notification, true, currentUser);
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    } catch (err) {
      console.error('Errore accettazione amicizia:', err);
      alert('Impossibile accettare la richiesta: ' + (err.message || err));
    }
  };

  const handleDeclineFriendRequest = async (notification) => {
    try {
      setToastNotification(null);
      await respondToFriendRequest(notification, false, currentUser);
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    } catch (err) {
      console.error('Errore rifiuto amicizia:', err);
    }
  };

  const handleAcceptGameInvite = async (notification) => {
    try {
      setToastNotification(null);
      await respondToGameInvite(notification, true);
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
      setIsNotificationsOpen(false);

      // Entra direttamente nel tavolo dell'amico caricando la partita
      if (notification.gameId) {
        setIsCloudJoined(true);
        window.location.href = window.location.origin + '?game=' + notification.gameId;
      }
    } catch (err) {
      console.error('Errore accettazione partita:', err);
      alert('Impossibile entrare al tavolo: ' + (err.message || err));
    }
  };

  // Invita un amico al tavolo attivo in corso
  const handleInviteFriendToActiveGame = async (friend) => {
    if (!currentUser || !activeGame || !friend) return;
    try {
      let teamName = 'Al Tavolo';
      const t1Count = activeGame.team1?.players?.length || 0;
      const t2Count = activeGame.team2?.players?.length || 0;
      if (t1Count < 2) {
        teamName = activeGame.team1?.name || 'Squadra 1';
      } else if (t2Count < 2) {
        teamName = activeGame.team2?.name || 'Squadra 2';
      }
      await sendGameInvite(currentUser, friend, activeGame, teamName);
      sound.playTrophy();
      return { success: true };
    } catch (err) {
      console.error('Errore invio invito al tavolo attivo:', err);
      throw err;
    }
  };

  const handleDeclineGameInvite = async (notification) => {
    try {
      setToastNotification(null);
      await respondToGameInvite(notification, false);
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    } catch (err) {
      console.error('Errore rifiuto partita:', err);
    }
  };

  return (
    <div className="min-h-screen felt-bg flex flex-col selection:bg-amber-400 selection:text-emerald-950">
      
      {/* Barra Superiore */}
      <Header
        onNewGame={handleOpenNewGame}
        onOpenPlayers={() => setIsPlayersOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenCloud={() => setIsCloudModalOpen(true)}
        onOpenTournament={() => setIsTournamentOpen(true)}
        hasActiveTournament={Boolean(activeTournament)}
        onOpenRules={() => setIsRulesOpen(true)}
        onShareGame={handleShareGame}
        hasActiveGame={Boolean(activeGame)}
        currentUser={currentUser}
        onOpenProfile={() => setIsProfileOpen(true)}
        onLogin={handleLogin}
        notificationCount={notifications.length}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        friendsList={friendsList}
      />

      {/* Toast Notifiche in tempo reale */}
      <NotificationToast
        notification={toastNotification}
        onAccept={async (notif) => {
          setToastNotification(null);
          if (notif.type === 'game_invite') {
            await handleAcceptGameInvite(notif);
          } else {
            await handleAcceptFriendRequest(notif);
          }
        }}
        onDecline={async (notif) => {
          setToastNotification(null);
          if (notif.type === 'game_invite') {
            await handleDeclineGameInvite(notif);
          } else {
            await handleDeclineFriendRequest(notif);
          }
        }}
        onClose={() => setToastNotification(null)}
      />

      {/* Contenuto Principale */}
      <main 
        className="flex-1 max-w-5xl w-full mx-auto p-2.5 sm:p-4 md:p-5"
        style={{
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1.5rem)',
          paddingLeft: 'calc(env(safe-area-inset-left, 0px) + 0.625rem)',
          paddingRight: 'calc(env(safe-area-inset-right, 0px) + 0.625rem)',
        }}
      >
        
        {/* Banner Incontro Torneo Attivo */}
        {activeGame?.tournamentMatchId && (
          <div className="mb-2.5 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-950/90 via-emerald-950/90 to-amber-950/90 backdrop-blur-md border border-amber-500/50 flex items-center justify-between text-xs text-amber-200 shadow-lg">
            <div className="flex items-center gap-2 min-w-0">
              <span className="p-1.5 rounded-lg bg-amber-400/20 text-amber-300 border border-amber-400/30 shrink-0">
                <Trophy className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              </span>
              <div className="truncate">
                <span className="font-black text-amber-300">
                  {activeGame.tournamentName || 'Torneo Burraco'}:
                </span>{' '}
                <span className="text-white font-medium">
                  Giornata {activeGame.tournamentRoundNumber} • Tavolo {activeGame.tournamentTableNumber}
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsTournamentOpen(true)}
              className="px-2.5 py-1 rounded-lg gold-gradient text-emerald-950 font-black text-[11px] shadow-sm hover:brightness-110 active:scale-95 cursor-pointer shrink-0 transition-transform"
            >
              Classifica 🏆
            </button>
          </div>
        )}

        {activeGame ? (
          <ScoreBoard
            activeGame={activeGame}
            gamesHistory={gamesHistory}
            currentUser={currentUser}
            tablePlayers={tablePlayers}
            friendsList={friendsList}
            isCloudJoined={isCloudJoined}
            onLeaveCloudTable={handleLeaveCloudTable}
            onSendFriendRequest={handleSendFriendRequest}
            onOpenLogin={handleLogin}
            onAddRound={() => {
              setRoundToEdit(null);
              setIsRoundCalcOpen(true);
            }}
            onEditRound={(round) => {
              setRoundToEdit(round);
              setIsRoundCalcOpen(true);
            }}
            onDeleteLastRound={handleDeleteLastRound}
            onEndGame={handleEndGame}
            onShareGame={() => setIsCloudModalOpen(true)}
            onOpenRules={() => setIsRulesOpen(true)}
            onOpenEditTeams={() => setIsEditTeamsOpen(true)}
          />
        ) : (
          /* Schermata di Benvenuto se nessuna partita */
          <div className="text-center py-16 px-4 max-w-md mx-auto">
            <div className="w-20 h-20 rounded-3xl gold-gradient flex items-center justify-center mx-auto shadow-2xl mb-4">
              <span className="text-emerald-950 font-black text-4xl">♠</span>
            </div>
            <h2 className="text-2xl font-black text-white">Burraco Segnapunti</h2>
            <p className="text-sm text-emerald-300/80 my-3">
              Tieni traccia dei punteggi per coppia o singolo, calcola automaticamente carte, burrachi e pozzetti, e consulta le statistiche di ogni partecipante.
            </p>
            <button
              onClick={handleOpenNewGame}
              className="mt-2 w-full py-3.5 rounded-2xl gold-gradient text-emerald-950 font-black text-sm shadow-xl hover:brightness-110 active:scale-95 cursor-pointer"
            >
              Inizia la Prima Partita
            </button>
          </div>
        )}
      </main>

      {/* MODALI */}
      
      {/* 1. Modal Nuova Partita */}
      <NewGameModal
        isOpen={isNewGameOpen}
        onClose={() => {
          setIsNewGameOpen(false);
          setNewGameInitialSetup(null);
        }}
        onStartGame={handleStartGame}
        availablePlayers={playersList}
        friendsList={friendsList}
        currentUser={currentUser}
        hasActiveGame={Boolean(activeGame && activeGame.rounds && activeGame.rounds.length > 0)}
        initialSetup={newGameInitialSetup}
      />

      {/* 2. Modal Calcolatore Mano */}
      <RoundCalculatorModal
        isOpen={isRoundCalcOpen}
        onClose={() => {
          setIsRoundCalcOpen(false);
          setRoundToEdit(null);
        }}
        onSaveRound={handleSaveRound}
        activeGame={activeGame}
        roundToEdit={roundToEdit}
        roundNumber={(activeGame?.rounds?.length || 0) + 1}
      />

      {/* 3. Modal Partecipanti & Statistiche */}
      <PlayersStatsModal
        isOpen={isPlayersOpen}
        onClose={() => setIsPlayersOpen(false)}
        playersList={playersList}
        onAddPlayer={handleAddPlayer}
        onDeletePlayer={handleDeletePlayer}
        onRenamePlayer={handleRenamePlayer}
        gamesHistory={gamesHistory}
        activeGame={activeGame}
        currentUser={currentUser}
        friendsList={friendsList}
        friendsLiveProfiles={friendsLiveProfiles}
      />

      {/* 4. Modal Storico Partite */}
      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        gamesHistory={gamesHistory}
        activeGame={activeGame}
        onEndGame={handleEndGame}
        onResumeGame={handleResumeGame}
        onDeleteGame={handleDeleteGameHistory}
        onDataImported={handleDataImported}
        onAddRound={() => setIsRoundCalcOpen(true)}
        onEditRound={(round) => {
          setRoundToEdit(round);
          setIsRoundCalcOpen(true);
        }}
      />

      {/* 5. Modal Vittoria & Coriandoli */}
      <VictoryModal
        isOpen={isVictoryOpen}
        onClose={() => setIsVictoryOpen(false)}
        activeGame={activeGame}
        onRematch={handleRematch}
        onArchiveAndNew={handleArchiveAndNew}
      />

      {/* 6. Modal Database Cloud & Condivisione Tavolo */}
      <CloudSyncModal
        isOpen={isCloudModalOpen}
        onClose={() => setIsCloudModalOpen(false)}
        activeGame={activeGame}
        currentUser={currentUser}
        tablePlayers={tablePlayers}
        friendsList={friendsList}
        onSendFriendRequest={handleSendFriendRequest}
        onInviteFriendToGame={handleInviteFriendToActiveGame}
      />

      {/* 7. Modal Regole del Gioco & Valori Carte */}
      <RulesModal
        isOpen={isRulesOpen}
        onClose={() => setIsRulesOpen(false)}
      />

      {/* 8. Modal Modifica Squadre & Giocatori Partita Attiva */}
      <EditTeamsModal
        isOpen={isEditTeamsOpen}
        onClose={() => setIsEditTeamsOpen(false)}
        activeGame={activeGame}
        playersList={playersList}
        tablePlayers={tablePlayers}
        currentUser={currentUser}
        friendsList={friendsList}
        onSave={handleUpdateTeams}
      />

      {/* 9. Modal Modalità Torneo Burraco */}
      <TournamentModal
        isOpen={isTournamentOpen}
        onClose={() => setIsTournamentOpen(false)}
        activeTournament={activeTournament}
        onStartTournament={handleStartTournament}
        onUpdateTournament={handleUpdateTournament}
        onFinishTournament={handleFinishTournament}
        onPlayMatch={(match) => handlePlayTournamentMatch(match, activeTournament)}
        playersList={playersList}
      />

      {/* 10. Modal Profilo Personale & Google Account */}
      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        currentUser={currentUser}
        onLogin={handleLogin}
        onLogout={handleLogout}
        gamesHistory={gamesHistory}
        activeGame={activeGame}
        tablePlayers={tablePlayers}
        friendsList={friendsList}
        clubUsers={clubUsers}
        notifications={notifications}
        onAcceptFriendRequest={handleAcceptFriendRequest}
        onDeclineFriendRequest={handleDeclineFriendRequest}
        onSendFriendRequest={handleSendFriendRequest}
        onChallengeFriend={handleChallengeFriend}
        onInviteFriendToActiveGame={handleInviteFriendToActiveGame}
        onRemoveFriend={handleRemoveFriend}
      />

      {/* 11. Modal Notifiche & Inviti Amici */}
      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onAcceptFriendRequest={handleAcceptFriendRequest}
        onDeclineFriendRequest={handleDeclineFriendRequest}
        onAcceptGameInvite={handleAcceptGameInvite}
        onDeclineGameInvite={handleDeclineGameInvite}
      />

    </div>
  );
}
