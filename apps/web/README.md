# Quiz Builder — Web (`apps/web`)

Next.js 16 (App Router, React 19) SPA-style frontend for the Quiz Builder.
Authenticated users build, edit, and publish quizzes; anonymous visitors take a
published quiz via a shared link and see their score.

See [`WEBPLAN.md`](WEBPLAN.md) for the full build plan and the root
[`PLAN.md`](../../PLAN.md) for product scope.

## Architecture

- **API is the only data source.** All fetching happens in client components via
  `axios` + `SWR`. No server components hitting the DB, no route handlers proxying
  business logic.
- The public take payload never contains `isCorrect`; the UI does not depend on it.
- The server enforces every domain rule; `lib/validation.ts` mirrors the
  invariants for UX only.
- UI primitives are copied-in [shadcn/ui](https://ui.shadcn.com) components under
  `components/ui/`, styled with Tailwind CSS v4.

### Layout

```
lib/         types, endpoints (single source of API paths + routes), token,
             axios instance + interceptors, SWR fetcher, mutation helpers, validation
components/  ui/ (shadcn primitives) + app components (Nav, RequireAuth,
             QuizForm, QuestionEditor, ScoreCard, PermalinkCopy, Field, Spinner)
app/         providers + shell; login, register, dashboard (home /),
             quizzes/new, quizzes/[id]/edit, q/[permalink] (public take)
```

## Getting started

```bash
# from the repo root
pnpm install

# 1. start the API (see apps/api/README.md)
cd apps/api && docker compose up -d && pnpm prisma migrate dev && pnpm start:dev

# 2. start the web app
cd apps/web
cp .env.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:3001
pnpm dev                      # http://localhost:3000
```

## Environment

| Variable | Default | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001` | Base URL of the NestJS API |

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Dev server on port 3000 |
| `pnpm build` | Production build (also verifies Tailwind/shadcn wiring) |
| `pnpm start` | Serve the production build |
| `pnpm lint` | ESLint (`--max-warnings 0`) |
| `pnpm check-types` | `next typegen` + `tsc --noEmit` |
| `pnpm test` | Vitest run |
| `pnpm test:watch` | Vitest watch mode |

## Testing

Vitest + React Testing Library (`jsdom`). Specs are co-located as `*.test.ts(x)`.
`vitest.setup.ts` polyfills the browser APIs Radix primitives need under jsdom.
`axios`/`api` is mocked with `vi.mock`; SWR is isolated by wrapping renders in a
fresh `<SWRConfig>` cache.
