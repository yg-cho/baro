import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // PGlite WASM init can take >5s on slow CI runners
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
