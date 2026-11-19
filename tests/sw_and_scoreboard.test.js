import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { computeGameShortPin } from '../src/services/firebase';

const root = process.cwd();

function loadServiceWorkerHarness() {
  const swPath = path.resolve(root, 'public/sw.js');
  const swCode = fs.readFileSync(swPath, 'utf8');

  const cacheStore = new Map();
  const listeners = {};
  const precachedUrls = [];
  let skipWaitingCalls = 0;

  const createCache = (name) => {
    if (!cacheStore.has(name)) cacheStore.set(name, new Map());
    const bucket = cacheStore.get(name);
    return {
      addAll: async (urls) => {
        for (const u of urls) {
          precachedUrls.push(u);
          if (u === '/' || u === '/index.html') {
            bucket.set(u, { body: '<html><body>Burraco App Shell</body></html>', contentType: 'text/html' });
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
    skipWaiting: () => {
      skipWaitingCalls += 1;
    },
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
    getSkipWaitingCalls: () => skipWaitingCalls,
    setFetch: (fn) => {
      fetchImpl = fn;
    },
  };
}

describe('Service Worker (public/sw.js) - App Shell, User-Controlled Update & Offline Navigation', () => {
  it('precaches app shell & PNG icons without precaching /version.json or /audio/', async () => {
    const { listeners, precachedUrls, getSkipWaitingCalls } = loadServiceWorkerHarness();
    let installPromise = null;
    listeners.install({
      waitUntil: (p) => {
        installPromise = p;
      },
    });
    await installPromise;

    expect(precachedUrls).toContain('/');
    expect(precachedUrls).toContain('/index.html');
    expect(precachedUrls).toContain('/pwa-192x192.png');
    expect(precachedUrls).toContain('/pwa-512x512.png');
    expect(precachedUrls).not.toContain('/version.json');
    expect(precachedUrls.some((u) => u.includes('/audio/'))).toBe(false);

    // Non forza skipWaiting automaticamente all'install: attende SKIP_WAITING dal banner utente
    expect(getSkipWaitingCalls()).toBe(0);
    listeners.message({ data: { type: 'SKIP_WAITING' } });
    expect(getSkipWaitingCalls()).toBe(1);
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

  it('bypasses /audio/ requests and uses Network-Only for /version.json', async () => {
    const { listeners, setFetch } = loadServiceWorkerHarness();
    let versionFetchOptions = null;
    setFetch(async (_req, opts) => {
      versionFetchOptions = opts;
      return { status: 200, contentType: 'application/json', body: '{"version":999}' };
    });

    // Audio bypass: respondWith non deve essere invocato
    let audioIntercepted = false;
    listeners.fetch({
      request: {
        method: 'GET',
        mode: 'cors',
        url: 'https://burraco-score-fedec.web.app/audio/coffee-jazz.mp3',
      },
      respondWith: () => {
        audioIntercepted = true;
      },
    });
    expect(audioIntercepted).toBe(false);

    // /version.json: Network-Only con cache no-store
    let versionPromise = null;
    listeners.fetch({
      request: {
        method: 'GET',
        mode: 'cors',
        url: 'https://burraco-score-fedec.web.app/version.json?t=12345',
      },
      respondWith: (p) => {
        versionPromise = p;
      },
    });
    const res = await versionPromise;
    expect(versionFetchOptions).toEqual({ cache: 'no-store' });
    expect(res.body).toContain('"version":999');
  });
});

describe('PWA Manifest, Icons & SEO Metadata', () => {
  it('has valid public/manifest.json with separate any and maskable PNG icons', () => {
    const manifest = JSON.parse(fs.readFileSync(path.join(root, 'public/manifest.json'), 'utf8'));
    expect(manifest.id).toBe('/');
    expect(manifest.start_url).toBe('/');
    expect(manifest.scope).toBe('/');
    expect(manifest.display).toBe('standalone');
    expect(manifest.short_name.length).toBeLessThanOrEqual(12);

    const any192 = manifest.icons.find((i) => i.sizes === '192x192' && i.purpose === 'any');
    const any512 = manifest.icons.find((i) => i.sizes === '512x512' && i.purpose === 'any');
    const maskable512 = manifest.icons.find((i) => i.sizes === '512x512' && i.purpose === 'maskable');
    expect(any192?.type).toBe('image/png');
    expect(any512?.type).toBe('image/png');
    expect(maskable512?.type).toBe('image/png');
  });

  it('includes all generated PNG icon and OpenGraph card assets in public/', () => {
    for (const file of [
      'public/apple-touch-icon.png',
      'public/pwa-192x192.png',
      'public/pwa-512x512.png',
      'public/pwa-maskable-512x512.png',
      'public/og-card.png',
    ]) {
      const stat = fs.statSync(path.join(root, file));
      expect(stat.size).toBeGreaterThan(1000);
    }
  });

  it('includes complete OpenGraph, Twitter, JSON-LD, apple-touch-icon PNG, and daylight anti-FOUC in index.html', () => {
    const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    expect(html).toContain('href="/apple-touch-icon.png"');
    expect(html).toContain('property="og:image" content="https://burraco-score-fedec.web.app/og-card.png"');
    expect(html).toContain('name="twitter:card" content="summary_large_image"');
    expect(html).toContain('"@type": "WebApplication"');
    expect(html).toContain("daylight: '#f5f1e6'");
    expect(html).not.toContain('class="text-slate-50');
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
