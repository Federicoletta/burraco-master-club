// Gestione persistenza base su LocalStorage (giocatori, partita attiva, storico e compattazione)

export const STORAGE_KEYS = {
  ACTIVE_GAME: 'burraco_active_game_v1',
  HISTORY: 'burraco_history_v1',
  PLAYERS: 'burraco_players_v1',
  SETTINGS: 'burraco_settings_v1',
};

const GENERIC_LABELS = ['coppia 1', 'coppia 2', 'giocatore 1', 'giocatore 2', 'squadra 1', 'squadra 2'];

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
      const keysToCompact = [];
      const totalKeys = localStorage.length || 0;
      for (let i = 0; i < totalKeys; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('burraco_history')) {
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

    const cleaned = parsed.filter(p => {
      const s = String(p).trim().toLowerCase();
      return s && !GENERIC_LABELS.includes(s);
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
  if (GENERIC_LABELS.includes(lower)) return;

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

function escapeRegExp(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function replaceWholeName(text, oldName, newName) {
  if (typeof text !== 'string' || !oldName) return text;
  const escaped = escapeRegExp(oldName);
  const regex = new RegExp(`(^|[\\s&,/(\\-])(${escaped})(?=$|[\\s&,)/\\-])`, 'gu');
  return text.replace(regex, (_, prefix) => `${prefix}${newName}`);
}

export function renamePlayer(oldName, newName, userKey) {
  if (!oldName || !newName || typeof oldName !== 'string' || typeof newName !== 'string') return getStoredPlayers(userKey);
  const cleanOld = oldName.trim();
  const cleanNew = newName.trim();
  if (!cleanNew || cleanOld === cleanNew) return getStoredPlayers(userKey);

  // 1. Aggiorna lista giocatori
  const list = getStoredPlayers(userKey);
  const updatedList = list.map(p => p === cleanOld ? cleanNew : p);
  const unique = Array.from(new Set(updatedList)).sort((a, b) => a.localeCompare(b));
  localStorage.setItem(getPlayersKey(userKey), JSON.stringify(unique));

  const renameInTeam = (team, onDirty) => {
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
      const replaced = replaceWholeName(team.name, cleanOld, cleanNew);
      if (replaced !== team.name) {
        newTeamName = replaced;
        tMod = true;
      }
    }
    if (tMod) {
      onDirty();
      return { ...team, name: newTeamName, players: newPlayers };
    }
    return team;
  };

  // 2. Aggiorna partita attiva se presente
  const activeGame = getActiveGame();
  if (activeGame) {
    let modified = false;
    const mark = () => { modified = true; };
    const newTeam1 = renameInTeam(activeGame.team1, mark);
    const newTeam2 = renameInTeam(activeGame.team2, mark);
    const newTeam3 = renameInTeam(activeGame.team3, mark);

    if (modified) {
      saveActiveGame({
        ...activeGame,
        team1: newTeam1,
        team2: newTeam2,
        ...(activeGame.team3 ? { team3: newTeam3 } : {}),
      });
    }
  }

  // 3. Aggiorna storico partite
  const history = getGamesHistory(userKey);
  if (history && history.length > 0) {
    const updatedHistory = history.map(game => {
      let gMod = false;
      const mark = () => { gMod = true; };
      const t1 = renameInTeam(game.team1, mark);
      const t2 = renameInTeam(game.team2, mark);
      const t3 = renameInTeam(game.team3, mark);

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
        return s && !GENERIC_LABELS.includes(s);
      })
  )).sort((a, b) => a.localeCompare(b));
  localStorage.setItem(getPlayersKey(userKey), JSON.stringify(unique));
  return unique;
}

export function getActiveGame() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_GAME);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || typeof parsed.id !== 'string' || !parsed.id.trim()) {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_GAME);
      return null;
    }
    return parsed;
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
  const updated = [completedGame, ...history.filter(g => g.id !== game.id)];
  safeSetItem(getHistoryKey(userKey), JSON.stringify(updated));
  return updated;
}

export function deleteGameFromHistory(gameId, userKey) {
  const history = getGamesHistory(userKey).filter(g => g.id !== gameId);
  safeSetItem(getHistoryKey(userKey), JSON.stringify(history));
  return history;
}
