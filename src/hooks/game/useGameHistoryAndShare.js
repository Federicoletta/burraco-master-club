import { useMemo, useCallback } from 'react';
import {
  getActiveGame,
  saveActiveGame,
  getGamesHistory,
  getHistoryKey,
  deleteGameFromHistory,
  safeSetItem,
  removeFromOutboxQueue,
} from '../../utils/storage';
import {
  syncGameToCloud,
  deleteGameFromCloud,
} from '../../services/firebase';
import { computeTeamTotalsAndWinner } from '../../utils/gameHelpers';
import { normalizeLegacyGame } from '../../utils/roundSync';

/**
 * Gestisce elenco giocatori recenti, eliminazione/importazione storico,
 * salvataggio manuale e condivisione punteggio.
 */
export function useGameHistoryAndShare({
  activeGame,
  gamesHistory,
  currentUserRef,
  activeGameRef,
  setActiveGame,
  setGamesHistory,
  setSyncStatus,
  customAlert,
}) {
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

  // Eliminazione partita dallo storico
  const handleDeleteGameHistory = useCallback((gameId) => {
    const userKey = currentUserRef.current?.uid || 'guest';
    const updated = deleteGameFromHistory(gameId, userKey);
    setGamesHistory(updated);
    removeFromOutboxQueue(gameId);
    deleteGameFromCloud(gameId).catch((err) => {
      console.warn('Errore eliminazione partita cloud:', err?.message || err);
    });
  }, [currentUserRef, setGamesHistory]);

  // Condivisione WhatsApp / Appunti
  const handleShareGame = useCallback(() => {
    const current = activeGameRef.current;
    if (!current) return;
    const isTrio = current.mode === 'trio';
    const { t1Total, t2Total, t3Total } = computeTeamTotalsAndWinner(current.rounds, current.mode, current.targetScore);

    let text;
    if (isTrio) {
      text = `🃏 Burraco a 3 Score:
♦ ${current.team1.name} (${(current.team1.players || []).join(' & ')}): ${t1Total} pt
♠ ${current.team2.name} (${(current.team2.players || []).join(' & ')}): ${t2Total} pt
♥ ${current.team3?.name || 'Giocatore 3'} (${(current.team3?.players || []).join(' & ')}): ${t3Total} pt
Mani giocate: ${current.rounds.length} (Traguardo: ${current.targetScore} pt)`;
    } else {
      text = `🃏 Burraco Score:
♦ ${current.team1.name} (${current.team1.players.join(' & ')}): ${t1Total} pt
♠ ${current.team2.name} (${current.team2.players.join(' & ')}): ${t2Total} pt
Mani giocate: ${current.rounds.length} (Traguardo: ${current.targetScore} pt)`;
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
  }, [activeGameRef, customAlert]);

  // Salvataggio manuale forzato con feedback (Cloud Firestore + Locale)
  const handleManualSave = useCallback(async () => {
    const current = activeGameRef.current;
    if (!current) return { success: false, reason: 'no_game' };

    const user = currentUserRef.current;
    const userKey = user?.uid || 'guest';
    saveActiveGame(current);
    setGamesHistory(prev => {
      const filtered = (prev || []).filter(g => g?.id !== current.id);
      const updated = [current, ...filtered];
      safeSetItem(getHistoryKey(userKey), JSON.stringify(updated));
      return updated;
    });

    setSyncStatus('syncing');
    try {
      const ok = await syncGameToCloud(current, user, true);
      if (ok) removeFromOutboxQueue(current.id);
      setSyncStatus(ok ? 'synced' : 'offline');
      return { success: ok, isOffline: !ok };
    } catch (err) {
      console.warn('Errore salvataggio manuale nel cloud:', err);
      setSyncStatus('offline');
      return { success: false, isOffline: true, error: err };
    }
  }, [activeGameRef, currentUserRef, setGamesHistory, setSyncStatus]);

  // Importazione dati
  const handleDataImported = useCallback((importedGames, replaceCloud = false) => {
    const userKey = currentUserRef.current?.uid || 'guest';
    const localGames = getGamesHistory(userKey);
    if (Array.isArray(importedGames)) {
      const normalizedImported = importedGames
        .filter(g => g && g.id)
        .map(g => normalizeLegacyGame(g));
      let merged;
      if (replaceCloud) {
        merged = [...normalizedImported].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      } else {
        const map = new Map();
        localGames.forEach(g => { if (g && g.id) map.set(g.id, g); });
        normalizedImported.forEach(g => { if (g && g.id) map.set(g.id, g); });
        merged = Array.from(map.values()).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      }

      safeSetItem(getHistoryKey(userKey), JSON.stringify(merged));
      setGamesHistory(merged);
    } else {
      setGamesHistory(localGames);
    }
    const current = getActiveGame();
    if (current) setActiveGame(normalizeLegacyGame(current));
  }, [currentUserRef, setActiveGame, setGamesHistory]);

  return {
    recentPlayers,
    handleDeleteGameHistory,
    handleShareGame,
    handleManualSave,
    handleDataImported,
  };
}
