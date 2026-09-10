# Quiz Builder API

NestJS REST API for the Quiz Builder. Authenticated users create quizzes; anonymous
visitors take published quizzes via a permalink and get back only their score.

The API is client-agnostic — it exposes REST only and has no coupling to the web
frontend in `apps/web`.

## Stack

- **NestJS 11** (Express platform)
- **Prisma 7** ORM against **PostgreSQL** (pg driver adapter)
- **JWT** auth via `@nestjs/passport` / `passport-jwt`, passwords hashed with `bcrypt`
- **class-validator** / **class-transformer** DTO validation (global `ValidationPipe`,
  `whitelist` + `transform`)
- **helmet** + CORS (`WEB_ORIGIN`)
- **Swagger** UI at `/docs` (non-production only)
- Health checks via `@nestjs/terminus` at `/health`

## Project layout

```
src/
  main.ts              bootstrap: helmet, CORS, ValidationPipe, Swagger
  app.module.ts
  config/              typed env config
  core/                logger, response interceptor, request-logger middleware
  database/            Prisma schema, generated client, migrations, DatabaseService
  health/              /health endpoints
  common/              permalink generator (6-char alphanumeric, uniqueness-checked)
  modules/
    auth/              register, login, JWT, /me
    quizzes/           owner-scoped CRUD + publish + question management
    public/            unauthenticated permalink lookup + scoring
```

## Setup

Requires Node, pnpm, and Docker (for the local Postgres container).

```bash
pnpm install
cp .env.example .env      # adjust secrets as needed
```

## Running

```bash
# starts the Postgres container, applies migrations, then watch mode
pnpm dev

# plain start / prod
pnpm start
pnpm start:prod
```

The server listens on `PORT` (default `3001`). Swagger UI: `http://localhost:3001/docs`.

## Database

```bash
pnpm db:migrate      # create + apply a migration (prisma migrate dev)
pnpm db:deploy       # apply migrations (prisma migrate deploy)
pnpm db:generate     # regenerate the Prisma client
pnpm db:reset        # drop + recreate + re-migrate
pnpm db:studio       # Prisma Studio
pnpm db:seed         # populate demo data (demo@user.com / password)
```

Data model: `User` → has many `Quiz` → has many `Question` → has many `Answer`.
`Quiz` carries `published` and a nullable unique `permalink`. `Answer.isCorrect` is
**never** serialized to public consumers.

## Tests

```bash
pnpm test            # unit tests
pnpm test:cov        # unit tests with coverage
pnpm test:e2e        # spins up a throwaway Postgres container, pushes the schema,
                     # runs the e2e suite against .env.test, then tears it down
```

## Environment variables

| Variable                                  | Description                                                       |
| ----------------------------------------- | ----------------------------------------------------------------- |
| `NODE_ENV`                                | `development` / `production` — disables Swagger when `production` |
| `DATABASE_URL`                            | PostgreSQL connection string                                      |
| `PORT`                                    | HTTP port (default `3001`)                                        |
| `WEB_ORIGIN`                              | Allowed CORS origin                                               |
| `JWT_SECRET`                              | JWT signing secret (32+ chars)                                    |
| `JWT_EXPIRES_IN`                          | Access token lifetime in seconds                                  |
| `JWT_TOKEN_AUDIENCE` / `JWT_TOKEN_ISSUER` | JWT audience / issuer claims                                      |
| `POSTGRES_*`                              | Used by `docker-compose` and to compose `DATABASE_URL`            |

## API surface

### Auth (`/auth`)

| Method | Path             | Auth   | Description                    |
| ------ | ---------------- | ------ | ------------------------------ |
| `POST` | `/auth/register` | —      | Register with email + password |
| `POST` | `/auth/login`    | —      | Obtain a JWT                   |
| `GET`  | `/auth/me`       | Bearer | Current user                   |

### Quizzes (`/quizzes`) — all routes require a Bearer token and are owner-scoped

| Method   | Path                                 | Description                                  |
| -------- | ------------------------------------ | -------------------------------------------- |
| `POST`   | `/quizzes`                           | Create a draft quiz (title + 1–10 questions) |
| `GET`    | `/quizzes`                           | List the caller's quizzes                    |
| `GET`    | `/quizzes/:id`                       | Get one owned quiz                           |
| `PATCH`  | `/quizzes/:id`                       | Partial update of a draft quiz               |
| `POST`   | `/quizzes/:id/questions`             | Add a question to a draft quiz               |
| `PATCH`  | `/quizzes/:id/questions/:questionId` | Partial update of a draft question           |
| `DELETE` | `/quizzes/:id/questions/:questionId` | Remove a question from a draft quiz          |
| `POST`   | `/quizzes/:id/publish`               | Publish — assigns a unique 6-char permalink  |
| `DELETE` | `/quizzes/:id`                       | Delete a quiz (draft or published)           |

### Public (`/public/quizzes`) — no auth

| Method | Path                                | Description                                          |
| ------ | ----------------------------------- | ---------------------------------------------------- |
| `GET`  | `/public/quizzes/:permalink`        | Fetch a published quiz; correct answers are stripped |
| `POST` | `/public/quizzes/:permalink/submit` | Submit answers; returns only a score (e.g. `5/8`)    |

## Domain rules (enforced server-side)

- Auth required to create/edit/delete quizzes; each user sees only their own.
- A quiz has a title and 1–10 questions; each question has text and 2–5 answers with
  unique text (trimmed, case-insensitive).
- `SINGLE` = exactly one correct answer. `MULTIPLE` = every correct answer selected and
  no incorrect ones, to score the question correct.
- Publishing assigns a random 6-character alphanumeric permalink, checked for uniqueness.
- Published quizzes are immutable — the author may only delete them.
- Taking a quiz requires no auth; visitor answers are not persisted and the response
  contains only the score.
- The public take-quiz payload never leaks which answers are correct.
