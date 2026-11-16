import {
  getActiveTournament,
  saveActiveTournament,
  getPausedTournaments,
  savePausedTournaments,
  getTournamentsHistory,
  TOURNAMENT_STORAGE_KEYS
} from './tournament';
import {
  STORAGE_KEYS,
  getHistoryKey,
  getStoredPlayers,
  setStoredPlayers,
  getActiveGame,
  getGamesHistory
} from './storageCore';

export function exportBackupData(userKey) {
  const data = {
    version: 2,
    exportedAt: new Date().toISOString(),
    activeGame: getActiveGame(),
    history: getGamesHistory(userKey),
    players: getStoredPlayers(userKey),
    activeTournament: getActiveTournament(),
    pausedTournaments: getPausedTournaments(),
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
    if (Array.isArray(data.pausedTournaments)) {
      savePausedTournaments(data.pausedTournaments);
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
