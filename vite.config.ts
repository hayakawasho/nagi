import { resolve } from "node:path";

import { defineConfig } from "vite";

export default defineConfig({
  resolve: {
    alias: {
      "@usenagi/core/addons/signals": resolve(
        __dirname,
        "packages/addons/signals/index.ts",
      ),
      "@usenagi/core": resolve(__dirname, "packages/core/lib/main.ts"),
    },
  },
});
