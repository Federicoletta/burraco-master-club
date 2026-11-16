// Barrel export modulare per i servizi Firebase (mantiene compatibilità con tutti gli import esistenti)
export {
  db,
  auth,
  isFirebaseConfigured,
  OperationType,
  isPermissionOrQuotaError,
  isIndexMissingError,
  handleFirestoreError,
  computeGameShortPin,
  sanitizeForFirestore,
} from './firebaseClient';

export {
  loginWithGoogle,
  logoutUser,
  subscribeToAuth,
} from './authService';

export {
  registerGamePin,
  syncGameToCloud,
  findGameByPinOrId,
  subscribeToCloudGame,
  loadCloudGamesHistory,
  deleteGameFromCloud,
  subscribeToCloudGamesHistory,
  joinCloudGame,
} from './gamesCloudService';

export {
  syncTournamentToCloud,
  subscribeToCloudTournament,
  loadCloudTournamentsHistory,
  deleteTournamentFromCloud,
} from './tournamentsCloudService';

export {
  fetchPublicProfilesBatch,
  fetchTablePlayers,
  updateUserCareerStats,
} from './profilesService';
