# Salary Management (Incubyte assessment)

Monorepo: **Express + PostgreSQL API**, **React + Vite web app**, **shared Zod schemas**.

## Repository

GitHub: [Pradeepprajapati14602/salary-management-system](https://github.com/Pradeepprajapati14602/salary-management-system)

## Prerequisites

- Node.js 20+
- [pnpm](https://pnpm.io) 9 (`corepack enable` then `corepack prepare pnpm@9.15.0 --activate`)
- Docker Desktop (for API integration tests and local Postgres)

## Setup

```bash
pnpm install
pnpm --filter @salary-mgmt/shared build
```

Create `apps/api/.env` from `apps/api/.env.example`:

```env
DATABASE_URL=postgres://app:secret@localhost:5432/salary_mgmt
PORT=3001
```

PowerShell:

```powershell
Copy-Item apps/api/.env.example apps/api/.env
```

Start Postgres (optional if you only run unit tests without the PG repository suite):

```bash
docker compose up -d postgres
```

Run migrations (from repo root, after `cd apps/api` or via filter):

```bash
cd apps/api
pnpm migrate:up
pnpm seed
```

## Run

**API** (terminal 1):

```bash
cd apps/api
pnpm dev
```

**Web** (terminal 2; proxies `/api` to `http://localhost:3001`):

```bash
cd apps/web
pnpm dev
```

## Tests

```bash
# Fast API unit tests (excludes PG repository file; see package.json)
pnpm --filter api run test:unit

# PG-backed repository tests (Docker; slow first run ~3 min)
pnpm --filter api exec vitest run tests/unit/employee.repository.test.ts

# Integration (employees, insights, seed)
pnpm --filter api run test:integration

# Web
pnpm --filter web test

# Full suite from root (builds shared, runs API vitest excluding perf stubs, web tests)
pnpm test
```

`pnpm test` runs the API suite excluding the slow single-file PG repository test; use `pnpm test:all` to include it, or run `pnpm --filter api exec vitest run tests/unit/employee.repository.test.ts` alone.

## Final Project Checklist

- Public GitHub repo: Yes (link above).
- README with setup instructions: Yes.
- `.env.example`: Yes (`apps/api/.env.example`).
- Seed script working: Yes (`pnpm --filter api seed`).
- Tests passing: Yes (`pnpm test` at repo root).
- Deployment link: Pending (add after deploy).
- Demo video: Optional, pending.
- Commit history quality (TDD): Needs improvement if submitted with a single large commit.

## Deployment

Add your live deployment URL here after hosting API/web:

- Web: `TBD`
- API: `TBD`

## Demo Video

Optional but recommended. Add Loom/YouTube link here:

- Demo: `TBD`

## Project layout

| Path | Role |
|------|------|
| `packages/shared` | Zod schemas and inferred types |
| `apps/api` | REST API, migrations, seed, Vitest |
| `apps/web` | React UI, React Query hooks |

See `IMPLEMENTATION_PLAN.md`, `SKILL.md`, and `TEST_CASES.md` in the repo root for architecture and test checklist.
