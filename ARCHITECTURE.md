# Architecture

This file is for humans and for AI agents. Any tool that can read one file can
learn this codebase's rules here. (There is deliberately no separate
`CLAUDE.md` / `.cursorrules` / tool-specific config — one file, kept honest by
being the one humans read too.)

## Adding a feature

Four files, using `todos` as the example:

```
packages/shared/src/schemas/<feature>.ts      # zod schema (single source)
apps/api/src/modules/<feature>/routes.ts      # Hono routes (+ .test.ts)
apps/web/src/features/<feature>/              # components + query hooks
apps/web/src/app/<feature>/page.tsx           # route
```

Then register the module in `apps/api/src/app.ts`:
`.route("/api/<feature>", <feature>Routes)`, chained **last** (per the
chain-order rule below).

Copy the todos feature. It is the formula.

## Rules

- **Router-level guards must be a separate statement.** `app.use("/*", requireAuth)`
  cannot be chained into the `.openapi()` builder chain on `OpenAPIHono` —
  chaining widens the inferred type and drops `.openapi()`. See
  `apps/api/src/modules/todos/routes.ts` and `modules/admin/routes.ts`.
- **`app.ts` chain order is load-bearing for `AppType`.** `.doc()` must come
  first, `.route()` calls must stay chained last, so the exported `AppType`
  keeps full route typing for the web RPC client. One side effect of the
  order: `/openapi.json` intentionally has no CORS middleware applied. Don't
  reorder it.
- **Error envelope:** `{ error: { code, message } }`. Exception: better-auth's
  own endpoints (mounted under `/api/auth/*`) return their own
  `{ code, message }` shape — that's plugin-owned, not reshaped to match.
- **Ownership pattern:** UPDATE/DELETE do `WHERE id = ? AND userId = ?` in one
  query. A row that exists but belongs to someone else returns 404, never
  403 — a 403 would leak that the row exists. See
  `apps/api/src/modules/todos/routes.ts`.
- **DB:** schema lives in `packages/db/src/schema.ts`. After editing it, run
  `pnpm --filter @baro/db db:generate`. Migrations run automatically at API
  boot (`apps/api/src/index.ts` calls `runMigrations()` before `serve()`).
  PGlite (embedded, on-disk under `apps/api/.baro/pglite`) is the default;
  setting `DATABASE_URL` switches to Postgres.
- **Env:** `apps/api` loads `.env` via `src/env.ts` using Node's
  `process.loadEnvFile` — real shell env vars still win over file values, and
  a missing `.env` (the repo itself ships none) is not an error. The web app
  reads `NEXT_PUBLIC_API_URL` for the API base URL.
- **Internal packages export TS source directly** — no build step, no dist
  output. `apps/web/tsconfig.json` deliberately does not `extend` the shared
  `tsconfig.base.json`; Next.js owns its own tsconfig.
- **`requireAuth` and `requireAdmin` are duplicated on purpose.** They look
  almost identical (`apps/api/src/modules/auth/middleware.ts` and
  `modules/admin/middleware.ts`). Don't unify them until a third consumer
  needs the same shape — two call sites aren't enough evidence for the right
  abstraction yet.
- **Bigint counts:** node-postgres returns aggregate counts as strings.
  `Number()`-coerce them before returning JSON (see
  `apps/api/src/modules/admin/routes.ts`).
- **`seed-admin` lowercases the email** before lookup/creation, matching
  better-auth's own email normalization — so `pnpm seed:admin You@Example.com pw`
  and a login with `you@example.com` resolve to the same user.

## Security notes

- The Better Auth `admin()` plugin is enabled by default and includes
  impersonation (role-gated to `admin`, 1-hour session, no UI for it). If you
  don't want impersonation available, disable it via the plugin's options in
  `packages/auth/src/index.ts`.
- Sessions are `HttpOnly`, `SameSite=Lax` cookies. In production, the web and
  api origins must share a registrable domain for the cookie to be sent
  cross-subdomain — otherwise switch to `sameSite: "none"` with `Secure`.
- CSRF protection is an origin allow-list (`trustedOrigins`), driven by
  `WEB_ORIGIN` — see `packages/auth/src/index.ts` and the CORS config in
  `apps/api/src/app.ts`.

## Testing

- Vitest per package, run against PGlite in-memory (`PGLITE_DATA_DIR:
  "memory://"`). Timeouts are set to 30s (`testTimeout` / `hookTimeout`)
  because WASM init plus scrypt password hashing can be slow on CI runners.
- Playwright smoke tests run against dedicated ports (web `3100`, api `8100`)
  with a fresh PGlite data directory per run — see
  `apps/web/playwright.config.ts`.
- `pnpm check` (typecheck + vitest + biome + playwright) is the single gate.
  It's the same command locally and in CI — there is no separate CI-only
  script.

## OpenAPI

`/openapi.json` documents response *bodies* for success statuses only, by
convention. 401/403 from `requireAuth`/`requireAdmin` middleware aren't
declared at all (they short-circuit before the route's typed responses); the
404s in `modules/todos/routes.ts` are declared but with a bare description,
no content schema. Don't add response schemas for error bodies — it isn't
this codebase's convention.
