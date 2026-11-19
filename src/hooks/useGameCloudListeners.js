import { useEffect, useRef } from 'react';
import {
  getActiveGame,
  saveActiveGame,
  getGamesHistory,
  getHistoryKey,
  safeSetItem,
  getOutboxQueue
} from '../utils/storage';
import { decodeGameFromUrlToken } from '../utils/statelessGame';
import {
  subscribeToCloudGame,
  subscribeToCloudGamesHistory,
  joinCloudGame,
  fetchTablePlayers
} from '../services/firebase';
import {
  normalizeLegacyGame,
  reconcileGames,
} from '../utils/roundSync';

export function useGameCloudListeners({
  currentUid,
  currentEmail,
  currentUserRef,
  activeGameId,
  activeGameRef,
  pendingSyncIdsRef,
  setActiveGame,
  setGamesHistory,
  setIsCloudJoined,
  setTablePlayers,
  setSyncStatus,
  syncWithStatus,
  customAlert
}) {
  const lastFetchedRosterKeyRef = useRef('');

  // 1. Controllo Paracadute d'Emergenza Stateless Game (#backup=...)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.location.hash || !window.location.hash.includes('backup=')) {
      return;
    }
    let cancelled = false;
    Promise.resolve().then(() => {
      if (cancelled) return;
      try {
        const restoredRaw = decodeGameFromUrlToken(window.location.hash);
        const restoredGame = restoredRaw ? normalizeLegacyGame(restoredRaw) : null;
        if (restoredGame && restoredGame.id) {
          saveActiveGame(restoredGame);
          setActiveGame(restoredGame);
          syncWithStatus(restoredGame, true);
          try {
            window.history.replaceState({}, '', window.location.pathname + window.location.search);
          } catch {
            // ignore
          }
          if (typeof customAlert === 'function') {
            customAlert({
              title: 'Partita Ripristinata!',
              message: `Il tavolo "${restoredGame.team1?.name} vs ${restoredGame.team2?.name}" è stato ripristinato con successo dal link di backup!`,
              variant: 'success'
            });
          }
        }
      } catch (backupErr) {
        console.warn('Errore ripristino backup URL:', backupErr);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [customAlert, syncWithStatus, setActiveGame]);

  // 2. Isolamento dati storico partite per account utente & sync cloud (senza resuscitare partite eliminate)
  useEffect(() => {
    const userKey = currentUid || 'guest';
    let cancelled = false;

    Promise.resolve().then(() => {
      if (!cancelled) {
        setGamesHistory(getGamesHistory(userKey));
      }
    });

    if (!currentUid) {
      return () => {
        cancelled = true;
      };
    }

    const unsubHistory = subscribeToCloudGamesHistory({ uid: currentUid }, (cloudHistory, meta = {}) => {
      if (cancelled || !Array.isArray(cloudHistory)) return;
      const localGames = getGamesHistory(userKey);
      const outboxIds = new Set((getOutboxQueue() || []).map(g => g?.id).filter(Boolean));
      const activeId = activeGameRef.current?.id;

      const map = new Map();
      // Conserva localmente le partite se la risposta cloud è parziale, in coda offline, in sync, o attiva
      localGames.forEach(g => {
        if (!g?.id) return;
        if (meta?.isPartial || outboxIds.has(g.id) || pendingSyncIdsRef.current.has(g.id) || g.id === activeId) {
          map.set(g.id, normalizeLegacyGame(g));
        }
      });

      cloudHistory.forEach(cloudGame => {
        if (!cloudGame?.id) return;
        const localMatch = map.get(cloudGame.id);
        if (localMatch) {
          map.set(cloudGame.id, reconcileGames(localMatch, cloudGame));
        } else {
          map.set(cloudGame.id, normalizeLegacyGame(cloudGame));
        }
      });

      const merged = Array.from(map.values()).sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      );

      setGamesHistory(merged);
      safeSetItem(getHistoryKey(userKey), JSON.stringify(merged));
    });

    return () => {
      cancelled = true;
      unsubHistory();
    };
  }, [currentUid, activeGameRef, pendingSyncIdsRef, setGamesHistory]);

  // 3. Ascolto real-time della partita attiva da Firestore (Multi-device live sync)
  useEffect(() => {
    const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const urlGameId = params ? params.get('game') : null;
    const targetId = urlGameId || activeGameId;

    if (!targetId) return;

    let cancelled = false;
    lastFetchedRosterKeyRef.current = '';

    // Esegue joinCloudGame solo se l'utente autenticato non è già registrato sul tavolo
    const user = currentUserRef.current;
    if (currentUid && user) {
      const currentActive = activeGameRef.current;
      const alreadyHasUid = currentActive?.id === targetId &&
        Array.isArray(currentActive.playerUids) &&
        currentActive.playerUids.includes(currentUid);
      const alreadyHasEmail = !currentEmail || (
        currentActive?.id === targetId &&
        Array.isArray(currentActive.playerEmails) &&
        currentActive.playerEmails.some(e => (e || '').toLowerCase() === currentEmail)
      );
      if (!alreadyHasUid || !alreadyHasEmail) {
        joinCloudGame(targetId, user);
      }
    }

    const unsubscribe = subscribeToCloudGame(
      targetId,
      (cloudGame) => {
        if (cancelled) return;
        if (cloudGame && cloudGame.id === targetId) {
          if (cloudGame.tableClosed) {
            setActiveGame(null);
            saveActiveGame(null);
            setIsCloudJoined(false);
            try {
              const url = new URL(window.location.href);
              url.searchParams.delete('game');
              window.history.replaceState({}, '', url.pathname);
            } catch {
              // ignore
            }
            if (typeof customAlert === 'function') {
              customAlert({
                title: 'Tavolo Chiuso',
                message: "L'organizzatore ha chiuso questo tavolo di gioco. La partita rimane salvata nell'archivio.",
                variant: 'info'
              });
            }
            return;
          }

          setActiveGame(prev => {
            const nextGame = prev?.id === targetId
              ? reconcileGames(prev, cloudGame)
              : normalizeLegacyGame(cloudGame);
            saveActiveGame(nextGame);
            return nextGame;
          });

          setSyncStatus('synced');

          if ((cloudGame.playerUids && cloudGame.playerUids.length > 0) || (cloudGame.playerEmails && cloudGame.playerEmails.length > 0)) {
            const rosterKey = `${(cloudGame.playerUids || []).slice().sort().join(',')}|${(cloudGame.playerEmails || []).slice().sort().join(',')}`;
            if (rosterKey !== lastFetchedRosterKeyRef.current) {
              lastFetchedRosterKeyRef.current = rosterKey;
              fetchTablePlayers(cloudGame.playerUids, cloudGame.playerEmails).then(players => {
                if (!cancelled && Array.isArray(players) && players.length > 0) {
                  setTablePlayers(players);
                }
              });
            }
          }
        }
      },
      () => {
        if (urlGameId) {
          customAlert({
            title: 'Tavolo non trovato',
            message: `Il tavolo "${urlGameId}" non è stato trovato o è stato eliminato.`,
            variant: 'warning'
          });
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

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [
    activeGameId,
    currentUid,
    currentEmail,
    currentUserRef,
    activeGameRef,
    setActiveGame,
    setIsCloudJoined,
    setTablePlayers,
    setSyncStatus,
    customAlert,
  ]);
}
