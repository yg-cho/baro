// ponytail: the fresh-dir rm + admin seed actually live in the api
// webServer's command (see playwright.config.ts) — Playwright starts and
// ready-checks webServer *before* calling globalSetup, and PGlite (in-process
// embedded Postgres) has no way to pick up a reseed done by a separate
// process after that. Doing it here would silently no-op against the
// already-running server. This just fails fast if that seed didn't take.
// ports defined in playwright.config.ts webServer
const API = "http://127.0.0.1:8100";

export default async function globalSetup() {
  const res = await fetch(`${API}/api/auth/sign-in/email`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "http://127.0.0.1:3100",
    },
    body: JSON.stringify({
      email: "admin@e2e.test",
      password: "password1234",
    }),
  });
  if (!res.ok) {
    throw new Error(
      `admin@e2e.test seed check failed (${res.status}) — see the api webServer's seed:admin output above`,
    );
  }
}
