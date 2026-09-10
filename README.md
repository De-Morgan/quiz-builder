# Quiz Builder

A quiz builder. Authenticated users create, edit, and publish quizzes; anonymous
visitors take a published quiz via a shared link and see only their score.

## Monorepo layout

pnpm + Turborepo workspace. Two decoupled apps: the API is client-agnostic (REST
only, no coupling to the web frontend).

| Path                                                       | What                                                                                                  |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| [`apps/api`](apps/api)                                     | NestJS 11 REST API, Prisma 7 + PostgreSQL. See[apps/api/README.md](apps/api/README.md).               |
| [`apps/web`](apps/web)                                     | Next.js 16 (App Router, React 19) frontend, axios + SWR. See[apps/web/README.md](apps/web/README.md). |
| [`packages/eslint-config`](packages/eslint-config)         | Shared ESLint configs                                                                                 |
| [`packages/typescript-config`](packages/typescript-config) | Shared`tsconfig` bases                                                                                |

## Getting started

Requires Node >= 24, pnpm 11, and Docker (for the local Postgres container).

```bash
pnpm install

# API — starts Postgres, applies migrations, then watch mode
cd apps/api
cp .env.example .env
pnpm dev                         # http://localhost:3001, Swagger at /docs

# Web (separate terminal)
cd apps/web
cp .env.example .env.local       # NEXT_PUBLIC_API_URL=http://localhost:3001
pnpm dev                         # http://localhost:3000
```

## Scripts (run from the repo root via Turborepo)

| Command            | Description                     |
| ------------------ | ------------------------------- |
| `pnpm dev`         | Run every app in dev/watch mode |
| `pnpm build`       | Build all apps                  |
| `pnpm lint`        | Lint all packages               |
| `pnpm test`        | Run all unit test suites        |
| `pnpm check-types` | Type-check all packages         |
| `pnpm format`      | Prettier over the repo          |

Per-app commands (single-spec runs, e2e, Prisma, etc.) are documented in each
app's README.
