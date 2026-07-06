import { defineConfig } from "@playwright/test";

const E2E_DATA_DIR = process.env.E2E_PGLITE_DIR ?? "/tmp/baro-e2e-pglite";

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: "http://127.0.0.1:3100",
  },
  webServer: [
    {
      // ponytail: Playwright starts+ready-checks webServer BEFORE globalSetup
      // runs (confirmed empirically), and PGlite is an in-process embedded
      // Postgres with no cross-process reload — a reseed from globalSetup
      // after this server is already up would be invisible to it. So the
      // fresh-dir + admin seed happen here, sequentially, before `dev` boots.
      command: `rm -rf "${E2E_DATA_DIR}" && pnpm --filter @baro/api seed:admin admin@e2e.test password1234 && pnpm --filter @baro/api dev`,
      url: "http://127.0.0.1:8100/health",
      reuseExistingServer: false,
      timeout: 60_000,
      env: {
        PORT: "8100",
        WEB_ORIGIN: "http://127.0.0.1:3100",
        PGLITE_DATA_DIR: E2E_DATA_DIR,
        BETTER_AUTH_URL: "http://127.0.0.1:8100",
      },
    },
    {
      command: "pnpm --filter @baro/web dev:e2e",
      url: "http://127.0.0.1:3100",
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        NEXT_PUBLIC_API_URL: "http://127.0.0.1:8100",
      },
    },
  ],
});
