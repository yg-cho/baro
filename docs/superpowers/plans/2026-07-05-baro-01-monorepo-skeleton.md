# baro Plan 1/6 — 모노레포 뼈대 + web/api 타입 공유 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** pnpm+Turborepo 모노레포에서 Hono API와 Next.js web이 RPC 타입 공유로 연결되고, `pnpm dev` 하나로 켜지고 `pnpm check` 하나로 검증되는 뼈대를 만든다.

**Architecture:** `apps/api`(Hono, :8000)와 `apps/web`(Next.js, :3000)를 분리하고 `packages/shared`의 zod 스키마를 양쪽이 소비한다. api가 `AppType`을 export하면 web의 `hc` 클라이언트가 타입을 무코드젠으로 이어받는다 — 이 연결 확인이 이 계획의 핵심 산출물.

**Tech Stack:** pnpm workspaces, Turborepo 2, TypeScript 5(strict), Hono 4 + @hono/zod-openapi, Next.js 15(App Router), zod 4, Biome 2, Vitest 3, Node 22

**참조 스펙:** `docs/superpowers/specs/2026-07-05-baro-fullstack-design.md`

## Global Constraints

- 패키지 네이밍: `@baro/<이름>` 스코프, 전부 `"private": true`
- Node `>=22`, pnpm 10 (`packageManager` 필드로 고정)
- 포트: web `3000`, api `8000`
- 코드젠 금지 — 타입은 TS 추론(Hono RPC)으로만 공유
- 린트/포맷 도구는 Biome 하나만 (eslint/prettier 설치 금지)
- 내부 패키지는 TS 소스 직접 export (빌드 스텝 없음)
- 커밋 메시지는 Conventional Commits (`feat:`, `chore:`, `test:` 등)

---

### Task 1: 워크스페이스 루트 설정

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `turbo.json`
- Create: `biome.json`
- Create: `tsconfig.base.json`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: 없음 (첫 태스크)
- Produces: 루트 스크립트 `pnpm dev` / `pnpm check`, 모든 패키지가 extends할 `tsconfig.base.json`, Turbo 태스크 이름 `dev`/`typecheck`/`test`/`build`

- [ ] **Step 1: 루트 package.json 작성**

```json
{
  "name": "baro",
  "private": true,
  "packageManager": "pnpm@10.12.1",
  "engines": {
    "node": ">=22"
  },
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "check": "turbo run typecheck test && biome check .",
    "lint": "biome check .",
    "format": "biome format --write ."
  },
  "devDependencies": {
    "@biomejs/biome": "^2.0.0",
    "turbo": "^2.5.0"
  }
}
```

- [ ] **Step 2: pnpm-workspace.yaml 작성**

```yaml
packages:
  - "apps/*"
  - "packages/*"
  - "tooling/*"
```

- [ ] **Step 3: turbo.json 작성**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "typecheck": {},
    "test": {}
  }
}
```

- [ ] **Step 4: biome.json 작성**

```json
{
  "$schema": "https://biomejs.dev/schemas/2.0.0/schema.json",
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true
  },
  "files": {
    "ignoreUnknown": true
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space"
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true
    }
  }
}
```

- [ ] **Step 5: tsconfig.base.json 작성**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true,
    "noEmit": true
  }
}
```

- [ ] **Step 6: .gitignore에 빌드 산출물 추가**

기존 `.gitignore` 끝에 추가:

```
node_modules/
.next/
dist/
.turbo/
coverage/
*.env.local
.env
```

- [ ] **Step 7: 설치 및 검증**

Run: `pnpm install`
Expected: 락파일 생성, 에러 없음

Run: `pnpm lint`
Expected: `Checked N files ... No fixes applied` (에러 0)

- [ ] **Step 8: Commit**

```bash
git add package.json pnpm-workspace.yaml turbo.json biome.json tsconfig.base.json .gitignore pnpm-lock.yaml
git commit -m "chore: scaffold pnpm workspace with turborepo and biome"
```

---

### Task 2: packages/shared — 공용 zod 스키마

**Files:**
- Create: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`
- Create: `packages/shared/src/schemas/health.ts`
- Test: `packages/shared/src/schemas/health.test.ts`

**Interfaces:**
- Consumes: `tsconfig.base.json` (Task 1)
- Produces: `@baro/shared/schemas/health`에서 `healthResponseSchema: z.ZodObject`(`{ status: z.literal('ok') }`)와 `type HealthResponse = { status: 'ok' }` export. Task 3의 api 라우트가 이 스키마를 응답 정의에 사용.

- [ ] **Step 1: package.json 작성**

```json
{
  "name": "@baro/shared",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    "./schemas/*": "./src/schemas/*.ts"
  },
  "scripts": {
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "zod": "^4.0.0"
  },
  "devDependencies": {
    "typescript": "^5.8.0",
    "vitest": "^3.0.0"
  }
}
```

- [ ] **Step 2: tsconfig.json 작성**

```json
{
  "extends": "../../tsconfig.base.json",
  "include": ["src"]
}
```

- [ ] **Step 3: 실패하는 테스트 작성**

`packages/shared/src/schemas/health.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { healthResponseSchema } from "./health";

describe("healthResponseSchema", () => {
  it("accepts { status: 'ok' }", () => {
    expect(healthResponseSchema.parse({ status: "ok" })).toEqual({
      status: "ok",
    });
  });

  it("rejects other status values", () => {
    expect(() => healthResponseSchema.parse({ status: "down" })).toThrow();
  });
});
```

- [ ] **Step 4: 테스트 실패 확인**

Run: `pnpm install && pnpm --filter @baro/shared test`
Expected: FAIL — `Cannot find module './health'` 또는 유사 모듈 없음 에러

- [ ] **Step 5: 스키마 구현**

`packages/shared/src/schemas/health.ts`:

```ts
import { z } from "zod";

export const healthResponseSchema = z.object({
  status: z.literal("ok"),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;
```

- [ ] **Step 6: 테스트 통과 확인**

Run: `pnpm --filter @baro/shared test`
Expected: PASS — 2 passed

Run: `pnpm --filter @baro/shared typecheck`
Expected: 에러 없음

- [ ] **Step 7: Commit**

```bash
git add packages/shared pnpm-lock.yaml
git commit -m "feat(shared): add health response schema"
```

---

### Task 3: apps/api — Hono 앱 + health 모듈

**Files:**
- Create: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/src/app.ts`
- Create: `apps/api/src/index.ts`
- Create: `apps/api/src/client.ts`
- Create: `apps/api/src/modules/health/routes.ts`
- Test: `apps/api/src/modules/health/routes.test.ts`

**Interfaces:**
- Consumes: `healthResponseSchema` (Task 2)
- Produces: `@baro/api/client`에서 `type AppType` export — Task 4의 web이 `hc<AppType>`으로 소비. 라우트 경로 `GET /health` → `200 { status: "ok" }`. 서버 실행 시 `:8000` 리슨, `WEB_ORIGIN` env로 CORS 허용 오리진 설정(기본 `http://localhost:3000`).

- [ ] **Step 1: package.json 작성**

```json
{
  "name": "@baro/api",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/app.ts",
    "./client": "./src/client.ts"
  },
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "@baro/shared": "workspace:*",
    "@hono/node-server": "^1.14.0",
    "@hono/zod-openapi": "^1.0.0",
    "hono": "^4.7.0",
    "zod": "^4.0.0"
  },
  "devDependencies": {
    "tsx": "^4.19.0",
    "typescript": "^5.8.0",
    "vitest": "^3.0.0"
  }
}
```

- [ ] **Step 2: tsconfig.json 작성**

```json
{
  "extends": "../../tsconfig.base.json",
  "include": ["src"]
}
```

- [ ] **Step 3: 실패하는 테스트 작성**

`apps/api/src/modules/health/routes.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { app } from "../../app";

describe("GET /health", () => {
  it("returns 200 with { status: 'ok' }", async () => {
    const res = await app.request("/health");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "ok" });
  });
});
```

- [ ] **Step 4: 테스트 실패 확인**

Run: `pnpm install && pnpm --filter @baro/api test`
Expected: FAIL — `Cannot find module '../../app'`

- [ ] **Step 5: health 라우트 구현**

`apps/api/src/modules/health/routes.ts`:

```ts
import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { healthResponseSchema } from "@baro/shared/schemas/health";

export const healthRoutes = new OpenAPIHono().openapi(
  createRoute({
    method: "get",
    path: "/",
    responses: {
      200: {
        description: "Service health",
        content: {
          "application/json": { schema: healthResponseSchema },
        },
      },
    },
  }),
  (c) => c.json({ status: "ok" as const }, 200),
);
```

- [ ] **Step 6: 앱 조립 + 서버 엔트리 + 클라이언트 타입 export 구현**

`apps/api/src/app.ts`:

```ts
import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { healthRoutes } from "./modules/health/routes";

export const app = new OpenAPIHono()
  .use(
    cors({ origin: process.env.WEB_ORIGIN ?? "http://localhost:3000" }),
  )
  .route("/health", healthRoutes);

app.doc("/openapi.json", {
  openapi: "3.1.0",
  info: { title: "baro API", version: "0.0.0" },
});

export type AppType = typeof app;
```

`apps/api/src/index.ts`:

```ts
import { serve } from "@hono/node-server";
import { app } from "./app";

const port = Number(process.env.PORT ?? 8000);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`baro api listening on http://localhost:${info.port}`);
});
```

`apps/api/src/client.ts`:

```ts
export type { AppType } from "./app";
```

- [ ] **Step 7: 테스트 통과 확인**

Run: `pnpm --filter @baro/api test`
Expected: PASS — 1 passed

Run: `pnpm --filter @baro/api typecheck`
Expected: 에러 없음

- [ ] **Step 8: 서버 수동 기동 확인**

Run: `pnpm --filter @baro/api dev` (백그라운드), 이후 `curl -s http://localhost:8000/health`
Expected: `{"status":"ok"}`

Run: `curl -s http://localhost:8000/openapi.json | head -c 100`
Expected: OpenAPI JSON 시작부 출력. 확인 후 dev 프로세스 종료.

- [ ] **Step 9: Commit**

```bash
git add apps/api pnpm-lock.yaml
git commit -m "feat(api): add hono app with health module and rpc type export"
```

---

### Task 4: apps/web — Next.js + 타입 공유 클라이언트

**Files:**
- Create: `apps/web/` (create-next-app 스캐폴드)
- Modify: `apps/web/package.json`
- Create: `apps/web/src/lib/api.ts`
- Modify: `apps/web/src/app/page.tsx`
- Create: `apps/web/.env.example`

**Interfaces:**
- Consumes: `type AppType` (`@baro/api/client`, Task 3)
- Produces: `src/lib/api.ts`에서 `api = hc<AppType>(...)` — 이후 모든 web 기능이 이 클라이언트로 api 호출. 페이지 `/`가 api health를 표시.

- [ ] **Step 1: Next.js 스캐폴드 생성**

Run:

```bash
pnpm create next-app@latest apps/web --ts --tailwind --app --src-dir --import-alias "@/*" --no-eslint --use-pnpm --skip-install
```

Expected: `apps/web`에 Next.js 프로젝트 생성. 플래그가 인터랙티브 질문으로 나오면 동일 내용으로 답변 (ESLint: No — Biome 사용).

- [ ] **Step 2: package.json 수정**

`apps/web/package.json`을 다음으로 교체 (Next가 생성한 버전 숫자는 유지하되 name/scripts/deps 아래 형태로):

```json
{
  "name": "@baro/web",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@baro/api": "workspace:*",
    "@baro/shared": "workspace:*",
    "hono": "^4.7.0",
    "next": "^15.3.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4.0.0",
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "tailwindcss": "^4.0.0",
    "typescript": "^5.8.0"
  }
}
```

- [ ] **Step 3: 타입 공유 클라이언트 작성**

`apps/web/src/lib/api.ts`:

```ts
import { hc } from "hono/client";
import type { AppType } from "@baro/api/client";

export const api = hc<AppType>(
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000",
);
```

- [ ] **Step 4: 홈 페이지를 health 표시로 교체**

`apps/web/src/app/page.tsx` 전체 교체:

```tsx
import { api } from "@/lib/api";

async function getHealthStatus(): Promise<string> {
  try {
    const res = await api.health.$get();
    const body = await res.json();
    return body.status;
  } catch {
    return "unreachable";
  }
}

export default async function Home() {
  const status = await getHealthStatus();
  return (
    <main className="flex min-h-screen items-center justify-center">
      <p className="font-mono text-lg">
        baro — api status: <span className="font-bold">{status}</span>
      </p>
    </main>
  );
}
```

- [ ] **Step 5: .env.example 작성**

`apps/web/.env.example`:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

- [ ] **Step 6: 설치 및 타입체크 (타입 공유 검증 핵심)**

Run: `pnpm install && pnpm --filter @baro/web typecheck`
Expected: 에러 없음. `api.health.$get()`이 컴파일된다 = RPC 타입 공유 동작 증명.

검증 보강 — `page.tsx`의 `body.status`를 `body.nonexistent`로 임시 변경 후 재실행:
Expected: FAIL — `Property 'nonexistent' does not exist`. 확인 후 원복. (타입이 진짜 전파되는지 음성 테스트)

- [ ] **Step 7: 통합 기동 확인**

Run: 루트에서 `pnpm dev` (백그라운드)
Expected: web(:3000)과 api(:8000) 동시 기동

Run: `curl -s http://localhost:3000 | grep -o "api status: <[^<]*"`
Expected: `ok` 포함 출력. 확인 후 dev 종료.

- [ ] **Step 8: Commit**

```bash
git add apps/web pnpm-lock.yaml
git commit -m "feat(web): add next.js app with typed hono rpc client"
```

---

### Task 5: 검증 게이트 + CI

**Files:**
- Create: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: 루트 `pnpm check` (Task 1), 각 패키지의 `typecheck`/`test` 스크립트 (Task 2-4)
- Produces: push/PR마다 `pnpm check` 실행하는 CI. 로컬 = CI 동일 명령 보장.

- [ ] **Step 1: 로컬 전체 게이트 통과 확인**

Run: `pnpm check`
Expected: 모든 패키지 typecheck + test 통과, biome 에러 0. 실패 시 여기서 수정 후 진행.

- [ ] **Step 2: CI 워크플로 작성**

`.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm check
```

- [ ] **Step 3: Commit + Push**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: run pnpm check on push and pr"
git push
```

- [ ] **Step 4: CI 통과 확인**

Run: `gh run watch --exit-status` (또는 `gh run list --limit 1`)
Expected: CI `check` 잡 성공

---

## 완료 기준 (Plan 1)

- `pnpm dev` 하나로 web + api 동시 기동, `/`에서 `api status: ok` 표시
- api 라우트 수정 시 web 타입이 즉시 반영 (코드젠 없음)
- `pnpm check` = typecheck + test + biome, 로컬과 CI 동일
- 이후 계획: Plan 2 DB+인증, Plan 3 관리자, Plan 4 예제 기능(todos), Plan 5 create-baro CLI, Plan 6 문서
