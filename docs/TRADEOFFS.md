# TRADEOFFS.md — Design Decisions

## 1. Raw SQL (pg) over ORM

**Decision**: Use `node-postgres` with raw parameterised SQL.  
**Tradeoff**: More verbose repository code vs. full index control, no N+1 surprises, explicit RETURNING clauses.  
**Why chosen**: The insights queries (aggregates, window functions, `width_bucket`) are complex enough that ORM query builders would produce suboptimal plans. Direct SQL is predictable.

## 2. Zod over class-validator / joi

**Decision**: Zod 3 for all validation, schema-first.  
**Tradeoff**: Heavier bundle on frontend vs. single source of truth in `packages/shared`.  
**Why chosen**: TypeScript inference from `.infer<>` eliminates all manual type aliases. Same schema in BE controller and FE form = impossible for them to drift.

## 3. React Query over Redux / Zustand / SWR

**Decision**: TanStack React Query v5 for all server state.  
**Tradeoff**: No global store for server data vs. automatic cache, background refetch, `invalidateQueries` after mutations.  
**Why chosen**: Salary data is server-authoritative. RQ's model (queryKey + queryFn) maps directly to our read/write API contract.

## 4. Soft Delete over Hard Delete

**Decision**: `DELETE /api/employees/:id` sets `status = 'inactive'`, not `DELETE FROM`.  
**Tradeoff**: Table grows larger over time vs. full audit trail, ability to recover errors.  
**Why chosen**: HR systems never permanently destroy salary records. Inactive employees are excluded from all insights aggregates but remain queryable by id.

## 5. Batched INSERT over pg-copy-streams

**Decision**: Seed uses 500-row batched multi-row `INSERT … VALUES` not `COPY FROM STDIN`.  
**Tradeoff**: ~2–5s seed time vs. <500ms with COPY, but no extra dependency (`pg-copy-streams`).  
**Why chosen**: The seed runs once at deploy time; 5s is acceptable. The simpler code is easier to test and the batch is idempotent (`TRUNCATE … RESTART IDENTITY` before insert).

## 6. testcontainers over SQLite in tests

**Decision**: Integration + repository tests use real PostgreSQL via `@testcontainers/postgresql`.  
**Tradeoff**: Docker required at test time vs. zero-dependency SQLite in-memory.  
**Why chosen**: PostgreSQL-specific features (`ILIKE`, `width_bucket`, GIN indexes, triggers) cannot be tested with SQLite. testcontainers starts a real PG container once per test file.

## 7. Pagination with LIMIT/OFFSET over cursor-based

**Decision**: `?page=1&pageSize=20` style pagination.  
**Tradeoff**: Page drift on inserts vs. simplicity on both API and UI.  
**Why chosen**: The dataset (10k employees) is stable — low churn HR data. Cursor pagination adds complexity with no benefit at this scale.

## 8. Monorepo with pnpm workspaces

**Decision**: Single repo with `apps/api`, `apps/web`, `packages/shared`.  
**Tradeoff**: Slower initial install vs. shared types at zero cost, single `pnpm test` runs everything.  
**Why chosen**: The biggest risk in a full-stack TypeScript project is the API and UI drifting on types. The shared package eliminates that risk entirely.
