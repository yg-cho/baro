import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    env: {
      PGLITE_DATA_DIR: "memory://",
    },
    setupFiles: ["./src/test-setup.ts"],
  },
});
