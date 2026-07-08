import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@usenagi/core/addons/signals": resolve(
        __dirname,
        "packages/addons/signals/index.ts",
      ),
      "@usenagi/core/addons/scheduler": resolve(
        __dirname,
        "packages/addons/scheduler/index.ts",
      ),
      "@usenagi/core/addons/cue": resolve(
        __dirname,
        "packages/addons/cue/index.ts",
      ),
      "@usenagi/core/addons/debug": resolve(
        __dirname,
        "packages/addons/debug/index.ts",
      ),
      "@usenagi/core": resolve(__dirname, "packages/core/lib/main.ts"),
    },
  },
  test: {
    environment: "happy-dom",
    include: ["packages/**/*.test.ts"],
  },
});
