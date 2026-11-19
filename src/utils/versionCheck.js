// Gestore controllo versione, Service Worker in attesa e aggiornamento pulito per PWA e browser
export const CURRENT_BUILD_TIME = typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : Date.now();

const updateListeners = new Set();
let waitingWorker = null;
let updateState = {
  hasUpdate: false,
  source: null, // 'sw' | 'version' | null
  remoteVersion: null,
  remoteDate: '',
};
let isReloading = false;

function emitUpdateState() {
  const snapshot = { ...updateState };
  updateListeners.forEach((listener) => {
    try {
      listener(snapshot);
    } catch {
      // ignora errori di singoli listener
    }
  });
}

export function getAppUpdateState() {
  return { ...updateState };
}

export function subscribeToAppUpdates(listener) {
  if (typeof listener !== 'function') return () => {};
  updateListeners.add(listener);
  listener({ ...updateState });
  return () => {
    updateListeners.delete(listener);
  };
}

export function notifyWaitingServiceWorker(worker) {
  if (!worker) return;
  waitingWorker = worker;
  updateState = {
    ...updateState,
    hasUpdate: true,
    source: 'sw',
  };
  emitUpdateState();
}

export function getFormattedBuildDate(timestamp = CURRENT_BUILD_TIME) {
  try {
    const d = new Date(timestamp);
    return d.toLocaleDateString('it-IT', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return 'Recente';
  }
}

/**
 * Controlla se sul server è presente una versione più recente rispetto a quella in esecuzione
 */
export async function checkForUpdates() {
  try {
    const res = await fetch(`/version.json?_t=${Date.now()}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
    if (!res.ok) return { hasUpdate: updateState.hasUpdate };

    const data = await res.json();
    if (data && typeof data.version === 'number') {
      const hasRemoteUpdate = data.version > CURRENT_BUILD_TIME;
      const remoteDate = data.builtAt ? getFormattedBuildDate(new Date(data.builtAt).getTime()) : '';
      if (hasRemoteUpdate) {
        updateState = {
          hasUpdate: true,
          source: waitingWorker ? 'sw' : 'version',
          remoteVersion: data.version,
          remoteDate,
        };
        emitUpdateState();
      }
      return {
        hasUpdate: hasRemoteUpdate || updateState.hasUpdate,
        currentVersion: CURRENT_BUILD_TIME,
        remoteVersion: data.version,
        remoteDate,
      };
    }
    return { hasUpdate: updateState.hasUpdate };
  } catch (err) {
    console.warn('Controllo aggiornamenti non riuscito:', err);
    return { hasUpdate: updateState.hasUpdate };
  }
}

/**
 * Forza il ricaricamento dell'applicazione bypassando la cache di iOS Safari / Standalone PWA
 */
export async function forceAppUpdate() {
  if (isReloading) return;
  isReloading = true;
  try {
    if (typeof caches !== 'undefined') {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    }
  } catch {
    // Ignora
  }

  const baseUrl = window.location.origin + window.location.pathname;
  window.location.replace(`${baseUrl}?v=${Date.now()}`);
}

/**
 * Applica l'aggiornamento in modo pulito:
 * - se c'è un Service Worker in attesa, invia SKIP_WAITING e ricarica una sola volta su controllerchange
 * - altrimenti esegue forceAppUpdate()
 */
export async function applyAppUpdate() {
  if (isReloading) return;

  if (
    waitingWorker &&
    typeof navigator !== 'undefined' &&
    'serviceWorker' in navigator
  ) {
    const onControllerChange = () => {
      if (isReloading) return;
      isReloading = true;
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
    try {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      // Fallback di sicurezza se il browser non emette controllerchange entro 1.5s
      window.setTimeout(() => {
        if (!isReloading) {
          navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
          forceAppUpdate();
        }
      }, 1500);
      return;
    } catch {
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
    }
  }

  await forceAppUpdate();
}
