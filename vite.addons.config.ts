import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// addon は ESM + CJS を出力する。UMD/IIFE は Vite の制約により複数エントリ構成では
// 利用できないため採用しない (https://vitejs.dev/guide/build.html#library-mode)。
// addon はバンドラ経由での消費を前提とし、<script> 直読みはコア (main.umd.js) のみが対応する。
export default defineConfig({
  build: {
    emptyOutDir: false,
    lib: {
      entry: {
        'addons/scheduler': resolve(__dirname, 'lib/addons/scheduler/index.ts'),
        'addons/cue': resolve(__dirname, 'lib/addons/cue/index.ts'),
      },
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => `${entryName}.${format === 'es' ? 'es' : 'cjs'}.js`,
    },
  },
});
