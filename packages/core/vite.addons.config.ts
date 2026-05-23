import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vite";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

// private な @usenagi/internal-addons source workspace から
// @usenagi/core/addons/* 用の成果物（ESM + CJS）を生成する。
// UMD/IIFE は使わない。Vite library mode では複数 entry をそれらの形式で出力できないため。
// addon は bundler 経由で利用する想定。<script> 直読みは core（main.umd.js）のみ対応。
export default defineConfig({
  resolve: {
    alias: {
      "@usenagi/core": resolve(__dirname, "lib/main.ts"),
    },
  },
  build: {
    emptyOutDir: false,
    lib: {
      entry: {
        "addons/scheduler": resolve(__dirname, "../addons/scheduler/index.ts"),
        "addons/cue": resolve(__dirname, "../addons/cue/index.ts"),
      },
      formats: ["es", "cjs"],
      fileName: (format, entryName) =>
        `${entryName}.${format === "es" ? "es" : "cjs"}.js`,
    },
  },
});
