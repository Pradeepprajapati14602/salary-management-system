# AI_PROMPTS.md — Prompts Used with AI Tools

> This file documents every significant prompt used when building the Salary Management Tool with AI assistance.
> Following the spirit of the assessment: AI-assisted but engineer-owned.

---

## 1. Initial Scaffold

```
You are a senior TypeScript engineer. Scaffold a pnpm monorepo called salary-mgmt with:
- apps/api: Express + TypeScript + node-postgres + Zod + Vitest
- apps/web: React 18 + Vite + TailwindCSS + React Query
- packages/shared: Zod schemas exported to both apps
Use ESM throughout. Include tsconfig, vitest.config, and package.json for each.
```

---

## 2. Zod Schema Design

```
Write the Zod schemas for an employee entity with these fields:
fullName (string, 2-150 chars), email, jobTitle, department, country, 
salary (positive number, max 10M), currency (3-char, default USD), 
hireDate (parseable date string), status (active|inactive, default active).
Export CreateEmployeeSchema, UpdateEmployeeSchema (partial), EmployeeSchema (+ id, createdAt, updatedAt).
Also export an EmployeeListQuerySchema with page, pageSize, search, country, jobTitle, status, sortBy, sortDir.
```

---

## 3. Repository Layer

```
Write an EmployeeRepository class implementing IEmployeeRepository using node-postgres (pg).
Methods: findAll (with dynamic WHERE + pagination + sort), findById, create (RETURNING *), 
update (dynamic SET only for provided fields), softDelete (status = inactive).
Use parameterised queries only. No string interpolation.
Build WHERE clauses by accumulating conditions array + params array.
```

---

## 4. Insights SQL Queries

```
Write PostgreSQL aggregate queries for:
1. getSalaryStatsByCountry: MIN/MAX/AVG/COUNT grouped by country, active only
2. getSalaryStatsByJobTitle: AVG/COUNT grouped by job_title, optional country filter
3. getDepartmentBreakdown: headcount + avg_salary per department, sorted by headcount DESC
4. getSalaryDistribution: width_bucket histogram with N buckets
5. getTopEarners: top N by salary DESC

Cast aggregates to float8 so they come back as JS numbers not strings.
```

---

## 5. TDD Service Tests

```
Write Vitest unit tests for EmployeeService. Mock IEmployeeRepository entirely with vi.fn().
Cover: createEmployee (valid, duplicate email → ConflictError, invalid payload → ValidationError),
getEmployee (found, not found → NotFoundError), listEmployees (defaults, pageSize cap at 100),
updateEmployee (valid patch, not found, invalid salary), deleteEmployee (found, not found).
Follow test name format: "[method] — [scenario] — [expected outcome]"
```

---

## 6. Integration Route Tests

```
Write Supertest integration tests for GET/POST/GET/:id/PUT/PATCH/DELETE /api/employees.
Use testcontainers PostgreSQL container started in beforeAll. Run migrations (schema.sql) on startup.
Truncate table in afterEach. Test status codes AND body shape.
Cover: pagination, filters, search, 400/404/409 error responses, soft delete side effect.
```

---

## 7. Seed Script

```
Write a TypeScript seed script that inserts exactly 10,000 employees into PostgreSQL.
Use batched multi-row INSERT VALUES, 500 rows per statement, all in one transaction.
Read first_names.txt and last_names.txt to build realistic full names.
Generate realistic emails (employee{N}@seed.example.com), random job titles, departments, countries, 
salaries (30k-200k), hire dates (2015-2022).
TRUNCATE employees RESTART IDENTITY CASCADE before inserting.
Log row count and elapsed time.
```

---

## 8. React Components

```
Build an EmployeeTable React component with:
- Sortable column headers (onClick → onSortChange callback)
- Loading state (spinner)
- Empty state ("No employees found")
- Pagination (Prev/Next buttons, disabled at boundaries, shows "page X / Y")
- Edit and Delete action buttons per row (unique IDs for testing)
All in plain CSS (no Tailwind). Accept props: employees, isLoading, sortBy, sortDir, 
page, pageSize, total, totalPages, onSortChange, onPageChange, onEdit, onDelete.
```

---

## 9. EmployeeFormModal

```
Build a modal form component for creating and editing employees.
Create mode: empty form, title "Add Employee".
Edit mode: pre-filled from employee prop, title "Edit Employee".
Client-side validation mirroring Zod rules (no external lib needed).
Show inline field errors on submit. Salary must be > 0.
Cancel button calls onClose. Submit calls onSubmit with typed payload.
```

---

## 10. InsightsPage

```
Build an InsightsPage with Recharts:
- 4 KPI cards (total headcount, global avg salary, countries, top salary)
- BarChart: avg salary per country
- PieChart (donut): department headcount breakdown  
- Horizontal BarChart: avg salary by job title (top 15, sorted desc)
- Table: top 10 earners with rank medals for top 3
- Country filter select that re-fetches salary-by-job-title with ?country=X
Use React Query useQuery hooks, skeleton loading state, dark theme.
```

---

## Engineering Review Process

After each AI-generated block:
1. Read the output carefully — understand every line
2. Run `tsc --noEmit` — fix any type errors
3. Run `vitest run` — fix any test failures
4. Refactor for clarity before committing
5. Write the commit message manually (never AI-generated)

**Principle**: AI writes the boilerplate, engineer owns the correctness.
