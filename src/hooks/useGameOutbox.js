import { useState, useEffect, useCallback, useRef } from 'react';
import {
  addToOutboxQueue,
  getOutboxQueue,
  removeFromOutboxQueue
} from '../utils/storage';
import { syncGameToCloud } from '../services/firebase';

export function useGameOutbox(currentUserRef) {
  const [syncStatus, setSyncStatus] = useState(
    () => (typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'synced')
  );
  const offlineEventsCountRef = useRef(0);
  const pendingSyncIdsRef = useRef(new Set());

  const flushOutboxQueue = useCallback(async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;
    await Promise.resolve();
    const queue = getOutboxQueue();
    if (!queue || queue.length === 0) return;
    setSyncStatus('syncing');
    for (const item of queue) {
      try {
        const ok = await syncGameToCloud(item, currentUserRef.current, true);
        if (ok) {
          removeFromOutboxQueue(item.id);
        }
      } catch (err) {
        console.warn('[Outbox] Errore sincronizzazione elemento accodato:', err);
      }
    }
    const remaining = getOutboxQueue();
    setSyncStatus(remaining.length === 0 ? 'synced' : 'offline');
  }, [currentUserRef]);

  useEffect(() => {
    const handleOnline = () => {
      setSyncStatus('synced');
      flushOutboxQueue();
    };
    const handleOffline = () => {
      offlineEventsCountRef.current += 1;
      setSyncStatus('offline');
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    let flushTimer = null;
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      flushTimer = setTimeout(() => {
        flushOutboxQueue();
      }, 0);
    }

    return () => {
      if (flushTimer) clearTimeout(flushTimer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [flushOutboxQueue]);

  const syncWithStatus = useCallback(async (gameToSync, force = false) => {
    if (!gameToSync?.id) return false;
    setSyncStatus('syncing');
    pendingSyncIdsRef.current.add(gameToSync.id);
    let ok = false;
    try {
      ok = await syncGameToCloud(gameToSync, currentUserRef.current, force);
    } catch (err) {
      console.warn('[syncWithStatus] Errore sincronizzazione cloud:', err?.message || err);
      ok = false;
    } finally {
      pendingSyncIdsRef.current.delete(gameToSync.id);
    }
    if (!ok) {
      addToOutboxQueue(gameToSync);
    } else {
      removeFromOutboxQueue(gameToSync.id);
    }
    setSyncStatus(ok ? 'synced' : 'offline');
    return ok;
  }, [currentUserRef]);

  return {
    syncStatus,
    setSyncStatus,
    offlineEventsCountRef,
    pendingSyncIdsRef,
    syncWithStatus,
  };
}
