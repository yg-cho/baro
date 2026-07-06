# create-baro

**baro** (바로) — Korean for "right away". This is the scaffolder: one command
and you have a fullstack TypeScript app running.

## Usage

```bash
npx create-baro
```

Answers a couple of prompts (project name, database) and scaffolds a ready-to-run
app. Or skip the prompts:

```bash
npx create-baro --name my-app --db pglite --skip-install
```

| Flag | Values | Does |
|---|---|---|
| `--name` | string | project name / directory (lowercase, numbers, dashes) |
| `--db` | `pglite` \| `postgres` | database backend — pglite needs no setup |
| `--database-url` | `postgres://...` | required when `--db postgres` |
| `--skip-install` | — | skip `pnpm install` after scaffolding |

## What you get

A Hono API + Next.js web app, typed end to end with zero codegen, Better Auth
with an admin dashboard, and an embedded PGlite database by default — no
database setup step. See the
[repo README](https://github.com/yg-cho/baro#readme) for the full stack and
[ARCHITECTURE.md](https://github.com/yg-cho/baro/blob/main/ARCHITECTURE.md)
for how to add a feature.

The scaffolded `.gitignore` retains a few internal ignore lines (`.claude/`,
`.agents/`, etc.) left over from this repo — harmless, delete freely.

## Requirements

Node >=22, pnpm.

## Publishing (maintainers)

```bash
cd tooling/create-cli && npm publish
```

`prepublishOnly` builds `dist` automatically. First publish needs
`npm login`.

## License

MIT
