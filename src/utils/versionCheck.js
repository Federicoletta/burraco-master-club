// Gestore controllo versione e auto-aggiornamento per iPad PWA e browser
export const CURRENT_BUILD_TIME = typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : Date.now();

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
    if (!res.ok) return { hasUpdate: false };

    const data = await res.json();
    if (data && typeof data.version === 'number') {
      const hasUpdate = data.version > CURRENT_BUILD_TIME;
      return {
        hasUpdate,
        currentVersion: CURRENT_BUILD_TIME,
        remoteVersion: data.version,
        remoteDate: data.builtAt ? getFormattedBuildDate(new Date(data.builtAt).getTime()) : ''
      };
    }
    return { hasUpdate: false };
  } catch (err) {
    console.warn('Controllo aggiornamenti non riuscito:', err);
    return { hasUpdate: false };
  }
}

/**
 * Forza il ricaricamento dell'applicazione bypassando la cache di iOS Safari / Standalone PWA
 */
export async function forceAppUpdate() {
  try {
    // Svuota eventuali cache memorizzate nel browser
    if (typeof caches !== 'undefined') {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    }
  } catch {
    // Ignora
  }

  // Forza reload della pagina con parametro univoco anti-cache
  const baseUrl = window.location.origin + window.location.pathname;
  window.location.replace(`${baseUrl}?v=${Date.now()}`);
}
