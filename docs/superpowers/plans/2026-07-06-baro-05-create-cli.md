# baro Plan 5/6 — create-baro CLI 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `npx create-baro` — 질문 2개(프로젝트명, DB)로 템플릿을 내려받아 정리·env 생성·git init·install까지 자동, `pnpm dev` 안내로 종료. "clone부터 로그인 화면까지 3분" 스펙 달성 수단.

**Architecture:** CLI는 얇은 래퍼 — 템플릿 원본은 이 레포 자체(GitHub main). `giget`으로 다운로드(테스트·오프라인용으로 `CREATE_BARO_TEMPLATE_DIR` 로컬 복사 모드 지원), 내부 문서·CLI 자신을 제거(sanitize), `.env` 자동 생성(시크릿 랜덤), 마이그레이션은 api 부팅 시 자동이라 별도 스텝 없음. 순수 로직(이름 검증/env 생성/정리 목록)은 분리해 단위 테스트, 실제 생성은 통합 스모크 스크립트로 실증.

**Tech Stack:** @clack/prompts(질문 UX), giget(템플릿 다운로드), tsup(발행 번들)

**참조 스펙:** §4.3
**선행:** Plan 4 완료 + drizzle-orm ^0.45.2 상향 (main b69eb3e)

## Global Constraints

- **예외 명시: `create-baro` 패키지는 `private` 아님** (npm 발행 대상). 나머지 `@baro/*`는 private 유지
- Biome 하나만. Conventional Commits. lockfile 규칙 (의존성 변경 → install + git status 증거 + lockfile 동일 커밋)
- rtk: pnpm exit 254 → `rtk proxy pnpm <동일 인자>`
- CLI 번들(tsup)은 발행용 빌드 — 코드젠 금지 원칙(타입 공유)과 무관, 허용
- `pnpm check`에는 create-cli의 typecheck+unit test만 포함. 통합 스모크(`pnpm smoke:create`)는 install 포함 수 분이라 게이트 제외 — 수동/릴리스 전 실행
- 생성물 프로젝트의 내부 패키지 스코프는 `@baro/*` 유지 (npm 미발행 내부 이름 — 루트 name만 프로젝트명으로 교체)

---

### Task 1: create-baro 패키지 — 순수 로직 + CLI

**Files:**
- Create: `tooling/create-cli/package.json`
- Create: `tooling/create-cli/tsconfig.json`
- Create: `tooling/create-cli/src/scaffold.ts` (순수 로직 — 테스트 대상)
- Create: `tooling/create-cli/src/index.ts` (CLI 엔트리)
- Test: `tooling/create-cli/src/scaffold.test.ts`

**Interfaces:**
- Consumes: 없음 (독립 패키지)
- Produces:
  - `validateProjectName(name): string | undefined` — 에러 메시지 반환(정상이면 undefined)
  - `generateEnvFiles(opts: { databaseUrl?: string }): { path: string; content: string }[]` — 상대경로+내용 목록
  - `SANITIZE_PATHS: string[]` — 생성물에서 제거할 경로 목록
  - `renameRootPackage(jsonText: string, name: string): string`
  - bin `create-baro` — 실행 플로우 전체

- [ ] **Step 1: package.json**

```json
{
  "name": "create-baro",
  "version": "0.1.0",
  "description": "Create a baro fullstack app — Hono + Next.js, typed end to end, running in minutes",
  "type": "module",
  "license": "MIT",
  "bin": {
    "create-baro": "./dist/index.js"
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsup src/index.ts --format esm --clean",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "@clack/prompts": "^0.10.0",
    "giget": "^2.0.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "tsup": "^8.0.0",
    "tsx": "^4.19.0",
    "typescript": "^5.8.0",
    "vitest": "^3.0.0"
  }
}
```

- [ ] **Step 2: tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "include": ["src"]
}
```

- [ ] **Step 3: 실패하는 테스트 작성**

`tooling/create-cli/src/scaffold.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  generateEnvFiles,
  renameRootPackage,
  SANITIZE_PATHS,
  validateProjectName,
} from "./scaffold";

describe("validateProjectName", () => {
  it("accepts kebab-case names", () => {
    expect(validateProjectName("my-app")).toBeUndefined();
    expect(validateProjectName("app2")).toBeUndefined();
  });
  it("rejects invalid names", () => {
    expect(validateProjectName("")).toBeTruthy();
    expect(validateProjectName("My App")).toBeTruthy();
    expect(validateProjectName("UPPER")).toBeTruthy();
    expect(validateProjectName(".hidden")).toBeTruthy();
  });
});

describe("generateEnvFiles", () => {
  it("creates api env with a strong random secret", () => {
    const files = generateEnvFiles({});
    const api = files.find((f) => f.path === "apps/api/.env");
    expect(api).toBeDefined();
    const secret = api?.content.match(/BETTER_AUTH_SECRET=(.+)/)?.[1] ?? "";
    expect(secret.length).toBeGreaterThanOrEqual(32);
    expect(api?.content).not.toContain("DATABASE_URL=");
  });

  it("two runs produce different secrets", () => {
    const a = generateEnvFiles({});
    const b = generateEnvFiles({});
    expect(a[0].content).not.toBe(b[0].content);
  });

  it("includes DATABASE_URL when postgres chosen", () => {
    const files = generateEnvFiles({
      databaseUrl: "postgres://u:p@localhost:5432/db",
    });
    const api = files.find((f) => f.path === "apps/api/.env");
    expect(api?.content).toContain(
      "DATABASE_URL=postgres://u:p@localhost:5432/db",
    );
  });

  it("creates web env pointing at the api", () => {
    const files = generateEnvFiles({});
    const web = files.find((f) => f.path === "apps/web/.env.local");
    expect(web?.content).toContain("NEXT_PUBLIC_API_URL=http://localhost:8000");
  });
});

describe("SANITIZE_PATHS", () => {
  it("removes internal-only paths", () => {
    for (const p of [
      ".git",
      "docs/superpowers",
      ".superpowers",
      "tooling",
      ".claude",
      ".agents",
      ".windsurf",
    ]) {
      expect(SANITIZE_PATHS).toContain(p);
    }
  });
});

describe("renameRootPackage", () => {
  it("replaces only the root name", () => {
    const input = JSON.stringify({ name: "baro", private: true }, null, 2);
    const out = JSON.parse(renameRootPackage(input, "my-app"));
    expect(out.name).toBe("my-app");
    expect(out.private).toBe(true);
  });
});
```

- [ ] **Step 4: 실패 확인** — `rtk proxy pnpm install && rtk proxy pnpm --filter create-baro test` → FAIL(모듈 없음)

- [ ] **Step 5: scaffold.ts 구현**

```ts
import { randomBytes } from "node:crypto";

export function validateProjectName(name: string): string | undefined {
  if (!name) return "Project name is required";
  if (!/^[a-z0-9][a-z0-9-]*$/.test(name)) {
    return "Use lowercase letters, numbers and dashes (must start with a letter or number)";
  }
  if (name.length > 100) return "Name too long";
  return undefined;
}

export function generateEnvFiles(opts: { databaseUrl?: string }): {
  path: string;
  content: string;
}[] {
  const secret = randomBytes(32).toString("base64url");
  const apiLines = [
    "# Generated by create-baro",
    "PORT=8000",
    "WEB_ORIGIN=http://localhost:3000",
    `BETTER_AUTH_SECRET=${secret}`,
    "BETTER_AUTH_URL=http://localhost:8000",
  ];
  if (opts.databaseUrl) {
    apiLines.push(`DATABASE_URL=${opts.databaseUrl}`);
  }
  return [
    { path: "apps/api/.env", content: `${apiLines.join("\n")}\n` },
    {
      path: "apps/web/.env.local",
      content: "NEXT_PUBLIC_API_URL=http://localhost:8000\n",
    },
  ];
}

/** Paths removed from the downloaded template — internal tooling and docs. */
export const SANITIZE_PATHS = [
  ".git",
  "docs/superpowers",
  ".superpowers",
  "tooling",
  ".claude",
  ".agents",
  ".windsurf",
  "skills-lock.json",
];

export function renameRootPackage(jsonText: string, name: string): string {
  const pkg = JSON.parse(jsonText);
  pkg.name = name;
  return `${JSON.stringify(pkg, null, 2)}\n`;
}
```

- [ ] **Step 6: index.ts 구현**

```ts
#!/usr/bin/env node
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import * as p from "@clack/prompts";
import { downloadTemplate } from "giget";
import {
  generateEnvFiles,
  renameRootPackage,
  SANITIZE_PATHS,
  validateProjectName,
} from "./scaffold";

const TEMPLATE = "github:yg-cho/baro#main";

async function main() {
  p.intro("create-baro — fullstack app, right away");

  const name = await p.text({
    message: "Project name",
    placeholder: "my-baro-app",
    validate: validateProjectName,
  });
  if (p.isCancel(name)) return cancel();

  const db = await p.select({
    message: "Database",
    options: [
      {
        value: "pglite",
        label: "Embedded (PGlite)",
        hint: "zero setup, start now — switch to Postgres later",
      },
      { value: "postgres", label: "Postgres", hint: "I have a DATABASE_URL" },
    ],
  });
  if (p.isCancel(db)) return cancel();

  let databaseUrl: string | undefined;
  if (db === "postgres") {
    const url = await p.text({
      message: "Postgres connection string",
      placeholder: "postgres://user:pass@localhost:5432/mydb",
      validate: (v) =>
        v.startsWith("postgres") ? undefined : "Must be a postgres:// URL",
    });
    if (p.isCancel(url)) return cancel();
    databaseUrl = url;
  }

  const dir = resolve(process.cwd(), name);
  if (existsSync(dir)) {
    p.cancel(`Directory ${name} already exists`);
    process.exit(1);
  }

  const s = p.spinner();

  s.start("Downloading template");
  const localTemplate = process.env.CREATE_BARO_TEMPLATE_DIR;
  if (localTemplate) {
    await mkdir(dir, { recursive: true });
    await cp(localTemplate, dir, { recursive: true });
  } else {
    await downloadTemplate(TEMPLATE, { dir });
  }
  s.stop("Template ready");

  s.start("Tidying up");
  for (const path of SANITIZE_PATHS) {
    await rm(join(dir, path), { recursive: true, force: true });
  }
  const rootPkgPath = join(dir, "package.json");
  await writeFile(
    rootPkgPath,
    renameRootPackage(await readFile(rootPkgPath, "utf8"), name),
  );
  for (const file of generateEnvFiles({ databaseUrl })) {
    await writeFile(join(dir, file.path), file.content);
  }
  s.stop("Project configured");

  const skipInstall = process.argv.includes("--skip-install");
  if (!skipInstall) {
    s.start("Installing dependencies (this is the slow part)");
    const res = spawnSync("pnpm", ["install"], { cwd: dir, stdio: "pipe" });
    if (res.status !== 0) {
      s.stop("Install failed — run `pnpm install` manually");
    } else {
      s.stop("Dependencies installed");
    }
  }

  spawnSync("git", ["init", "-b", "main"], { cwd: dir, stdio: "ignore" });
  spawnSync("git", ["add", "-A"], { cwd: dir, stdio: "ignore" });
  spawnSync("git", ["commit", "-m", "chore: scaffold with create-baro"], {
    cwd: dir,
    stdio: "ignore",
  });

  p.note(
    [
      `cd ${name}`,
      skipInstall ? "pnpm install" : null,
      "pnpm dev            # web :3000 + api :8000",
      "pnpm seed:admin you@example.com yourpassword   # first admin",
    ]
      .filter(Boolean)
      .join("\n"),
    "Next steps",
  );
  p.outro("Done. It just runs.");
}

function cancel() {
  p.cancel("Cancelled");
  process.exit(1);
}

main();
```

- [ ] **Step 7: 통과 확인** — `rtk proxy pnpm --filter create-baro test`(단위 테스트 전부), `typecheck`, `build`(dist 생성) 각각 성공. `rtk proxy pnpm check` 그린(전 워크스페이스).

- [ ] **Step 8: Commit**

```bash
git add tooling pnpm-lock.yaml
git commit -m "feat(cli): add create-baro scaffolding cli"
```

---

### Task 2: 통합 스모크 실증

**Files:**
- Modify: 루트 `package.json` (`smoke:create` 스크립트)
- Create: `tooling/create-cli/smoke.sh`

**Interfaces:**
- Produces: `pnpm smoke:create` — 로컬 템플릿 모드로 /tmp에 프로젝트 생성 → install → api 부팅 → /health ok → web 홈 200 → 정리. 릴리스 전 수동 게이트

- [ ] **Step 1: smoke.sh 작성**

`tooling/create-cli/smoke.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
WORK_DIR="$(mktemp -d /tmp/baro-smoke.XXXXXX)"
APP_NAME="smoke-app"
API_PORT=8200

cleanup() {
  pkill -f "$WORK_DIR" 2>/dev/null || true
  rm -rf "$WORK_DIR"
}
trap cleanup EXIT

echo "==> building cli"
pnpm --filter create-baro build

echo "==> scaffolding into $WORK_DIR"
cd "$WORK_DIR"
CREATE_BARO_TEMPLATE_DIR="$REPO_ROOT" node "$REPO_ROOT/tooling/create-cli/dist/index.js" --skip-install <<EOF
$APP_NAME

EOF

cd "$WORK_DIR/$APP_NAME"
test -f apps/api/.env || { echo "FAIL: api .env missing"; exit 1; }
test ! -d tooling || { echo "FAIL: tooling not sanitized"; exit 1; }
test ! -d docs/superpowers || { echo "FAIL: internal docs not sanitized"; exit 1; }
grep -q "\"name\": \"$APP_NAME\"" package.json || { echo "FAIL: root rename"; exit 1; }

echo "==> installing"
pnpm install

echo "==> booting api"
PORT=$API_PORT PGLITE_DATA_DIR="$WORK_DIR/pglite" pnpm --filter @baro/api dev &
API_PID=$!
for i in $(seq 1 30); do
  sleep 1
  if curl -sf "http://localhost:$API_PORT/health" | grep -q '"ok"'; then
    echo "==> health ok"
    kill $API_PID
    echo "SMOKE PASS"
    exit 0
  fi
done
echo "FAIL: api never became healthy"
kill $API_PID 2>/dev/null || true
exit 1
```

주의: `<<EOF` 히어독으로 clack 프롬프트에 응답하는 방식은 clack의 raw-mode TTY 처리에 따라 안 먹을 수 있음 — 그 경우 CLI에 비대화 플래그(`--name <name> --db pglite`)를 추가해 스모크는 플래그 경로로 실행하고, 플래그 파싱을 scaffold.ts 테스트에 추가할 것 (실용 우선, 보고).

- [ ] **Step 2: 루트 스크립트**

루트 `package.json` scripts에:

```json
"smoke:create": "bash tooling/create-cli/smoke.sh"
```

- [ ] **Step 3: 스모크 실행** — `rtk proxy pnpm smoke:create` → `SMOKE PASS`. 출력 전문 보고서에.

- [ ] **Step 4: Commit**

```bash
git add tooling package.json
git commit -m "test(cli): add create-baro integration smoke script"
```

---

### Task 3: 게이트 + 머지 준비

- [ ] **Step 1:** `rtk proxy pnpm check` 그린
- [ ] **Step 2:** `rtk proxy pnpm install --frozen-lockfile && git status --short` 클린
- [ ] **Step 3:** `git push -u origin feat/create-cli` 후 보고

---

## 완료 기준 (Plan 5)

- 로컬 스모크: 생성 → install → api health ok (마이그레이션 자동 포함)
- 생성물에 내부 문서/CLI/에이전트 설정 없음, 루트 이름 교체, 시크릿 랜덤
- `--skip-install` 동작, 이미 존재하는 디렉토리 거부
- npm 발행은 유저 수동 (README에 Plan 6에서 안내). GitHub 다운로드 경로(giget)는 레포 public이라 즉시 동작
- 다음: Plan 6 문서 (README, ARCHITECTURE.md, recipes)

## 리스크 노트

- giget 실제 API(`downloadTemplate` 시그니처)는 설치 버전 문서 기준 조정 허용
- clack 프롬프트의 파이프 입력 문제 → 비대화 플래그로 우회 (Step 1 주의 참조)
- 스모크에서 포트 8200 사용 (8000/8100 점유·예약 회피)
- 생성물의 pnpm-workspace.yaml에 tooling/* glob이 남지만 빈 매치라 무해 — 문서화만
