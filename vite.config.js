import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const buildTime = Date.now();
const buildVersionJson = JSON.stringify({
  version: buildTime,
  builtAt: new Date(buildTime).toISOString()
}, null, 2);

// Plugin per generare dist/version.json e iniettare gli asset buildati (JS/CSS) nel Service Worker
function pwaAndVersionPlugin() {
  return {
    name: 'burraco-pwa-and-version',
    configureServer(server) {
      server.middlewares.use('/version.json', (_req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.end(buildVersionJson);
      });
    },
    generateBundle(_options, bundle) {
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: buildVersionJson
      });

      const swTemplatePath = path.resolve(process.cwd(), 'public/sw.js');
      if (!fs.existsSync(swTemplatePath)) return;

      const buildAssets = Object.keys(bundle)
        .filter((fileName) => /\.(js|css)$/.test(fileName) && !fileName.startsWith('audio/'))
        .map((fileName) => `/${fileName}`);

      const swSource = fs.readFileSync(swTemplatePath, 'utf8')
        .replace('__BURRACO_CACHE_VERSION__', String(buildTime))
        .replace('/*__PRECACHE_ASSETS__*/[]', JSON.stringify(buildAssets));

      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source: swSource
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), pwaAndVersionPlugin()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: true,
  },
  define: {
    __BUILD_TIME__: JSON.stringify(buildTime),
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || id.includes('node_modules/scheduler/')) {
            return 'vendor-react';
          }
          if (id.includes('@firebase/firestore') || id.includes('firebase/firestore')) {
            return 'vendor-firebase-firestore';
          }
          if (id.includes('@firebase/auth') || id.includes('firebase/auth')) {
            return 'vendor-firebase-auth';
          }
          if (id.includes('firebase') || id.includes('@firebase')) {
            return 'vendor-firebase-core';
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons';
          }
          if (id.includes('node_modules/canvas-confetti')) {
            return 'vendor-confetti';
          }
        }
      }
    }
  }
});
