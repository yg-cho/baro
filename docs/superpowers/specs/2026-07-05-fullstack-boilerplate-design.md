# 오픈소스 풀스택 보일러플레이트 — 설계 문서

날짜: 2026-07-05
상태: 승인됨 (브레인스토밍 완료)

## 1. 개요

프론트엔드와 백엔드가 한 쌍으로 구성된 온전한 풀스택 보일러플레이트.
오픈소스로 공개하며, 누구든 받아서 실행하면 바로 동작하고 커스텀은 유저가 직접 한다.

**목표**
- 오픈소스 커뮤니티/포트폴리오: GitHub 스타, 기여자, 인지도
- AI 에이전트 친화: AI가 이어받아 개발하기 최적화된 구조 (특정 AI 도구 종속 없이, 구조 자체로)

**성공 기준**
- clone부터 브라우저 로그인 화면까지 3분, 마법사 질문 2개
- 기능 추가가 항상 같은 패턴의 복제로 가능 (사람과 AI 모두)
- `pnpm check` 하나로 전체 검증

**범위 제외 (YAGNI)**
- 결제/구독 (Stripe 등)
- 멀티테넌시
- 이메일 발송 인프라 (개발: 콘솔 출력, 프로덕션: SMTP env만 지원)

## 2. 저장소 구조

```
repo/
├── apps/
│   ├── web/                  # Next.js (App Router)
│   │   └── src/features/<기능>/   # 기능별 폴더: 컴포넌트 + 훅 + 쿼리
│   └── api/                  # Hono (Node 런타임)
│       └── src/modules/<기능>/    # 기능별 폴더: routes.ts + service.ts + schema.ts
├── packages/
│   ├── db/                   # Drizzle 스키마 + 마이그레이션
│   ├── auth/                 # Better Auth 설정 (api가 소비)
│   └── shared/               # zod 스키마, 공용 타입
├── tooling/create-cli/       # npx create-xxx 마법사
└── docs/                     # 레시피 문서
```

## 3. 기술 스택

| 역할 | 선택 | 이유 |
|---|---|---|
| 프론트 | Next.js (App Router) + TanStack Query | 프론트 개발자 표준 |
| UI | shadcn 방식(코드 복사·소유) + Base UI 프리미티브 | 의존성 아닌 소유 코드 = 직접 커스텀. Headless UI는 컴포넌트 수 부족으로 제외 |
| 아키텍처 | Vercel 스타일 기능 폴더 + colocation | FSD는 이 규모에 과함. FSD 전환 레시피만 docs에 제공 |
| 백엔드 | Hono + `@hono/zod-openapi` (Node 런타임) | Next Route Handler와 유사 문법, RPC 타입 공유 무코드젠, OpenAPI 스펙 공짜. Bun 필수 아님 |
| 타입 공유 | Hono RPC (`hc` 클라이언트) | 라우트 수정 → 타입 자동 전파. orval 등 코드젠은 유저 선택지로 docs 레시피 제공 |
| DB | Drizzle + Postgres (개발 기본: PGlite 임베디드) | 코드젠 제로 원칙 부합, PGlite 네이티브 지원. Prisma는 코드젠 필수 + PGlite 프리뷰 수준이라 제외 |
| 인증 | Better Auth | TS 네이티브, Hono + Drizzle 궁합, admin 플러그인 내장 |
| 모노레포 | pnpm workspaces + Turborepo | 커뮤니티 표준, AI 친숙도 높음 |
| 린트/포맷 | Biome | 도구 1개로 eslint + prettier 대체 |
| 테스트 | Vitest + Playwright | 표준 |

## 4. 기능 상세

### 4.1 인증 (Better Auth)
- 이메일/비밀번호 + Google, GitHub 소셜 로그인
  - 소셜: env에 키 있으면 활성, 없으면 UI에서 자동 숨김
- 세션 기반 인증, 비밀번호 재설정, 이메일 인증
  - 이메일: 개발 모드 콘솔 출력, 프로덕션 SMTP env
- 프론트 완성 상태: 로그인/가입/재설정 페이지 + `useSession` 훅

### 4.2 관리자 대시보드 (`/admin`)
- Better Auth admin 플러그인 기반: 유저 목록/검색/정지/역할 변경
- 기본 통계: 가입자 수, 최근 가입 추이 (차트 1개)
- `admin` role만 접근 가능
- 첫 어드민은 seed 스크립트로 생성

### 4.3 설치 마법사 (`npx create-<이름>`)
질문 2개:
1. 프로젝트명
2. DB — 임베디드(PGlite, 바로 시작) / 내 Postgres (URL 입력)

이후 자동: 템플릿 복사 → `.env` 생성(시크릿 랜덤 생성) → `pnpm install` → 마이그레이션 → `pnpm dev` 안내.

### 4.4 개발 경험
- `pnpm dev` 하나로 web(3000) + api(8000) 동시 실행
- `pnpm check` 하나로 typecheck + biome + vitest + playwright 전부

## 5. AI 친화 설계

### 기능 추가 공식
새 기능 = 항상 같은 4파일 세트:

```
packages/shared/src/schemas/<기능>.ts        # zod 스키마 (한 곳에만)
apps/api/src/modules/<기능>/routes.ts        # Hono 라우트 (+ service.ts 선택)
apps/web/src/features/<기능>/                # 컴포넌트 + 쿼리 훅
apps/api/src/modules/<기능>/routes.test.ts   # 테스트
```

- 레포에 예제 기능 1개(`todos` CRUD) 포함 — 사람과 AI 모두 이것을 복제
- 예제 기능은 격리되어 있어 삭제 쉬움
- `ARCHITECTURE.md`에 이 공식 명문화 — 특정 AI 도구 설정 파일 없이도 어떤 AI든 이 파일로 구조 파악

### 검증 자동화
- `pnpm check` = 전체 게이트
- CI(GitHub Actions)는 같은 명령 실행 → 로컬 = CI 동일 보장
- E2E smoke 3개만: 가입 → 로그인 → 관리자 진입

## 6. 에러 처리 규약

- API: zod 검증 실패 = 400 + 필드별 메시지
- 모든 예외 = 표준 포맷 `{ error: { code, message } }` 하나로 통일
- 프론트: TanStack Query 에러 바운더리 + toast, 패턴 1개만

## 7. 문서 구성

- `README.md`: 3분 시작 가이드
- `ARCHITECTURE.md`: 기능 추가 공식 + 폴더 규칙 (사람용이자 AI용)
- `docs/recipes/`:
  - orval 코드젠 붙이기 (OpenAPI 스펙 활용)
  - PGlite → Postgres 전환
  - 배포: Vercel(web) + Railway(api) 각 1개
  - 소셜 로그인 키 발급
  - FSD 아키텍처 전환
  - Hono RPC 타입 추론 느려질 때 프리컴파일

## 8. 구현 순서

1. 모노레포 뼈대 + web/api 연결 (Hono RPC 타입 공유 확인)
2. DB(Drizzle + PGlite/Postgres) + 인증(Better Auth)
3. 관리자 대시보드
4. 예제 기능(todos) + 테스트 + `pnpm check` 게이트
5. 마법사 CLI (`tooling/create-cli`)
6. 문서 (README, ARCHITECTURE, recipes)

## 9. 결정 기록

| 결정 | 대안 | 선택 이유 |
|---|---|---|
| 모노레포 web+api 분리 (B안) | Next.js 단일 앱 (A안) | 프론트·백 "한 쌍" 정체성, 경계 명확 = AI 판단 용이 |
| Hono | NestJS, Fastify | NestJS는 데코레이터 마법 = 프론트 개발자·AI 모두에 불리. Fastify는 타입 공유에 코드젠 필요 |
| Hono RPC | zod + orval 코드젠 | 코드젠 스텝 제로. orval은 docs 레시피로 |
| shadcn 방식 + Base UI | 순수 base-ui/headless-ui | 순수 헤드리스만 주면 스타일을 유저가 전부 작성해야 함 — "바로 켜진다" 위반 |
| Vercel 스타일 폴더 | FSD | 레이어 6개는 이 규모에 과함, AI가 widgets/entities 구분 자주 틀림 |
| Drizzle | Prisma | 코드젠 제로 원칙, PGlite 네이티브 지원 |
| PGlite 개발 기본 | Docker Postgres | Docker 없이 켜짐 |
