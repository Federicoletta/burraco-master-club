import React, { useState, useEffect } from 'react';
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
import { 
  getActiveGame, 
  saveActiveGame, 
  getGamesHistory, 
  archiveCurrentGame, 
  deleteGameFromHistory,
  getStoredPlayers,
  savePlayerName,
  deletePlayerName,
  setStoredPlayers
} from './utils/storage';
import { 
  syncGameToCloud, 
  subscribeToCloudGame, 
  syncPlayersToCloud,
  subscribeToCloudPlayers,
  subscribeToCloudGamesHistory,
  deleteGameFromCloud
} from './services/firebase';
import { PlusCircle, Users, Trophy, Sparkles, Cloud, Check } from 'lucide-react';

export default function App() {
  const [activeGame, setActiveGame] = useState(null);
  const [gamesHistory, setGamesHistory] = useState([]);
  const [playersList, setPlayersList] = useState([]);
  const [isCloudJoined, setIsCloudJoined] = useState(false);

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
          syncGameToCloud(cleanedGame);
          setActiveGame(cleanedGame);
        } else {
          setActiveGame(current);
          syncGameToCloud(current);
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
        syncGameToCloud(initialGame);
      }
    }
  }, []);

  // 2. Ascolto in tempo reale Partecipanti e Storico da Firestore
  useEffect(() => {
    // Sincronizzazione automatica lista partecipanti
    const unsubPlayers = subscribeToCloudPlayers((cloudPlayers) => {
      if (cloudPlayers && cloudPlayers.length > 0) {
        const merged = setStoredPlayers(cloudPlayers);
        setPlayersList(merged || cloudPlayers);
      } else {
        // Se il cloud non ha ancora giocatori, invia i partecipanti locali
        const local = getStoredPlayers();
        if (local && local.length > 0) {
          syncPlayersToCloud(local);
        }
      }
    });

    // Sincronizzazione automatica storico partite archiviate
    const unsubHistory = subscribeToCloudGamesHistory((cloudHistory) => {
      if (Array.isArray(cloudHistory)) {
        setGamesHistory(cloudHistory);
        localStorage.setItem('burraco_history_v1', JSON.stringify(cloudHistory));
      }
    });

    return () => {
      unsubPlayers();
      unsubHistory();
    };
  }, []);

  // 3. Ascolto real-time della partita attiva da Firestore (Multi-device live sync)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlGameId = params.get('game');
    const targetId = urlGameId || activeGame?.id;

    if (!targetId) return;

    if (urlGameId) {
      setIsCloudJoined(true);
    }

    const unsubscribe = subscribeToCloudGame(
      targetId, 
      (cloudGame) => {
        if (cloudGame && cloudGame.id === targetId) {
          setActiveGame(cloudGame);
          saveActiveGame(cloudGame);

          // Se la partita ha giocatori non ancora nella rubrica, aggiungili automaticamente
          const gamePlayers = [
            ...(cloudGame.team1?.players || []),
            ...(cloudGame.team2?.players || [])
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
  }, [activeGame?.id]);


  // Avvio nuova partita
  const handleStartGame = (newGame) => {
    if (activeGame && activeGame.rounds && activeGame.rounds.length > 0) {
      const updatedHistory = archiveCurrentGame(activeGame);
      setGamesHistory(updatedHistory);
      if (updatedHistory && updatedHistory[0]) {
        syncGameToCloud(updatedHistory[0]);
      }
    }

    // Salva i nomi dei giocatori nella rubrica partecipanti SOLO se sono nomi reali inseriti
    const allPlayers = [
      ...(newGame.team1?.players || []),
      ...(newGame.team2?.players || [])
    ].map(p => typeof p === 'string' ? p.trim() : '').filter(Boolean);

    allPlayers.forEach(p => savePlayerName(p));
    const updatedPlayers = getStoredPlayers();
    setPlayersList(updatedPlayers);
    syncPlayersToCloud(updatedPlayers);

    setActiveGame(newGame);
    saveActiveGame(newGame);
    syncGameToCloud(newGame);
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
    updatedRounds.forEach(r => {
      t1Total += r.team1Score || 0;
      t2Total += r.team2Score || 0;
    });

    const target = activeGame.targetScore || 2505;
    let winner = null;
    let shouldCelebrate = false;

    if (t1Total >= target || t2Total >= target) {
      winner = t1Total >= t2Total ? 'team1' : 'team2';
      shouldCelebrate = true;
    }

    const updatedGame = {
      ...activeGame,
      rounds: updatedRounds,
      winner,
      isFinished: Boolean(winner),
    };

    setActiveGame(updatedGame);
    saveActiveGame(updatedGame);
    syncGameToCloud(updatedGame);

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
    syncGameToCloud(updatedGame);
  };

  // Aggiorna formazioni squadre e giocatori della partita attiva
  const handleUpdateTeams = (updatedTeam1, updatedTeam2) => {
    if (!activeGame) return;

    // Aggiungi eventuali nuovi partecipanti alla rubrica
    const allPlayers = [
      ...(updatedTeam1.players || []),
      ...(updatedTeam2.players || [])
    ].filter(Boolean);

    allPlayers.forEach(p => savePlayerName(p));
    const updatedPlayers = getStoredPlayers();
    setPlayersList(updatedPlayers);
    syncPlayersToCloud(updatedPlayers);

    const updatedGame = {
      ...activeGame,
      team1: updatedTeam1,
      team2: updatedTeam2,
    };

    setActiveGame(updatedGame);
    saveActiveGame(updatedGame);
    syncGameToCloud(updatedGame);
  };

  // Conclude la partita e festeggia
  const handleEndGame = () => {
    if (!activeGame) return;
    const t1Total = (activeGame.rounds || []).reduce((acc, r) => acc + (r.team1Score || 0), 0);
    const t2Total = (activeGame.rounds || []).reduce((acc, r) => acc + (r.team2Score || 0), 0);
    const winner = t1Total >= t2Total ? 'team1' : 'team2';

    const updatedGame = {
      ...activeGame,
      winner,
      isFinished: true,
      completedAt: new Date().toISOString(),
    };

    setActiveGame(updatedGame);
    saveActiveGame(updatedGame);
    syncGameToCloud(updatedGame);

    const updatedHistory = archiveCurrentGame(updatedGame);
    setGamesHistory(updatedHistory);

    setIsVictoryOpen(true);
  };

  // Rivincita con gli stessi giocatori
  const handleRematch = () => {
    if (!activeGame) return;
    const updatedHistory = archiveCurrentGame(activeGame);
    setGamesHistory(updatedHistory);
    if (updatedHistory && updatedHistory[0]) {
      syncGameToCloud(updatedHistory[0]);
    }

    const rematchGame = {
      id: 'game_' + Date.now(),
      createdAt: new Date().toISOString(),
      mode: activeGame.mode,
      allowSemipulito: activeGame.allowSemipulito,
      targetScore: activeGame.targetScore,
      team1: activeGame.team1,
      team2: activeGame.team2,
      rounds: [],
      winner: null,
      isFinished: false,
    };

    setActiveGame(rematchGame);
    saveActiveGame(rematchGame);
    syncGameToCloud(rematchGame);
    setIsVictoryOpen(false);
  };

  // Archivia e apri modal per nuova partita
  const handleArchiveAndNew = () => {
    if (activeGame) {
      const updatedHistory = archiveCurrentGame(activeGame);
      setGamesHistory(updatedHistory);
      if (updatedHistory && updatedHistory[0]) {
        syncGameToCloud(updatedHistory[0]);
      }
    }
    setIsVictoryOpen(false);
    setIsNewGameOpen(true);
  };

  // Gestione giocatori (sincronizzata in tempo reale con Firestore)
  const handleAddPlayer = (name) => {
    savePlayerName(name);
    const updated = getStoredPlayers();
    setPlayersList(updated);
    syncPlayersToCloud(updated);
  };

  const handleDeletePlayer = (name) => {
    const updated = deletePlayerName(name);
    setPlayersList(updated);
    syncPlayersToCloud(updated);
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
      syncGameToCloud(newLocalGame);
    }
  };

  // Gestione archivio (sincronizzato sia in locale che su Firestore)
  const handleDeleteGameHistory = (gameId) => {
    const updated = deleteGameFromHistory(gameId);
    setGamesHistory(updated);
    deleteGameFromCloud(gameId);
  };

  // Condivisione punteggio rapida (WhatsApp / Appunti)
  const handleShareGame = () => {
    if (!activeGame) return;
    const t1Total = (activeGame.rounds || []).reduce((acc, r) => acc + (r.team1Score || 0), 0);
    const t2Total = (activeGame.rounds || []).reduce((acc, r) => acc + (r.team2Score || 0), 0);

    const text = `🃏 Burraco Score:
♦ ${activeGame.team1.name} (${activeGame.team1.players.join(' & ')}): ${t1Total} pt
♠ ${activeGame.team2.name} (${activeGame.team2.players.join(' & ')}): ${t2Total} pt
Mani giocate: ${activeGame.rounds.length} (Traguardo: ${activeGame.targetScore} pt)`;

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
    syncGameToCloud(game);
  };

  const handleDataImported = () => {
    setPlayersList(getStoredPlayers());
    setGamesHistory(getGamesHistory());
    const current = getActiveGame();
    if (current) setActiveGame(current);
  };

  return (
    <div className="min-h-screen felt-bg flex flex-col selection:bg-amber-400 selection:text-emerald-950">
      
      {/* Barra Superiore */}
      <Header
        onNewGame={() => setIsNewGameOpen(true)}
        onOpenPlayers={() => setIsPlayersOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenCloud={() => setIsCloudModalOpen(true)}
        onOpenRules={() => setIsRulesOpen(true)}
        onShareGame={handleShareGame}
        hasActiveGame={Boolean(activeGame)}
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
        
        {/* Banner Stato Tavolo Sincronizzato Cloud */}
        {activeGame && (
          <div className="mb-2.5 px-3 py-1.5 sm:py-2 rounded-xl bg-emerald-950/80 backdrop-blur-md border border-emerald-700/40 flex items-center justify-between text-xs text-emerald-200 shadow-md">
            <div className="flex items-center gap-2 min-w-0">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="truncate text-xs">
                <strong className="text-emerald-100 font-bold">Tavolo Cloud:</strong>{' '}
                <span className="text-amber-300 font-bold">{activeGame.team1?.name}</span>{' '}
                <span className="text-emerald-400/80 font-normal">vs</span>{' '}
                <span className="text-blue-300 font-bold">{activeGame.team2?.name}</span>
              </span>
              {isCloudJoined && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400/20 text-amber-300 border border-amber-400/40 shrink-0">
                  Collegato
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setIsCloudModalOpen(true)}
                className="px-2.5 py-1 rounded-lg bg-emerald-800/80 hover:bg-emerald-700 text-amber-300 font-bold text-[11px] border border-amber-500/35 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-sm"
                title="Condividi o vedi dettagli del tavolo"
              >
                <Cloud className="w-3.5 h-3.5" />
                <span>Invita al Tavolo</span>
              </button>
              {isCloudJoined && (
                <button
                  onClick={handleLeaveCloudTable}
                  className="px-2.5 py-1 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-300 font-semibold text-[11px] border border-rose-800/50 cursor-pointer transition-colors active:scale-95"
                  title="Scollegati da questo tavolo condiviso"
                >
                  Scollegati
                </button>
              )}
            </div>
          </div>
        )}

        {activeGame ? (
          <ScoreBoard
            activeGame={activeGame}
            gamesHistory={gamesHistory}
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
            onShareGame={handleShareGame}
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
              onClick={() => setIsNewGameOpen(true)}
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
        onClose={() => setIsNewGameOpen(false)}
        onStartGame={handleStartGame}
        availablePlayers={playersList}
        hasActiveGame={Boolean(activeGame && activeGame.rounds && activeGame.rounds.length > 0)}
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
        gamesHistory={gamesHistory}
        activeGame={activeGame}
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
        onSave={handleUpdateTeams}
      />

    </div>
  );
}
