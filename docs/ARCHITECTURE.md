# ARCHITECTURE.md — Salary Management Tool

## System Diagram

```
┌─────────────────────────────────────────────────────────┐
│                        CLIENT                           │
│              ReactJS + Vite + TailwindCSS               │
│    Layout · EmployeesPage · InsightsPage                │
│    React Query · React Router · Recharts                │
└──────────────────────────┬──────────────────────────────┘
                           │ REST / JSON  (VITE_API_URL)
┌──────────────────────────▼──────────────────────────────┐
│                       SERVER                            │
│               Node.js 20 + Express 4 + TypeScript       │
│   Controller → Service → Repository → Database          │
│   Zod validation · centralised error middleware         │
└──────────────────────────┬──────────────────────────────┘
                           │ pg Pool (node-postgres)
┌──────────────────────────▼──────────────────────────────┐
│                      DATABASE                           │
│              PostgreSQL 16                              │
│   Indexes on country, job_title, status, full_name      │
└─────────────────────────────────────────────────────────┘
```

## Layered Architecture

```
HTTP Request
    │
    ▼
employeeRouter         (route declarations only)
    │
    ▼
EmployeeController     (parse req → call service → return res)
    │
    ▼
EmployeeService        (all business logic, validates with Zod)
    │
    ▼
IEmployeeRepository    (interface — injected, enables mocking)
    │
    ▼
EmployeeRepository     (all SQL, returns domain objects)
    │
    ▼
pg.Pool                (connection singleton)
```

**Key rule**: No layer communicates except with its direct neighbour.  
Services receive the Repository **interface**, not the concrete class → unit tests mock the entire DB layer with `vi.fn()`.

## Shared Package

`packages/shared` exports Zod schemas and inferred TypeScript types used by **both** the API and the React UI:

```
packages/shared/src/
  schemas/
    employee.schema.ts    – CreateEmployeeSchema, EmployeeSchema, EmployeeListQuerySchema
    insights.schema.ts    – query param schemas
  index.ts
```

This means validation rules are defined once and enforced on both ends with zero duplication.

## Frontend Architecture

```
App (BrowserRouter + QueryClientProvider)
└── Layout (sidebar nav)
    ├── EmployeesPage
    │   ├── EmployeeFilters   (debounced search, country/status selects)
    │   ├── EmployeeTable     (sortable columns, pagination)
    │   ├── EmployeeFormModal (create / edit, local validation)
    │   └── DeleteConfirmDialog
    └── InsightsPage
        ├── KPI Cards          (headcount, avg salary, countries, top earner)
        ├── SalaryByCountryChart (BarChart)
        ├── DepartmentBreakdownChart (PieChart)
        ├── SalaryByJobTitleChart  (horizontal BarChart)
        └── TopEarnersTable
```

All server state is owned by **React Query**: cache, refetch, background updates, optimistic mutations. Local state (modal open, filter values) is `useState` only.

## Database Schema Highlights

- `employees` table with `SERIAL PRIMARY KEY`, `UNIQUE` email
- `CHECK(salary > 0)` and `CHECK(status IN ('active','inactive'))`
- `updated_at` auto-maintained by trigger `set_updated_at()`
- Composite index `(country, job_title)` for insights queries
- `gin(full_name gin_trgm_ops)` for fast ILIKE search

## Performance Strategy

| Operation | Approach | Target |
|---|---|---|
| List 10k employees | LIMIT/OFFSET with index on status | < 50ms |
| Salary insights | Aggregate in SQL (MIN/MAX/AVG/COUNT) | < 50ms |
| Seed 10k rows | Batched multi-row VALUES, 500/tx | < 5s |
| Full-text name search | ILIKE with pg_trgm GIN index | < 200ms |
| Top earners | ORDER BY salary DESC LIMIT N | < 30ms |
