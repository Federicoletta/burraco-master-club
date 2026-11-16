import { rmSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const buildTime = Date.now();
const buildVersionJson = JSON.stringify({
  version: buildTime,
  builtAt: new Date(buildTime).toISOString()
}, null, 2);

// Plugin per generare dist/version.json, servirlo in dev ed escludere screenshot interni dal bundle
function versionPlugin() {
  return {
    name: 'generate-version-file',
    configureServer(server) {
      server.middlewares.use('/version.json', (_req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.end(buildVersionJson);
      });
    },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: buildVersionJson
      });
    },
    closeBundle() {
      try {
        rmSync(resolve(process.cwd(), 'dist/assets/aistudio'), { recursive: true, force: true });
      } catch {
        // ignore if absent
      }
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), versionPlugin()],
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
})
