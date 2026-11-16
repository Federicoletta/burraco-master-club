// Barrel re-export per compatibilità con tutti i moduli esistenti e i test
export {
  getStorageUsage,
  safeSetItem,
  getPlayersKey,
  getHistoryKey,
  getStoredPlayers,
  savePlayerName,
  deletePlayerName,
  renamePlayer,
  setStoredPlayers,
  getActiveGame,
  saveActiveGame,
  getGamesHistory,
  archiveCurrentGame,
  deleteGameFromHistory,
} from './storageCore';

export {
  getOutboxQueue,
  addToOutboxQueue,
  removeFromOutboxQueue,
  clearOutboxQueue,
} from './outboxQueue';

export {
  exportBackupData,
  importBackupData,
} from './backup';

export {
  calculatePlayerStats,
  computeUserCareerStats,
} from './playerStats';
