import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { computeGameShortPin } from '../src/services/firebase';

function loadServiceWorkerHarness() {
  const swPath = path.resolve(process.cwd(), 'public/sw.js');
  const swCode = fs.readFileSync(swPath, 'utf8');

  const cacheStore = new Map();
  const listeners = {};
  const precachedUrls = [];

  const createCache = (name) => {
    if (!cacheStore.has(name)) cacheStore.set(name, new Map());
    const bucket = cacheStore.get(name);
    return {
      addAll: async (urls) => {
        for (const u of urls) {
          precachedUrls.push(u);
          if (u === '/' || u === '/index.html') {
            bucket.set(u, { body: '<html><body>Burraco App Shell</body></html>', contentType: 'text/html' });
          } else if (u === '/version.json') {
            bucket.set(u, { body: '{"version":"1.0.0"}', contentType: 'application/json' });
          } else {
            bucket.set(u, { body: `asset:${u}`, contentType: 'text/plain' });
          }
        }
      },
      put: async (req, res) => {
        const key = typeof req === 'string' ? req : new URL(req.url).pathname;
        bucket.set(key, res);
      },
      match: async (req) => {
        const key = typeof req === 'string' ? req : new URL(req.url).pathname;
        return bucket.get(key);
      },
    };
  };

  const caches = {
    open: async (name) => createCache(name),
    keys: async () => Array.from(cacheStore.keys()),
    delete: async (name) => cacheStore.delete(name),
    match: async (req) => {
      const key = typeof req === 'string' ? req : new URL(req.url).pathname;
      for (const bucket of cacheStore.values()) {
        if (bucket.has(key)) return bucket.get(key);
      }
      return undefined;
    },
  };

  const selfMock = {
    location: { origin: 'https://burraco-score-fedec.web.app' },
    skipWaiting: () => {},
    clients: { claim: async () => {} },
    addEventListener: (type, fn) => {
      listeners[type] = fn;
    },
  };

  let fetchImpl = async () => {
    throw new Error('Offline');
  };

  const runner = new Function('self', 'caches', 'fetch', 'URL', swCode);
  runner(selfMock, caches, (...args) => fetchImpl(...args), URL);

  return {
    listeners,
    precachedUrls,
    setFetch: (fn) => {
      fetchImpl = fn;
    },
  };
}

describe('Service Worker (public/sw.js) - App Shell Precache & Offline Navigation', () => {
  it('precaches / and /index.html during install', async () => {
    const { listeners, precachedUrls } = loadServiceWorkerHarness();
    let installPromise = null;
    listeners.install({
      waitUntil: (p) => {
        installPromise = p;
      },
    });
    await installPromise;

    expect(precachedUrls).toContain('/');
    expect(precachedUrls).toContain('/index.html');
  });

  it('serves cached /index.html (never /version.json) for offline navigation requests', async () => {
    const { listeners } = loadServiceWorkerHarness();
    let installPromise = null;
    listeners.install({
      waitUntil: (p) => {
        installPromise = p;
      },
    });
    await installPromise;

    let navResponsePromise = null;
    listeners.fetch({
      request: {
        method: 'GET',
        mode: 'navigate',
        url: 'https://burraco-score-fedec.web.app/torneo/attivo',
      },
      respondWith: (p) => {
        navResponsePromise = p;
      },
    });

    const navResponse = await navResponsePromise;
    expect(navResponse).toBeDefined();
    expect(navResponse.contentType).toBe('text/html');
    expect(navResponse.body).toContain('Burraco App Shell');
    expect(navResponse.body).not.toContain('"version"');
  });

  it('keeps /version.json offline fallback isolated to /version.json', async () => {
    const { listeners } = loadServiceWorkerHarness();
    let installPromise = null;
    listeners.install({
      waitUntil: (p) => {
        installPromise = p;
      },
    });
    await installPromise;

    let versionResponsePromise = null;
    listeners.fetch({
      request: {
        method: 'GET',
        mode: 'cors',
        url: 'https://burraco-score-fedec.web.app/version.json?t=12345',
      },
      respondWith: (p) => {
        versionResponsePromise = p;
      },
    });

    const versionResponse = await versionResponsePromise;
    expect(versionResponse).toBeDefined();
    expect(versionResponse.contentType).toBe('application/json');
    expect(versionResponse.body).toContain('"version"');
  });
});

describe('Live Table PIN Fallback (ScoreBoard)', () => {
  it('computes 6-digit PIN from activeGame.id when activeGame.pin is absent and preserves explicit pin', () => {
    const gameWithoutPin = { id: 'game_1771545600123' };
    const computedPin = gameWithoutPin.pin || computeGameShortPin(gameWithoutPin.id);
    expect(computedPin).toBe('600123');
    expect(computedPin).toHaveLength(6);

    const gameWithPin = { id: 'game_1771545600123', pin: '998877' };
    const explicitPin = gameWithPin.pin || computeGameShortPin(gameWithPin.id);
    expect(explicitPin).toBe('998877');
  });
});
