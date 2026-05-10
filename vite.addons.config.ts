import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  build: {
    emptyOutDir: false,
    lib: {
      entry: {
        'addons/scheduler': resolve(__dirname, 'lib/addons/scheduler/index.ts'),
        'addons/cue': resolve(__dirname, 'lib/addons/cue/index.ts'),
      },
      formats: ['es'],
      fileName: (_format, entryName) => `${entryName}.es.js`,
    },
  },
});
