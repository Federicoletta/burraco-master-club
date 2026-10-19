import React, { useState, useEffect, useRef, useMemo } from 'react';
import Header from './components/Header';
import ScoreBoard from './components/ScoreBoard';
import NewGameModal from './components/NewGameModal';
import RoundCalculatorModal from './components/RoundCalculatorModal';
import HistoryModal from './components/HistoryModal';
import VictoryModal from './components/VictoryModal';
import CloudSyncModal from './components/CloudSyncModal';
import RulesModal from './components/RulesModal';
import EditTeamsModal from './components/EditTeamsModal';
import TournamentModal from './components/TournamentModal';
import UserProfileModal from './components/UserProfileModal';
import NotificationsModal from './components/NotificationsModal';
import NotificationToast from './components/NotificationToast';
import WelcomeModal from './components/WelcomeModal';
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
  getHistoryKey,
  archiveCurrentGame, 
  deleteGameFromHistory,
  computeUserCareerStats
} from './utils/storage';
import { 
  syncGameToCloud, 
  subscribeToCloudGame, 
  subscribeToCloudGamesHistory,
  deleteGameFromCloud,
  syncTournamentToCloud,
  subscribeToCloudTournament,
  loginWithGoogle,
  logoutUser,
  subscribeToAuth,
  joinCloudGame,
  fetchTablePlayers,
  updateUserCareerStats
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
  
  // Giocatori ricavati dinamicamente dallo storico partite e dalla partita in corso (al volo, zero overhead DB)
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

  const [isCloudJoined, setIsCloudJoined] = useState(false);

  // Tournament state
  const [activeTournament, setActiveTournament] = useState(null);
  const [isTournamentOpen, setIsTournamentOpen] = useState(false);

  // User Auth & Profile state
  const [currentUser, setCurrentUser] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileInitialTab, setProfileInitialTab] = useState('profile');
  const [welcomeUser, setWelcomeUser] = useState(null);

  const handleOpenProfile = (tab = 'profile') => {
    setProfileInitialTab(tab);
    setIsProfileOpen(true);
  };

  // Social & Notifications state
  const [notifications, setNotifications] = useState([]);
  const [friendsList, setFriendsList] = useState([]);
  const [clubUsers, setClubUsers] = useState([]);
  const [tablePlayers, setTablePlayers] = useState([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [toastNotification, setToastNotification] = useState(null);
  const [newGameInitialSetup, setNewGameInitialSetup] = useState(null);
  const prevNotifIdsRef = useRef([]);

  // Modals state
  const [isNewGameOpen, setIsNewGameOpen] = useState(false);
  const [isRoundCalcOpen, setIsRoundCalcOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isVictoryOpen, setIsVictoryOpen] = useState(false);
  const [isCloudModalOpen, setIsCloudModalOpen] = useState(false);
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isEditTeamsOpen, setIsEditTeamsOpen] = useState(false);
  const [roundToEdit, setRoundToEdit] = useState(null);

  // 1. Caricamento iniziale & Controllo Link Condiviso (?game=...)
  useEffect(() => {
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

  // 2b. Isolamento dati per account (Storico Partite)
  useEffect(() => {
    const userKey = currentUser ? currentUser.uid : 'guest';
    setGamesHistory(getGamesHistory(userKey));

    // Ascolto real-time storico partite isolato per l'utente loggato
    const unsubHistory = subscribeToCloudGamesHistory(currentUser, (cloudHistory) => {
      if (Array.isArray(cloudHistory)) {
        const localGames = getGamesHistory(userKey);
        const map = new Map();
        localGames.forEach(g => { if (g && g.id) map.set(g.id, g); });
        cloudHistory.forEach(g => { if (g && g.id) map.set(g.id, g); });
        const merged = Array.from(map.values()).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

        setGamesHistory(merged);
        localStorage.setItem(getHistoryKey(userKey), JSON.stringify(merged));
      }
    });

    return () => {
      unsubHistory();
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

  // 2d. Le statistiche di carriera vengono sincronizzate solo ad ogni conclusione o archiviazione di partita (non in loop continuo)
  // Questo previene loop infiniti di scritture su Firestore e azzeramento delle quote.

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
      const userKey = currentUser ? currentUser.uid : 'guest';
      const updatedHistory = archiveCurrentGame(activeGame, userKey);
      setGamesHistory(updatedHistory);
      if (updatedHistory && updatedHistory[0]) {
        syncGameToCloud(updatedHistory[0], currentUser);
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
    syncGameToCloud(tournamentGame, currentUser);
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

    // Raccoglie i nomi dei giocatori per collegare gli account Google amici
    const allPlayers = [
      ...(newGame.team1?.players || []),
      ...(newGame.team2?.players || []),
      ...(newGame.team3?.players || [])
    ].map(p => typeof p === 'string' ? p.trim() : '').filter(Boolean);

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

    // Aggiorna puntualmente le statistiche di carriera sul profilo Cloud (azione singola su evento utente, nessun loop)
    if (currentUser) {
      const stats = computeUserCareerStats(currentUser, updatedHistory, updatedGame);
      if (stats) {
        updateUserCareerStats(currentUser.uid, stats).catch(err => {
          console.warn('Avviso aggiornamento careerStats cloud:', err);
        });
      }
    }

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

      // Aggiorna puntualmente le statistiche di carriera sul profilo Cloud
      if (currentUser) {
        const stats = computeUserCareerStats(currentUser, updatedHistory, finishedGame);
        if (stats) {
          updateUserCareerStats(currentUser.uid, stats).catch(err => {
            console.warn('Avviso aggiornamento careerStats cloud:', err);
          });
        }
      }
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

  // Gestione Login / Logout con Google Auth
  const handleLogin = async () => {
    try {
      const user = await loginWithGoogle();
      if (user?.isFirstLogin) {
        setWelcomeUser(user);
        localStorage.setItem('burraco_welcomed_' + user.uid, 'true');
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
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
      if (!prevNotifIdsRef.current.includes(notification.id)) {
        prevNotifIdsRef.current.push(notification.id);
      }
      await respondToFriendRequest(notification, true, currentUser);
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
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenCloud={() => setIsCloudModalOpen(true)}
        onOpenTournament={() => setIsTournamentOpen(true)}
        hasActiveTournament={Boolean(activeTournament)}
        onOpenRules={() => setIsRulesOpen(true)}
        onShareGame={handleShareGame}
        hasActiveGame={Boolean(activeGame)}
        currentUser={currentUser}
        onOpenProfile={handleOpenProfile}
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
        availablePlayers={recentPlayers}
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

      {/* 4. Modal Storico Partite */}
      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        gamesHistory={gamesHistory}
        activeGame={activeGame}
        currentUser={currentUser}
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
        playersList={recentPlayers}
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
        playersList={recentPlayers}
      />

      {/* 10. Modal Profilo Personale, Trofei, Classifica & Amici */}
      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        currentUser={currentUser}
        onLogin={handleLogin}
        onLogout={handleLogout}
        gamesHistory={gamesHistory}
        activeGame={activeGame}
        recentPlayers={recentPlayers}
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
        initialTab={profileInitialTab}
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

      {/* 12. Modal Benvenuto Primo Accesso / Registrazione */}
      <WelcomeModal
        isOpen={Boolean(welcomeUser)}
        onClose={() => setWelcomeUser(null)}
        user={welcomeUser}
        onOpenProfile={() => setIsProfileOpen(true)}
      />

    </div>
  );
}
