import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import type { PrismaClient } from '@prisma/client';
import { createApp } from '../../src/app.js';
import { createPrismaClient } from '../../src/db/connection.js';
import { runMigrations, truncateEmployees } from '../helpers/setupDb.js';

let container: Awaited<ReturnType<PostgreSqlContainer['start']>>;
let prisma: PrismaClient;
let app: ReturnType<typeof createApp>;

describe('insights routes', () => {
  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16-alpine').start();
    const connectionString = container.getConnectionUri();
    runMigrations(connectionString);
    prisma = createPrismaClient(connectionString);
    app = createApp(prisma);
  }, 180_000);

  afterAll(async () => {
    await prisma?.$disconnect();
    await container?.stop();
  });

  afterEach(async () => {
    await truncateEmployees(prisma);
  });

  async function seedMix(): Promise<void> {
    const rows = [
      ['India', 50_000, 'active', 'E1'],
      ['India', 70_000, 'active', 'E2'],
      ['India', 90_000, 'active', 'E3'],
      ['USA', 80_000, 'active', 'E4'],
      ['USA', 120_000, 'active', 'E5'],
    ];
    for (const [country, salary, status, email] of rows) {
      await prisma.employee.create({
        data: {
          fullName: 'X',
          email,
          jobTitle: 'Engineer',
          department: 'D',
          country,
          salary,
          currency: 'USD',
          hireDate: new Date('2020-01-01'),
          status,
        },
      });
    }
  }

  it('6.1 salary by country shape', async () => {
    await seedMix();
    const res = await request(app).get('/api/insights/salary-by-country');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    const india = res.body.data.find((x: { country: string }) => x.country === 'India');
    expect(india).toMatchObject({
      min: 50_000,
      max: 90_000,
      count: 3,
    });
    expect(typeof india.avg).toBe('number');
  });

  it('6.2 empty salary by country', async () => {
    const res = await request(app).get('/api/insights/salary-by-country');
    expect(res.body.data).toEqual([]);
  });

  it('6.3 numbers not strings', async () => {
    await seedMix();
    const res = await request(app).get('/api/insights/salary-by-country');
    const row = res.body.data[0];
    expect(typeof row.avg).toBe('number');
  });

  it('6.4–6.5 job title', async () => {
    await prisma.employee.create({
      data: {
        fullName: 'A',
        email: 'a@a.com',
        jobTitle: 'Dev',
        department: 'D',
        country: 'India',
        salary: 100,
        currency: 'USD',
        hireDate: new Date('2020-01-01'),
        status: 'active',
      },
    });
    await prisma.employee.create({
      data: {
        fullName: 'B',
        email: 'b@b.com',
        jobTitle: 'PM',
        department: 'D',
        country: 'USA',
        salary: 200,
        currency: 'USD',
        hireDate: new Date('2020-01-01'),
        status: 'active',
      },
    });
    const all = await request(app).get('/api/insights/salary-by-job-title');
    expect(all.body.data.length).toBeGreaterThanOrEqual(2);
    const ind = await request(app).get(
      '/api/insights/salary-by-job-title?country=India',
    );
    expect(ind.body.data).toHaveLength(1);
    expect(ind.body.data[0].jobTitle).toBe('Dev');
  });

  it('6.6–6.7 department breakdown', async () => {
    await prisma.employee.create({
      data: {
        fullName: 'A',
        email: 'a1@a.com',
        jobTitle: 'E',
        department: 'HR',
        country: 'USA',
        salary: 1,
        currency: 'USD',
        hireDate: new Date('2020-01-01'),
        status: 'active',
      },
    });
    await prisma.employee.create({
      data: {
        fullName: 'B',
        email: 'b1@b.com',
        jobTitle: 'E',
        department: 'HR',
        country: 'USA',
        salary: 1,
        currency: 'USD',
        hireDate: new Date('2020-01-01'),
        status: 'active',
      },
    });
    await prisma.employee.create({
      data: {
        fullName: 'C',
        email: 'c1@c.com',
        jobTitle: 'E',
        department: 'Sales',
        country: 'USA',
        salary: 1,
        currency: 'USD',
        hireDate: new Date('2020-01-01'),
        status: 'active',
      },
    });
    const res = await request(app).get('/api/insights/department-breakdown');
    expect(res.status).toBe(200);
    expect(res.body.data[0].headcount).toBeGreaterThanOrEqual(
      res.body.data[1]?.headcount ?? 0,
    );
  });

  it('6.8–6.10 top earners', async () => {
    for (let i = 0; i < 12; i++) {
      await prisma.employee.create({
        data: {
          fullName: `N${i}`,
          email: `t${i}@t.com`,
          jobTitle: 'E',
          department: 'D',
          country: 'USA',
          salary: (i + 1) * 1000,
          currency: 'USD',
          hireDate: new Date('2020-01-01'),
          status: 'active',
        },
      });
    }
    const d = await request(app).get('/api/insights/top-earners');
    expect(d.body.data).toHaveLength(10);
    const f = await request(app).get('/api/insights/top-earners?limit=5');
    expect(f.body.data).toHaveLength(5);
    const z = await request(app).get('/api/insights/top-earners?limit=0');
    expect(z.status).toBe(400);
  });
});
