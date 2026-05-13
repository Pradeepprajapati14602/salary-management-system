import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import type { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import type { CreateEmployee, EmployeeListQuery } from '@salary-mgmt/shared';
import { EmployeeRepository } from '../../src/modules/employees/employee.repository.js';
import { createPrismaClient } from '../../src/db/connection.js';
import { runMigrations, truncateEmployees } from '../helpers/setupDb.js';

let container: Awaited<ReturnType<PostgreSqlContainer['start']>>;
let pool: Pool;
let prisma: PrismaClient;
let repo: EmployeeRepository;

function q(p: Partial<EmployeeListQuery> = {}): EmployeeListQuery {
  return {
    page: 1,
    pageSize: 20,
    sortBy: 'id',
    sortDir: 'asc',
    ...p,
  } as EmployeeListQuery;
}

async function insertRow(
  r: {
    name: string;
    country: string;
    salary: number;
    status?: string;
    job?: string;
  },
): Promise<void> {
  const email = `${r.name.replace(/\s/g, '')}-${Math.random().toString(36).slice(2)}@t.com`;
  await pool.query(
    `INSERT INTO employees (full_name,email,job_title,department,country,salary,currency,hire_date,status)
     VALUES ($1,$2,$3,'Dept',$4,$5,'USD','2020-01-01',$6)`,
    [
      r.name,
      email,
      r.job ?? 'Engineer',
      r.country,
      r.salary,
      r.status ?? 'active',
    ],
  );
}

async function insertMany(
  rows: Array<{
    name: string;
    country: string;
    salary: number;
    status?: string;
    job?: string;
  }>,
): Promise<void> {
  for (const r of rows) {
    await insertRow(r);
  }
}

describe('EmployeeRepository (PG)', () => {
  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16-alpine').start();
    const connectionString = container.getConnectionUri();
    runMigrations(connectionString);
    pool = new Pool({ connectionString });
    prisma = createPrismaClient(connectionString);
    repo = new EmployeeRepository(prisma);
  }, 180_000);

  afterAll(async () => {
    await prisma?.$disconnect();
    await pool?.end();
    await container?.stop();
  });

  afterEach(async () => {
    await truncateEmployees(prisma);
  });

  it('2.1 empty table', async () => {
    const r = await repo.findAll(q({ pageSize: 10 }));
    expect(r.data).toEqual([]);
    expect(r.meta).toEqual({
      total: 0,
      page: 1,
      pageSize: 10,
      totalPages: 0,
    });
  });

  it('2.2 pagination 25 rows page 1 size 10', async () => {
    const rows = Array.from({ length: 25 }, (_, i) => ({
      name: `User ${i}`,
      country: 'USA',
      salary: 50_000 + i,
    }));
    await insertMany(rows);
    const r = await repo.findAll(q({ page: 1, pageSize: 10 }));
    expect(r.data).toHaveLength(10);
    expect(r.meta.total).toBe(25);
    expect(r.meta.totalPages).toBe(3);
  });

  it('2.3 page 3 of 25', async () => {
    const rows = Array.from({ length: 25 }, (_, i) => ({
      name: `User ${i}`,
      country: 'USA',
      salary: 50_000 + i,
    }));
    await insertMany(rows);
    const r = await repo.findAll(q({ page: 3, pageSize: 10 }));
    expect(r.data).toHaveLength(5);
  });

  it('2.4 page beyond totalPages', async () => {
    await insertMany([{ name: 'A', country: 'USA', salary: 1 }]);
    const r = await repo.findAll(q({ page: 99, pageSize: 10 }));
    expect(r.data).toEqual([]);
  });

  it('2.5 filter country India', async () => {
    await insertMany([
      { name: 'I1', country: 'India', salary: 1 },
      { name: 'U1', country: 'USA', salary: 2 },
    ]);
    const r = await repo.findAll(q({ country: 'India' }));
    expect(r.data.every((e) => e.country === 'India')).toBe(true);
  });

  it('2.6 filter inactive', async () => {
    await pool.query(
      `INSERT INTO employees (full_name,email,job_title,department,country,salary,currency,hire_date,status)
       VALUES ('X','x@x.com','E','D','USA',1,'USD','2020-01-01','inactive')`,
    );
    const r = await repo.findAll(q({ status: 'inactive', pageSize: 20 }));
    expect(r.data).toHaveLength(1);
    expect(r.data[0]!.status).toBe('inactive');
  });

  it('2.7 search John case insensitive', async () => {
    await insertMany([
      { name: 'johnny Bravo', country: 'USA', salary: 1 },
      { name: 'Other', country: 'USA', salary: 2 },
    ]);
    const r = await repo.findAll(q({ search: 'John' }));
    expect(r.data.some((e) => e.fullName.includes('johnny'))).toBe(true);
  });

  it('2.8 sort salary desc', async () => {
    await insertMany([
      { name: 'Low', country: 'USA', salary: 10 },
      { name: 'High', country: 'USA', salary: 99 },
    ]);
    const r = await repo.findAll(q({ sortBy: 'salary', sortDir: 'desc' }));
    expect(r.data[0]!.salary).toBe(99);
  });

  it('2.9 sort salary asc', async () => {
    await insertMany([
      { name: 'Low', country: 'USA', salary: 10 },
      { name: 'High', country: 'USA', salary: 99 },
    ]);
    const r = await repo.findAll(q({ sortBy: 'salary', sortDir: 'asc' }));
    expect(r.data[0]!.salary).toBe(10);
  });

  it('2.10 combined country and jobTitle', async () => {
    await insertMany([
      { name: 'A', country: 'India', salary: 1, job: 'Engineer' },
      { name: 'B', country: 'India', salary: 2, job: 'PM' },
    ]);
    const r = await repo.findAll(
      q({ country: 'India', jobTitle: 'Engineer' }),
    );
    expect(r.data).toHaveLength(1);
    expect(r.data[0]!.jobTitle).toBe('Engineer');
  });

  it('2.11 inactive hidden by default', async () => {
    await pool.query(
      `INSERT INTO employees (full_name,email,job_title,department,country,salary,currency,hire_date,status)
       VALUES ('Inact','in@x.com','E','D','USA',5,'USD','2020-01-01','inactive')`,
    );
    await insertMany([{ name: 'Act', country: 'USA', salary: 6 }]);
    const r = await repo.findAll(q());
    expect(r.data).toHaveLength(1);
    expect(r.data[0]!.fullName).toBe('Act');
  });

  it('2.12 findById existing', async () => {
    const created = await repo.create({
      fullName: 'Full',
      email: 'f@f.com',
      jobTitle: 'Eng',
      department: 'D',
      country: 'USA',
      salary: 10,
      currency: 'USD',
      hireDate: '2020-01-01T00:00:00.000Z',
      status: 'active',
    });
    const r = await repo.findById(created.id);
    expect(r?.id).toBe(created.id);
  });

  it('2.13 findById missing', async () => {
    await expect(repo.findById(99999)).resolves.toBeNull();
  });

  it('2.14 findById zero', async () => {
    await expect(repo.findById(0)).resolves.toBeNull();
  });

  it('2.15 soft deleted still returned by id', async () => {
    const created = await repo.create({
      fullName: 'Full',
      email: 'g@g.com',
      jobTitle: 'Eng',
      department: 'D',
      country: 'USA',
      salary: 10,
      currency: 'USD',
      hireDate: '2020-01-01T00:00:00.000Z',
      status: 'active',
    });
    await repo.softDelete(created.id);
    const r = await repo.findById(created.id);
    expect(r?.status).toBe('inactive');
  });

  it('2.16 create returns timestamps', async () => {
    const e = await repo.create({
      fullName: 'Full',
      email: 'h@h.com',
      jobTitle: 'Eng',
      department: 'D',
      country: 'USA',
      salary: 10,
      currency: 'USD',
      hireDate: '2020-01-01T00:00:00.000Z',
      status: 'active',
    });
    expect(e.id).toBeGreaterThan(0);
    expect(new Date(e.createdAt).getTime()).not.toBeNaN();
    expect(new Date(e.updatedAt).getTime()).not.toBeNaN();
  });

  it('2.17 duplicate email throws', async () => {
    const data: CreateEmployee = {
      fullName: 'Full',
      email: 'dup@dup.com',
      jobTitle: 'Eng',
      department: 'D',
      country: 'USA',
      salary: 10,
      currency: 'USD',
      hireDate: '2020-01-01T00:00:00.000Z',
      status: 'active',
    };
    await repo.create(data);
    await expect(repo.create(data)).rejects.toMatchObject({ code: 'P2002' });
  });

  it('2.19 update salary only', async () => {
    const e = await repo.create({
      fullName: 'Full',
      email: 'u@u.com',
      jobTitle: 'Eng',
      department: 'D',
      country: 'USA',
      salary: 10,
      currency: 'USD',
      hireDate: '2020-01-01T00:00:00.000Z',
      status: 'active',
    });
    const u = await repo.update(e.id, { salary: 20 });
    expect(u?.salary).toBe(20);
    expect(u?.fullName).toBe('Full');
  });

  it('2.20 update missing returns null', async () => {
    await expect(repo.update(99999, { salary: 1 })).resolves.toBeNull();
  });

  it('2.21 updatedAt advances', async () => {
    const e = await repo.create({
      fullName: 'Full',
      email: 'w@w.com',
      jobTitle: 'Eng',
      department: 'D',
      country: 'USA',
      salary: 10,
      currency: 'USD',
      hireDate: '2020-01-01T00:00:00.000Z',
      status: 'active',
    });
    const u = await repo.update(e.id, { salary: 11 });
    expect(new Date(u!.updatedAt).getTime()).toBeGreaterThanOrEqual(
      new Date(e.updatedAt).getTime(),
    );
  });

  it('2.22 duplicate email on update throws', async () => {
    await repo.create({
      fullName: 'A',
      email: 'a1@a.com',
      jobTitle: 'Eng',
      department: 'D',
      country: 'USA',
      salary: 10,
      currency: 'USD',
      hireDate: '2020-01-01T00:00:00.000Z',
      status: 'active',
    });
    const b = await repo.create({
      fullName: 'B',
      email: 'b1@b.com',
      jobTitle: 'Eng',
      department: 'D',
      country: 'USA',
      salary: 11,
      currency: 'USD',
      hireDate: '2020-01-01T00:00:00.000Z',
      status: 'active',
    });
    await expect(
      repo.update(b.id, { email: 'a1@a.com' }),
    ).rejects.toMatchObject({ code: 'P2002' });
  });

  it('2.23 softDelete true', async () => {
    const e = await repo.create({
      fullName: 'Full',
      email: 'sd@sd.com',
      jobTitle: 'Eng',
      department: 'D',
      country: 'USA',
      salary: 10,
      currency: 'USD',
      hireDate: '2020-01-01T00:00:00.000Z',
      status: 'active',
    });
    await expect(repo.softDelete(e.id)).resolves.toBe(true);
    const r = await repo.findById(e.id);
    expect(r?.status).toBe('inactive');
  });

  it('2.24 softDelete missing false', async () => {
    await expect(repo.softDelete(99999)).resolves.toBe(false);
  });

  it('2.25 softDelete twice false', async () => {
    const e = await repo.create({
      fullName: 'Full',
      email: 'tw@tw.com',
      jobTitle: 'Eng',
      department: 'D',
      country: 'USA',
      salary: 10,
      currency: 'USD',
      hireDate: '2020-01-01T00:00:00.000Z',
      status: 'active',
    });
    await repo.softDelete(e.id);
    await expect(repo.softDelete(e.id)).resolves.toBe(false);
  });
});
