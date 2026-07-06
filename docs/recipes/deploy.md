# Deploying

Web and api deploy separately: `apps/web` to Vercel, `apps/api` to a
long-running Node host (Railway, Fly — anything that runs `node`/`tsx`
continuously, since the api isn't a serverless function).

## Steps

1. **Database.** Provision a Postgres instance (Railway, Fly Postgres, Neon,
   Supabase — any of them). Grab its connection string.

2. **Deploy the api** (Railway/Fly, Node 22):
   - Build/start command: there's no build step for the api (internal
     packages ship TS source directly), so run it straight through `tsx`.
     `apps/api/package.json` has a `start` script for this:
     `tsx src/index.ts`. Point your host's start command at
     `pnpm --filter @baro/api start` from the repo root.
   - Env vars:
     | Var | Value |
     |---|---|
     | `DATABASE_URL` | the Postgres connection string from step 1 |
     | `BETTER_AUTH_SECRET` | `openssl rand -base64 32` — do not reuse the dev default |
     | `BETTER_AUTH_URL` | the api's public URL, e.g. `https://api.example.com` |
     | `WEB_ORIGIN` | the web app's public URL, e.g. `https://example.com` |
     | `PORT` | whatever your host expects (Railway/Fly usually inject this) |
   - Migrations run automatically at boot (`runMigrations()` in
     `apps/api/src/index.ts`) — no separate migration step to wire up.

3. **Deploy the web app** to Vercel, root directory `apps/web`. Env var:
   | Var | Value |
   |---|---|
   | `NEXT_PUBLIC_API_URL` | the api's public URL from step 2 |

4. Redeploy the web app if you set `NEXT_PUBLIC_API_URL` after the first
   deploy — it's baked in at build time.

> **Same-site cookies: web and api must share a registrable domain.**
> Sessions are `HttpOnly`, `SameSite=Lax` cookies (see
> `packages/auth/src/index.ts`). `SameSite=Lax` cookies are sent
> cross-*subdomain* (`app.example.com` calling `api.example.com`) but not
> across unrelated domains (`example.com` calling `example-api.up.railway.app`)
> — logins will silently fail to persist. Either:
> - put both on the same registrable domain (`example.com` /
>   `api.example.com`), or
> - if they must live on unrelated domains, add
>   `advanced: { defaultCookieAttributes: { sameSite: "none", secure: true } }`
>   to the `betterAuth()` config in `packages/auth/src/index.ts` — requires
>   HTTPS on both sides.

## Verify it worked

- `curl https://api.example.com/health` returns healthy.
- Visiting the web app, signing up, and refreshing the page keeps you logged
  in (the session cookie round-tripped).
- Check the browser's Application/cookies panel: the session cookie should
  be present after login, not just set-and-dropped.
