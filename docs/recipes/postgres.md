# Switching to Postgres

By default the api runs on PGlite, an embedded Postgres-compatible database
that lives on disk under `apps/api/.baro/pglite` — no setup, no server. When
you're ready for a real Postgres instance (staging, production, or just
poking at the data with a GUI), the switch is one env var. No code changes:
`packages/db/src/client.ts` already picks Postgres over PGlite whenever
`DATABASE_URL` is set.

## Steps

1. Start a local Postgres:

   ```bash
   docker run -d --name baro-pg -e POSTGRES_USER=baro -e POSTGRES_PASSWORD=baro \
     -e POSTGRES_DB=baro -p 5432:5432 postgres:16-alpine
   ```

2. Point the api at it. Add to `apps/api/.env` (or export in your shell):

   ```
   DATABASE_URL=postgres://baro:baro@localhost:5432/baro
   ```

3. Start the api as usual (`pnpm dev` or `pnpm --filter @baro/api dev`).
   Migrations run automatically at boot — `apps/api/src/index.ts` calls
   `runMigrations()` before the server starts listening, against whichever
   database `DATABASE_URL` points to.

4. Re-seed an admin user — it's a fresh, empty database:

   ```bash
   pnpm seed:admin you@example.com password
   ```

## Verify it worked

- The api log on boot should show no PGlite-specific messages, just
  `baro api listening on http://localhost:8000`.
- `docker exec baro-pg psql -U baro -d baro -c '\dt'` should list `user`,
  `session`, `account`, `verification`, `todo` — the migrated tables.
- Log in with the admin user you just seeded.

Tear down when done: `docker rm -f baro-pg`.
