# Scaling the type system past one API

The Hono RPC pattern this repo uses — chaining every module's routes onto
one `OpenAPIHono` instance and exporting the result as `AppType`
(`apps/api/src/app.ts`) — gives the web app a fully typed client with zero
codegen. The tradeoff: `AppType` is one big inferred type, and TypeScript
has to re-infer the whole chain on every check. At a handful of modules
(what this repo ships with) it's unnoticeable. Hono's own docs flag this as
a known scaling limit once an API grows into the hundreds of routes: `tsc`
(and your editor's type-checking) gets visibly slower.

This repo doesn't have that problem today — there's no benchmark here
because there's nothing to benchmark yet. This recipe is for if/when you get
there.

## Symptom

- `pnpm typecheck` (or your editor) gets noticeably slower as you add
  route modules to `apps/api/src/app.ts`.
- The slowdown tracks the *number of chained routes*, not the size of any
  individual module.

## Mitigations

1. **Split `AppType` per module.** Instead of one `AppType` covering every
   route, export a narrower type per module (or per group of related
   modules) and give the web app multiple smaller `hc<...>` clients instead
   of one client typed against everything. Most features only ever call one
   or two modules' routes anyway.

2. **Follow Hono's own guidance for large apps.** The
   [Hono RPC guide's "Using RPC with larger applications" section](https://hono.dev/docs/guides/rpc#using-rpc-with-larger-applications)
   covers this exact tradeoff and the precompiled-client-type pattern it
   recommends — read it before reaching for anything more invasive than
   option 1.

Don't reach for either until `pnpm typecheck` actually hurts. Splitting
`AppType` early, before there's a real slowdown, just adds indirection for
no measured benefit.

## Verify it worked

- Time `pnpm --filter @baro/api typecheck` (or `pnpm --filter @baro/web
  typecheck`, since it's the RPC client consumer that feels this most)
  before and after — the change should show up as a real wall-clock
  improvement, not just a smaller diff.
