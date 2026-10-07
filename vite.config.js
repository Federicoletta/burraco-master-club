import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const buildTime = Date.now();

// Plugin per generare dist/version.json a ogni compilazione
function versionPlugin() {
  return {
    name: 'generate-version-file',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: JSON.stringify({
          version: buildTime,
          builtAt: new Date(buildTime).toISOString()
        }, null, 2)
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), versionPlugin()],
  define: {
    __BUILD_TIME__: JSON.stringify(buildTime),
  }
})

