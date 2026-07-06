# baro

**baro** (바로) — Korean for "right away". Clone it, run it, it's on.

A fullstack TypeScript starter: Hono API + Next.js web, typed end to end with
zero codegen, and an embedded PGlite database so there is no database setup
step.

## Quick start

```bash
npx create-baro
```

or manually:

```bash
git clone https://github.com/yg-cho/baro && cd baro
pnpm install && pnpm dev
```

web on `http://localhost:3000`, api on `http://localhost:8000`.

Requirements: Node >=22, pnpm 10 (corepack enable).

## What you get

| | |
|---|---|
| Auth | Better Auth: email/password + optional Google/GitHub |
| Admin dashboard | `/admin`, seed one with `pnpm seed:admin you@example.com password` |
| Example feature | todos — copy this to build yours |
| Typed RPC | Hono `hc` client, zero codegen |
| One gate | `pnpm check` = typecheck + vitest + biome + playwright, same command locally and in CI |

## Scripts

| Command | Does |
|---|---|
| `pnpm dev` | run api + web in watch mode |
| `pnpm check` | typecheck, unit tests, lint/format check, e2e — the CI gate |
| `pnpm seed:admin <email> <password>` | create or promote a user to admin |
| `pnpm test:e2e` | Playwright smoke tests only |
| `pnpm smoke:create` | scaffold a throwaway app via the CLI and sanity-check it |
| `pnpm --filter @baro/db db:generate` | generate a Drizzle migration after a schema edit |

`smoke:create` and the e2e scripts are bash/POSIX — Windows users need WSL or
Git Bash.

## Stack

| Role | Tech | Version |
|---|---|---|
| Frontend | Next.js (App Router) + TanStack Query | Next 16, React 19 |
| UI | Base UI primitives, code-owned components (shadcn-style, no dependency) | `@base-ui/react` 1 |
| Backend | Hono + `@hono/zod-openapi` | Hono 4 |
| Type sharing | Hono RPC (`hc` client) — no codegen | — |
| DB | Drizzle ORM + Postgres, PGlite embedded by default in dev | drizzle-orm 0.45, PGlite 0.3 |
| Auth | Better Auth (admin plugin built in) | 1 |
| Validation | Zod | 4 |
| Monorepo | pnpm workspaces + Turborepo | pnpm 10, Turbo 2 |
| Lint / format | Biome | 2 |
| Testing | Vitest + Playwright | Vitest 3, Playwright 1 |

## Project layout

```
apps/
  api/                  Hono API
    src/modules/        one folder per feature (routes + middleware)
  web/                  Next.js app
    src/app/            routes
    src/features/       one folder per feature (components + query hooks)
packages/
  db/                   Drizzle schema, migrations, PGlite/Postgres client
  auth/                 Better Auth config
  shared/               Zod schemas shared by api and web
tooling/
  create-cli/           the create-baro scaffolder
```

## Adding a feature

See [ARCHITECTURE.md](./ARCHITECTURE.md). Four files: a shared Zod schema, an
API route module, a web feature folder, a page. Copy `todos` — it's the
formula.

## Recipes

- [Switching to Postgres](./docs/recipes/postgres.md)
- [Deploying](./docs/recipes/deploy.md)
- [Adding social login](./docs/recipes/social-login.md)
- [Generating an OpenAPI client with Orval](./docs/recipes/orval.md)
- [Wiring up real email](./docs/recipes/email.md)
- [Scaling the type system past one API](./docs/recipes/scaling-types.md)

## License

MIT
