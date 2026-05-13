/**
 * Section 11 — Performance / Regression Tests
 * These tests run against a real PostgreSQL testcontainer with 10 000 seeded rows.
 * Run separately: pnpm --filter api test:perf
 *
 * Each test measures real elapsed time against the thresholds defined in TEST_CASES.md.
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import type { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { runMigrations, runSeed } from '../helpers/setupDb.js';
import { EmployeeRepository } from '../../src/modules/employees/employee.repository.js';
import { InsightsRepository } from '../../src/modules/insights/insights.repository.js';
import { createPrismaClient } from '../../src/db/connection.js';

let container: StartedPostgreSqlContainer;
let pool: Pool;
let prisma: PrismaClient;
let empRepo: EmployeeRepository;
let insRepo: InsightsRepository;

beforeAll(async () => {
  container = await new PostgreSqlContainer('postgres:16-alpine').start();
  const connectionString = container.getConnectionUri();
  runMigrations(connectionString);
  pool = new Pool({ connectionString });
  prisma = createPrismaClient(connectionString);
  await runSeed(prisma);          // seeds 10 000 rows
}, 120_000);

afterAll(async () => {
  await prisma.$disconnect();
  await pool.end();
  await container.stop();
});

describe('performance thresholds', () => {
  it('11.3 findAll paginated — page 500 of 10k < 100ms', async () => {
    empRepo = new EmployeeRepository(prisma);
    const t0 = performance.now();
    await empRepo.findAll({ page: 500, pageSize: 20, sortBy: 'id', sortDir: 'asc', status: 'active' });
    const elapsed = performance.now() - t0;
    expect(elapsed).toBeLessThan(100);
  });

  it('11.4 salary by country aggregate (10k rows) < 50ms', async () => {
    insRepo = new InsightsRepository(prisma);
    const t0 = performance.now();
    await insRepo.getSalaryStatsByCountry();
    expect(performance.now() - t0).toBeLessThan(50);
  });

  it('11.5 salary by job title aggregate < 50ms', async () => {
    const t0 = performance.now();
    await insRepo.getSalaryStatsByJobTitle();
    expect(performance.now() - t0).toBeLessThan(50);
  });

  it('11.6 ILIKE full-text search on name < 200ms', async () => {
    const t0 = performance.now();
    await empRepo.findAll({ page: 1, pageSize: 20, search: 'ali', sortBy: 'id', sortDir: 'asc', status: 'active' });
    expect(performance.now() - t0).toBeLessThan(200);
  });

  it('11.7 top 10 earners query < 30ms', async () => {
    const t0 = performance.now();
    await insRepo.getTopEarners(10);
    expect(performance.now() - t0).toBeLessThan(30);
  });
});
