import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import type { PrismaClient } from '@prisma/client';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runSeed } from '../../src/db/seed/seed.js';
import { createPrismaClient } from '../../src/db/connection.js';
import { runMigrations, truncateEmployees } from '../helpers/setupDb.js';

const dir = path.dirname(fileURLToPath(import.meta.url));

let container: Awaited<ReturnType<PostgreSqlContainer['start']>>;
let prisma: PrismaClient;

describe('seed integration', () => {
  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16-alpine').start();
    const connectionString = container.getConnectionUri();
    runMigrations(connectionString);
    prisma = createPrismaClient(connectionString);
  }, 180_000);

  afterAll(async () => {
    await prisma?.$disconnect();
    await container?.stop();
  });

  it(
    '7.1–7.2, 7.4–7.6, 7.8–7.11 seed',
    async () => {
      await truncateEmployees(prisma);
      await runSeed(prisma);
      const c = await prisma.employee.count();
      expect(c).toBe(10_000);
      await runSeed(prisma);
      const c2 = await prisma.employee.count();
      expect(c2).toBe(10_000);

      const badSal = await prisma.employee.count({
        where: { salary: { lte: 0 } },
      });
      expect(badSal).toBe(0);

      const distinctEmails = await prisma.employee.findMany({
        distinct: ['email'],
        select: { email: true },
      });
      expect(distinctEmails).toHaveLength(10_000);

      const countries = await prisma.employee.count({
        where: {
          OR: [{ country: '' }, { country: null as never }],
        },
      });
      expect(countries).toBe(0);

      const dist = await prisma.employee.findMany({
        distinct: ['country'],
        select: { country: true },
      });
      expect(dist.length).toBeGreaterThanOrEqual(5);

      const st = await prisma.employee.count({
        where: { NOT: { status: 'active' } },
      });
      expect(st).toBe(0);
    },
    120_000,
  );

  it('7.3 spot-check names from word lists', async () => {
    await truncateEmployees(prisma);
    await runSeed(prisma);
    const first = readFileSync(
      path.join(dir, '../../src/db/seed/first_names.txt'),
      'utf8',
    )
      .split(/\r?\n/)
      .filter(Boolean);
    const last = readFileSync(
      path.join(dir, '../../src/db/seed/last_names.txt'),
      'utf8',
    )
      .split(/\r?\n/)
      .filter(Boolean);
    const sample = await prisma.employee.findMany({
      select: { fullName: true },
      orderBy: { id: 'asc' },
      take: 100,
    });
    for (const row of sample) {
      const fn = row.fullName;
      const parts = fn.split(' ');
      const firstToken = parts[0]!;
      const lastToken = parts[parts.length - 1]!;
      expect(first).toContain(firstToken);
      expect(last).toContain(lastToken);
    }
  }, 120_000);
});
