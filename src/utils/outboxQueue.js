import { safeSetItem } from './storageCore';

// Coda di Sincronizzazione Offline (Outbox Queue Pattern)
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
