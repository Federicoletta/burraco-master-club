import {
  getActiveTournament,
  saveActiveTournament,
  getTournamentsHistory,
  TOURNAMENT_STORAGE_KEYS
} from './tournament';

// Gestione persistenza dati su LocalStorage

const STORAGE_KEYS = {
  ACTIVE_GAME: 'burraco_active_game_v1',
  HISTORY: 'burraco_history_v1',
  PLAYERS: 'burraco_players_v1',
  SETTINGS: 'burraco_settings_v1',
};


/**
 * Calcola l'utilizzo e la percentuale di memoria occupata in LocalStorage
 */
export function getStorageUsage() {
  try {
    if (typeof localStorage === 'undefined') return { totalBytes: 0, totalKB: 0, percent: 0, isNearLimit: false };
    let totalChars = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const val = localStorage.getItem(key);
      if (key && val) {
        totalChars += key.length + val.length;
      }
    }
    const totalBytes = totalChars * 2; // UTF-16
    const totalKB = Math.round(totalBytes / 1024);
    const limitKB = 5120; // limite standard browser 5 MB
    const percent = Math.min(100, Math.round((totalKB / limitKB) * 100));
    return {
      totalBytes,
      totalKB,
      percent,
      isNearLimit: percent >= 80,
    };
  } catch {
    return { totalBytes: 0, totalKB: 0, percent: 0, isNearLimit: false };
  }
}

/**
 * Salva in modo sicuro in LocalStorage prevenendo QuotaExceededError con compattazione automatica
 */
export function safeSetItem(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err) {
    console.warn(`[safeSetItem] Spazio LocalStorage in esaurimento per "${key}". Tento auto-compattazione...`, err);
    try {
      // Cerca e compatta tutte le chiavi di storico partite (ospite e utenti)
      const keysToCompact = [];
      const totalKeys = localStorage.length || 0;
      for (let i = 0; i < totalKeys; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith('burraco_history') || k.startsWith('burraco_tournaments'))) {
          keysToCompact.push(k);
        }
      }

      keysToCompact.forEach(historyKey => {
        try {
          const raw = localStorage.getItem(historyKey);
          if (raw) {
            const history = JSON.parse(raw);
            if (Array.isArray(history) && history.length > 25) {
              const compacted = history.map((game, idx) => {
                if (idx >= 20 && game && game.rounds && game.rounds.length > 0) {
                  return {
                    ...game,
                    roundsCount: game.rounds.length,
                    rounds: [],
                  };
                }
                return game;
              });
              localStorage.setItem(historyKey, JSON.stringify(compacted));
            }
          }
        } catch {
          // ignore individual key error
        }
      });

      localStorage.setItem(key, value);
      return true;
    } catch (retryErr) {
      console.error('[safeSetItem] Fallimento salvataggio dopo compattazione:', retryErr);
      return false;
    }
  }
}

const MOCK_NAMES = ['Marco', 'Anna', 'Luca', 'Sofia'];
const LEGACY_NAMES = [
  'aurora', 'baffettu', 'baffu', 'elisa', 'nicoletta', 'stanis', 'sub', 
  'u pá di pá', 'u pa di pa'
];
const GENERIC_LABELS = ['coppia 1', 'coppia 2', 'giocatore 1', 'giocatore 2', 'squadra 1', 'squadra 2'];

export function getPlayersKey(userKey) {
  return userKey ? `burraco_players_${userKey}` : STORAGE_KEYS.PLAYERS;
}

export function getHistoryKey(userKey) {
  return userKey ? `burraco_history_${userKey}` : STORAGE_KEYS.HISTORY;
}

export function getStoredPlayers(userKey) {
  try {
    const raw = localStorage.getItem(getPlayersKey(userKey));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    
    // Rimuove qualsiasi residuo di vecchi nomi di prova e etichette generiche
    const cleaned = parsed.filter(p => {
      const s = String(p).trim().toLowerCase();
      return s && 
        !MOCK_NAMES.map(m => m.toLowerCase()).includes(s) && 
        !GENERIC_LABELS.includes(s) && 
        !LEGACY_NAMES.includes(s);
    });
    if (cleaned.length !== parsed.length) {
      localStorage.setItem(getPlayersKey(userKey), JSON.stringify(cleaned));
    }
    return cleaned;
  } catch {
    return [];
  }
}

export function savePlayerName(name, userKey) {
  if (!name || typeof name !== 'string') return;
  const clean = name.trim();
  if (!clean) return;
  const lower = clean.toLowerCase();
  if (
    MOCK_NAMES.map(m => m.toLowerCase()).includes(lower) || 
    GENERIC_LABELS.includes(lower) || 
    LEGACY_NAMES.includes(lower)
  ) return;

  const list = getStoredPlayers(userKey);
  if (!list.includes(clean)) {
    list.push(clean);
    list.sort((a, b) => a.localeCompare(b));
    localStorage.setItem(getPlayersKey(userKey), JSON.stringify(list));
  }
}

export function deletePlayerName(name, userKey) {
  const list = getStoredPlayers(userKey).filter(p => p !== name);
  localStorage.setItem(getPlayersKey(userKey), JSON.stringify(list));
  return list;
}

export function renamePlayer(oldName, newName, userKey) {
  if (!oldName || !newName || typeof oldName !== 'string' || typeof newName !== 'string') return getStoredPlayers(userKey);
  const cleanOld = oldName.trim();
  const cleanNew = newName.trim();
  if (!cleanNew || cleanOld === cleanNew) return getStoredPlayers(userKey);

  // 1. Aggiorna lista giocatori
  const list = getStoredPlayers(userKey);
  const updatedList = list.map(p => p === cleanOld ? cleanNew : p);
  // Rimuovi eventuali duplicati e riordina
  const unique = Array.from(new Set(updatedList)).sort((a, b) => a.localeCompare(b));
  localStorage.setItem(getPlayersKey(userKey), JSON.stringify(unique));

  // 2. Aggiorna partita attiva se presente
  const activeGame = getActiveGame();
  if (activeGame) {
    let modified = false;
    const renameInTeam = (team) => {
      if (!team) return team;
      let teamMod = false;
      const newPlayers = (team.players || []).map(p => {
        if (p === cleanOld) {
          teamMod = true;
          return cleanNew;
        }
        return p;
      });
      let newName = team.name;
      if (typeof team.name === 'string' && team.name.includes(cleanOld)) {
        newName = team.name.replace(new RegExp(`\\b${cleanOld}\\b`, 'g'), cleanNew);
        teamMod = true;
      }
      if (teamMod) {
        modified = true;
        return { ...team, name: newName, players: newPlayers };
      }
      return team;
    };

    const newTeam1 = renameInTeam(activeGame.team1);
    const newTeam2 = renameInTeam(activeGame.team2);
    const newTeam3 = renameInTeam(activeGame.team3);

    if (modified) {
      const updatedGame = {
        ...activeGame,
        team1: newTeam1,
        team2: newTeam2,
        ...(activeGame.team3 ? { team3: newTeam3 } : {}),
      };
      saveActiveGame(updatedGame);
    }
  }

  // 3. Aggiorna storico partite
  const history = getGamesHistory(userKey);
  if (history && history.length > 0) {
    const updatedHistory = history.map(game => {
      let gMod = false;
      const renameInTeam = (team) => {
        if (!team) return team;
        let tMod = false;
        const newPlayers = (team.players || []).map(p => {
          if (p === cleanOld) {
            tMod = true;
            return cleanNew;
          }
          return p;
        });
        let newTeamName = team.name;
        if (typeof team.name === 'string' && team.name.includes(cleanOld)) {
          newTeamName = team.name.replace(new RegExp(`\\b${cleanOld}\\b`, 'g'), cleanNew);
          tMod = true;
        }
        if (tMod) {
          gMod = true;
          return { ...team, name: newTeamName, players: newPlayers };
        }
        return team;
      };

      const t1 = renameInTeam(game.team1);
      const t2 = renameInTeam(game.team2);
      const t3 = renameInTeam(game.team3);

      return gMod ? { ...game, team1: t1, team2: t2, ...(game.team3 ? { team3: t3 } : {}) } : game;
    });
    localStorage.setItem(getHistoryKey(userKey), JSON.stringify(updatedHistory));
  }

  return unique;
}

export function setStoredPlayers(list, userKey) {
  if (!Array.isArray(list)) return [];
  const unique = Array.from(new Set(
    list
      .filter(Boolean)
      .map(p => String(p).trim())
      .filter(p => {
        const s = p.toLowerCase();
        return s && 
          !MOCK_NAMES.map(m => m.toLowerCase()).includes(s) && 
          !GENERIC_LABELS.includes(s) && 
          !LEGACY_NAMES.includes(s);
      })
  )).sort((a, b) => a.localeCompare(b));
  localStorage.setItem(getPlayersKey(userKey), JSON.stringify(unique));
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
    safeSetItem(STORAGE_KEYS.ACTIVE_GAME, JSON.stringify(game));
  }
}

export function getGamesHistory(userKey) {
  try {
    const raw = localStorage.getItem(getHistoryKey(userKey));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function archiveCurrentGame(game, userKey) {
  if (!game) return;
  const history = getGamesHistory(userKey);
  const completedGame = {
    ...game,
    completedAt: new Date().toISOString(),
    isFinished: true,
  };
  // Aggiungi all'inizio dello storico
  const updated = [completedGame, ...history.filter(g => g.id !== game.id)];
  safeSetItem(getHistoryKey(userKey), JSON.stringify(updated));
  return updated;
}

export function deleteGameFromHistory(gameId, userKey) {
  const history = getGamesHistory(userKey).filter(g => g.id !== gameId);
  safeSetItem(getHistoryKey(userKey), JSON.stringify(history));
  return history;
}

// ===============================================================
// Coda di Sincronizzazione Offline (Outbox Queue Pattern)
// ===============================================================
const OUTBOX_QUEUE_KEY = 'burraco_offline_outbox_v1';

export function getOutboxQueue() {
  try {
    const raw = localStorage.getItem(OUTBOX_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addToOutboxQueue(game) {
  if (!game || !game.id) return;
  try {
    const queue = getOutboxQueue();
    const existingIndex = queue.findIndex(item => item.id === game.id);
    if (existingIndex >= 0) {
      queue[existingIndex] = game;
    } else {
      queue.push(game);
    }
    safeSetItem(OUTBOX_QUEUE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.warn('[Outbox] Errore aggiunta alla coda:', err);
  }
}

export function removeFromOutboxQueue(gameId) {
  if (!gameId) return;
  try {
    const queue = getOutboxQueue().filter(item => item.id !== gameId);
    safeSetItem(OUTBOX_QUEUE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.warn('[Outbox] Errore rimozione da coda:', err);
  }
}

export function clearOutboxQueue() {
  try {
    localStorage.removeItem(OUTBOX_QUEUE_KEY);
  } catch {
    // ignore
  }
}

export function exportBackupData(userKey) {
  const data = {
    version: 2,
    exportedAt: new Date().toISOString(),
    activeGame: getActiveGame(),
    history: getGamesHistory(userKey),
    players: getStoredPlayers(userKey),
    activeTournament: getActiveTournament(),
    tournamentsHistory: getTournamentsHistory(),
  };

  if (typeof document !== 'undefined' && typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `burraco_score_backup_${dateStr}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
  return data;
}

export function importBackupData(jsonData, userKey) {
  try {
    if (!jsonData) return false;
    const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return false;
    }

    let importedCount = 0;

    if (Array.isArray(data.history)) {
      localStorage.setItem(getHistoryKey(userKey), JSON.stringify(data.history));
      importedCount++;
    }
    if (Array.isArray(data.players)) {
      setStoredPlayers(data.players, userKey);
      importedCount++;
    }
    if (data.activeGame !== undefined) {
      if (data.activeGame === null) {
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_GAME);
      } else if (typeof data.activeGame === 'object') {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_GAME, JSON.stringify(data.activeGame));
      }
      importedCount++;
    }
    if (data.activeTournament !== undefined) {
      if (data.activeTournament === null) {
        localStorage.removeItem(TOURNAMENT_STORAGE_KEYS.ACTIVE);
      } else if (typeof data.activeTournament === 'object') {
        saveActiveTournament(data.activeTournament);
      }
      importedCount++;
    }
    if (Array.isArray(data.tournamentsHistory)) {
      localStorage.setItem(TOURNAMENT_STORAGE_KEYS.HISTORY, JSON.stringify(data.tournamentsHistory));
      importedCount++;
    }

    return importedCount > 0;
  } catch (err) {
    console.warn('Import error', err?.message || err);
    return false;
  }
}

/**
 * Calcola statistiche dettagliate e complete divise per singolo partecipante
 * Include sia lo storico partite che la partita in corso
 */
export function calculatePlayerStats(playersList = [], gamesHistory = [], activeGame = null) {
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

  allGames.filter(Boolean).forEach(game => {
    if (!game || typeof game !== 'object') return;
    const isFinished = Boolean(game.isFinished);
    const isTeam1Winner = game.winner === 'team1';
    const isTeam2Winner = game.winner === 'team2';

    const t1Players = Array.isArray(game.team1?.players) ? game.team1.players : [];
    const t2Players = Array.isArray(game.team2?.players) ? game.team2.players : [];
    const t3Players = Array.isArray(game.team3?.players) ? game.team3.players : [];

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

    (game.rounds || []).filter(Boolean).forEach(r => {
      if (!r || typeof r !== 'object') return;
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
      (players || []).filter(Boolean).forEach(rawP => {
        const p = typeof rawP === 'string' ? rawP : rawP?.name || String(rawP);
        if (!p) return;
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

/**
 * Calcola le statistiche di carriera aggregate di un singolo utente autenticato
 */
export function computeUserCareerStats(user, gamesHistory = [], activeGame = null) {
  if (!user) return null;
  const myName = (user.displayName || user.email?.split('@')[0] || '').trim();
  const myEmail = (user.email || '').trim().toLowerCase();

  const aliases = new Set([myName.toLowerCase(), myEmail, 'tu']);
  if (user.uid) aliases.add(String(user.uid).toLowerCase());
  if (user.displayName) {
    const full = user.displayName.trim().toLowerCase();
    aliases.add(full);
    const parts = user.displayName.trim().split(/\s+/);
    parts.forEach(pt => {
      if (pt.length >= 2) aliases.add(pt.toLowerCase());
    });
  }

  const allGames = [...(gamesHistory || [])];
  if (activeGame && activeGame.rounds && activeGame.rounds.length > 0) {
    if (!allGames.some(g => g.id === activeGame.id)) {
      allGames.push(activeGame);
    }
  }

  let gamesPlayed = 0;
  let gamesWon = 0;
  let gamesLost = 0;
  let totalPoints = 0;
  let totalHands = 0;
  let cleanBurrachi = 0;
  let semiCleanBurrachi = 0;
  let dirtyBurrachi = 0;
  let closures = 0;
  let bestHandScore = 0;

  const checkMatch = (players) => {
    return (players || []).some(p => {
      if (!p) return false;
      if (typeof p === 'string') {
        return aliases.has(p.trim().toLowerCase());
      }
      if (typeof p === 'object') {
        const n = (p.name || p.displayName || '').trim().toLowerCase();
        const em = (p.email || '').trim().toLowerCase();
        const id = (p.uid || '').trim().toLowerCase();
        return (n && aliases.has(n)) || (em && aliases.has(em)) || (id && aliases.has(id));
      }
      return false;
    });
  };

  allGames.filter(Boolean).forEach(game => {
    if (!game || typeof game !== 'object') return;
    const isFinished = Boolean(game.isFinished);
    const isTeam1Winner = game.winner === 'team1';
    const isTeam2Winner = game.winner === 'team2';
    const isTeam3Winner = game.winner === 'team3';

    const t1Match = checkMatch(game.team1?.players);
    const t2Match = checkMatch(game.team2?.players);
    const t3Match = checkMatch(game.team3?.players);

    if (!t1Match && !t2Match && !t3Match) {
      if (game.ownerUid !== user.uid) return;
    }

    const teamKey = t1Match ? 'team1' : t2Match ? 'team2' : t3Match ? 'team3' : 'team1';
    const isWinner = (teamKey === 'team1' && isTeam1Winner) || (teamKey === 'team2' && isTeam2Winner) || (teamKey === 'team3' && isTeam3Winner);
    const detailsKey = `${teamKey}Details`;
    const scoreKey = `${teamKey}Score`;

    const roundsCount = (game.rounds || []).length;
    totalHands += roundsCount;

    (game.rounds || []).filter(Boolean).forEach(r => {
      const s = Number(r[scoreKey]) || 0;
      totalPoints += s;
      if (s > bestHandScore) bestHandScore = s;

      const d = r[detailsKey];
      if (d) {
        cleanBurrachi += Number(d.burracoPulito) || 0;
        semiCleanBurrachi += Number(d.burracoSemipulito) || 0;
        dirtyBurrachi += Number(d.burracoSporco) || 0;
        if (d.chiusura) closures += 1;
      }
    });

    if (isFinished) {
      gamesPlayed += 1;
      if (isWinner) {
        gamesWon += 1;
      } else if (isTeam1Winner || isTeam2Winner || isTeam3Winner) {
        gamesLost += 1;
      }
    }
  });

  const winRate = gamesPlayed > 0 ? Math.round((gamesWon / gamesPlayed) * 100) : 0;
  const totalBurrachi = cleanBurrachi + semiCleanBurrachi + dirtyBurrachi;

  return {
    totalPoints,
    gamesPlayed,
    gamesWon,
    gamesLost,
    winRate,
    cleanBurrachi,
    semiCleanBurrachi,
    dirtyBurrachi,
    totalBurrachi,
    closures,
    bestHandScore,
    trophiesCount: 0
  };
}
