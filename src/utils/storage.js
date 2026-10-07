// Gestione persistenza dati su LocalStorage

const STORAGE_KEYS = {
  ACTIVE_GAME: 'burraco_active_game_v1',
  HISTORY: 'burraco_history_v1',
  PLAYERS: 'burraco_players_v1',
  SETTINGS: 'burraco_settings_v1',
};

// Default preset di giocatori per iniziare: vuoto (nessun nome forzato)
const DEFAULT_PLAYERS = [];
const MOCK_NAMES = ['Marco', 'Anna', 'Luca', 'Sofia'];
const GENERIC_LABELS = ['coppia 1', 'coppia 2', 'giocatore 1', 'giocatore 2', 'squadra 1', 'squadra 2'];

export function getStoredPlayers() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PLAYERS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    
    // Rimuove eventuali residui dei vecchi 4 nomi di prova
    const cleaned = parsed.filter(p => !MOCK_NAMES.includes(p) && !GENERIC_LABELS.includes(String(p).toLowerCase()));
    if (cleaned.length !== parsed.length) {
      localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(cleaned));
    }
    return cleaned;
  } catch {
    return [];
  }
}

export function savePlayerName(name) {
  if (!name || typeof name !== 'string') return;
  const clean = name.trim();
  if (!clean) return;
  if (MOCK_NAMES.includes(clean) || GENERIC_LABELS.includes(clean.toLowerCase())) return;

  const list = getStoredPlayers();
  if (!list.includes(clean)) {
    list.push(clean);
    list.sort((a, b) => a.localeCompare(b));
    localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(list));
  }
}

export function deletePlayerName(name) {
  const list = getStoredPlayers().filter(p => p !== name);
  localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(list));
  return list;
}

export function setStoredPlayers(list) {
  if (!Array.isArray(list)) return [];
  const unique = Array.from(new Set(
    list
      .filter(Boolean)
      .map(p => String(p).trim())
      .filter(p => p && !MOCK_NAMES.includes(p) && !GENERIC_LABELS.includes(p.toLowerCase()))
  )).sort((a, b) => a.localeCompare(b));
  localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(unique));
  return unique;
}


export function getActiveGame() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_GAME);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveActiveGame(game) {
  if (!game) {
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_GAME);
  } else {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_GAME, JSON.stringify(game));
  }
}

export function getGamesHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HISTORY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function archiveCurrentGame(game) {
  if (!game) return;
  const history = getGamesHistory();
  const completedGame = {
    ...game,
    completedAt: new Date().toISOString(),
    isFinished: true,
  };
  // Aggiungi all'inizio dello storico
  const updated = [completedGame, ...history.filter(g => g.id !== game.id)];
  localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updated));
  return updated;
}

export function deleteGameFromHistory(gameId) {
  const history = getGamesHistory().filter(g => g.id !== gameId);
  localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
  return history;
}

export function exportBackupData() {
  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    activeGame: getActiveGame(),
    history: getGamesHistory(),
    players: getStoredPlayers(),
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `burraco_score_backup_${dateStr}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importBackupData(jsonData) {
  try {
    const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
    if (data.history && Array.isArray(data.history)) {
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(data.history));
    }
    if (data.players && Array.isArray(data.players)) {
      localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(data.players));
    }
    if (data.activeGame) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_GAME, JSON.stringify(data.activeGame));
    }
    return true;
  } catch (err) {
    console.error('Import error', err);
    return false;
  }
}

/**
 * Calcola statistiche dettagliate e complete divise per singolo partecipante
 * Include sia lo storico partite che la partita in corso
 */
export function calculatePlayerStats(playersList, gamesHistory = [], activeGame = null) {
  // Raccogli tutte le partite (storico + attiva se contiene round)
  const allGames = [...gamesHistory];
  if (activeGame && activeGame.rounds && activeGame.rounds.length > 0) {
    if (!allGames.some(g => g.id === activeGame.id)) {
      allGames.push(activeGame);
    }
  }

  const statsMap = {};

  // Inizializza statistiche per ogni partecipante
  playersList.forEach(player => {
    statsMap[player] = {
      name: player,
      gamesPlayed: 0,
      gamesWon: 0,
      gamesLost: 0,
      winRate: 0,
      totalPoints: 0,
      totalHands: 0,
      avgPointsPerGame: 0,
      avgPointsPerHand: 0,
      cleanBurrachi: 0,
      semiCleanBurrachi: 0,
      dirtyBurrachi: 0,
      totalBurrachi: 0,
      closures: 0,
      bestHandScore: 0,
      scoresHistory: [], // array di punti per mano per i grafici
      matchScores: [],   // punti per singola partita
    };
  });

  allGames.forEach(game => {
    const isFinished = Boolean(game.isFinished);
    const isTeam1Winner = game.winner === 'team1';
    const isTeam2Winner = game.winner === 'team2';

    const t1Players = game.team1?.players || [];
    const t2Players = game.team2?.players || [];
    const t3Players = game.team3?.players || [];

    let t1Total = 0;
    let t2Total = 0;
    let t3Total = 0;
    let t1Clean = 0;
    let t2Clean = 0;
    let t3Clean = 0;
    let t1Semi = 0;
    let t2Semi = 0;
    let t3Semi = 0;
    let t1Dirty = 0;
    let t2Dirty = 0;
    let t3Dirty = 0;
    let t1Closures = 0;
    let t2Closures = 0;
    let t3Closures = 0;

    const t1HandScores = [];
    const t2HandScores = [];
    const t3HandScores = [];

    (game.rounds || []).forEach(r => {
      const s1 = Number(r.team1Score) || 0;
      const s2 = Number(r.team2Score) || 0;
      const s3 = Number(r.team3Score) || 0;
      t1Total += s1;
      t2Total += s2;
      t3Total += s3;
      t1HandScores.push(s1);
      t2HandScores.push(s2);
      t3HandScores.push(s3);

      if (r.team1Details) {
        t1Clean += r.team1Details.burracoPulito || 0;
        t1Semi += r.team1Details.burracoSemipulito || 0;
        t1Dirty += r.team1Details.burracoSporco || 0;
        if (r.team1Details.chiusura) t1Closures += 1;
      }
      if (r.team2Details) {
        t2Clean += r.team2Details.burracoPulito || 0;
        t2Semi += r.team2Details.burracoSemipulito || 0;
        t2Dirty += r.team2Details.burracoSporco || 0;
        if (r.team2Details.chiusura) t2Closures += 1;
      }
      if (r.team3Details) {
        t3Clean += r.team3Details.burracoPulito || 0;
        t3Semi += r.team3Details.burracoSemipulito || 0;
        t3Dirty += r.team3Details.burracoSporco || 0;
        if (r.team3Details.chiusura) t3Closures += 1;
      }
    });

    const roundsCount = (game.rounds || []).length;
    const isTeam3Winner = game.winner === 'team3';

    // Helper per aggiornare statistiche di un gruppo di giocatori
    const updatePlayersStats = (players, totalScore, clean, semi, dirty, closures, handScores, isWinner) => {
      players.forEach(p => {
        if (!statsMap[p]) {
          statsMap[p] = {
            name: p,
            gamesPlayed: 0,
            gamesWon: 0,
            gamesLost: 0,
            winRate: 0,
            totalPoints: 0,
            totalHands: 0,
            avgPointsPerGame: 0,
            avgPointsPerHand: 0,
            cleanBurrachi: 0,
            semiCleanBurrachi: 0,
            dirtyBurrachi: 0,
            totalBurrachi: 0,
            closures: 0,
            bestHandScore: 0,
            scoresHistory: [],
            matchScores: [],
          };
        }

        if (isFinished) {
          statsMap[p].gamesPlayed += 1;
          if (isWinner) {
            statsMap[p].gamesWon += 1;
          } else if (isTeam1Winner || isTeam2Winner || isTeam3Winner) {
            statsMap[p].gamesLost += 1;
          }
        }

        statsMap[p].totalPoints += totalScore;
        statsMap[p].totalHands += roundsCount;
        statsMap[p].cleanBurrachi += clean;
        statsMap[p].semiCleanBurrachi += semi;
        statsMap[p].dirtyBurrachi += dirty;
        statsMap[p].closures += closures;
        statsMap[p].scoresHistory.push(...handScores);
        if (roundsCount > 0) {
          statsMap[p].matchScores.push(totalScore);
        }

        handScores.forEach(score => {
          if (score > statsMap[p].bestHandScore) {
            statsMap[p].bestHandScore = score;
          }
        });
      });
    };

    updatePlayersStats(t1Players, t1Total, t1Clean, t1Semi, t1Dirty, t1Closures, t1HandScores, isTeam1Winner);
    updatePlayersStats(t2Players, t2Total, t2Clean, t2Semi, t2Dirty, t2Closures, t2HandScores, isTeam2Winner);
    if (t3Players.length > 0) {
      updatePlayersStats(t3Players, t3Total, t3Clean, t3Semi, t3Dirty, t3Closures, t3HandScores, isTeam3Winner);
    }
  });

  // Calcola derivate finali (medie, percentuali, totali)
  Object.values(statsMap).forEach(p => {
    p.totalBurrachi = p.cleanBurrachi + p.semiCleanBurrachi + p.dirtyBurrachi;
    p.winRate = p.gamesPlayed > 0 ? Math.round((p.gamesWon / p.gamesPlayed) * 100) : 0;
    p.avgPointsPerGame = p.gamesPlayed > 0 ? Math.round(p.totalPoints / p.gamesPlayed) : p.totalPoints;
    p.avgPointsPerHand = p.totalHands > 0 ? Math.round(p.totalPoints / p.totalHands) : 0;
  });

  return Object.values(statsMap).sort((a, b) => {
    if (b.gamesWon !== a.gamesWon) return b.gamesWon - a.gamesWon;
    return b.totalPoints - a.totalPoints;
  });
}
