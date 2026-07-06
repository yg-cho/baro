# Generating an OpenAPI client with Orval

Internal code (the web app talking to the api) should keep using the Hono
`hc` RPC client — it's already typed end to end with zero codegen, see
[ARCHITECTURE.md](../../ARCHITECTURE.md). This recipe is for everyone else:
an external consumer, a mobile app, or any client that isn't TypeScript and
can't share the `AppType` import. The api already serves a full OpenAPI
document at `/openapi.json` (`apps/api/src/app.ts`'s `.doc("/openapi.json", …)`
call), so [Orval](https://orval.dev) can generate a client straight from it.

## Steps

1. Install Orval where you want the generated client to live (it's not a
   dependency of this repo — add it to whichever package/app consumes the
   generated client):
   ```bash
   pnpm add -D orval
   ```

2. Add an `orval.config.ts`:
   ```ts
   import { defineConfig } from "orval";

   export default defineConfig({
     baro: {
       input: "http://localhost:8000/openapi.json",
       output: {
         mode: "tags-split",
         target: "src/generated/baro-api.ts",
         client: "react-query",
         httpClient: "fetch",
       },
     },
   });
   ```

3. Run the generator with the api running locally:
   ```bash
   pnpm exec orval
   ```
   This produces a TanStack Query client — typed hooks per endpoint — under
   `src/generated/`.

4. Re-run `pnpm exec orval` whenever the api's routes change. Point `input`
   at a deployed `/openapi.json` URL instead of localhost if you're
   generating against staging/production.

## Verify it worked

- `src/generated/baro-api.ts` (and per-tag files, given `tags-split`) exist
  and import from `@tanstack/react-query`.
- The generated hooks' request/response types match the api's Zod schemas —
  spot-check one endpoint, e.g. the todos list route.
- A generated hook actually calls the api and gets a real response.
