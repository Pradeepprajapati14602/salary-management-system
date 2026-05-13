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

const baseEmp = {
  fullName: 'Alice Wonder',
  email: 'alice@example.com',
  jobTitle: 'Engineer',
  department: 'Engineering',
  country: 'India',
  salary: 80_000,
  hireDate: '2020-01-15T00:00:00.000Z',
};

describe('employee routes', () => {
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

  it('5.1 empty list', async () => {
    const res = await request(app).get('/api/employees');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.meta.total).toBe(0);
  });

  it('5.2–5.3 pagination', async () => {
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post('/api/employees')
        .send({
          ...baseEmp,
          email: `e${i}@x.com`,
          fullName: `User ${i}`,
        })
        .expect(201);
    }
    const all = await request(app).get('/api/employees');
    expect(all.body.meta.total).toBe(5);
    const p = await request(app).get('/api/employees?page=1&pageSize=2');
    expect(p.body.data).toHaveLength(2);
    expect(p.body.meta.totalPages).toBe(3);
  });

  it('5.4 country filter', async () => {
    await request(app)
      .post('/api/employees')
      .send({ ...baseEmp, email: 'a@a.com', country: 'India' })
      .expect(201);
    await request(app)
      .post('/api/employees')
      .send({
        ...baseEmp,
        email: 'b@b.com',
        country: 'USA',
        fullName: 'Bob',
      })
      .expect(201);
    const res = await request(app).get('/api/employees?country=India');
    expect(res.body.data.every((e: { country: string }) => e.country === 'India')).toBe(
      true,
    );
  });

  it('5.5 search', async () => {
    await request(app)
      .post('/api/employees')
      .send({ ...baseEmp, email: 'a@a.com', fullName: 'alice Bee' })
      .expect(201);
    const res = await request(app).get('/api/employees?search=alice');
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('5.6 pageSize capped', async () => {
    const res = await request(app).get('/api/employees?pageSize=200');
    expect(res.body.meta.pageSize).toBe(100);
  });

  it('5.7 create valid', async () => {
    const res = await request(app).post('/api/employees').send(baseEmp);
    expect(res.status).toBe(201);
    expect(res.body.data.id).toBeGreaterThan(0);
  });

  it('5.8 missing fullName', async () => {
    const { fullName: _, ...rest } = baseEmp;
    const res = await request(app).post('/api/employees').send(rest);
    expect(res.status).toBe(400);
    expect(res.body.details?.fullName).toBeDefined();
  });

  it('5.9 invalid email', async () => {
    const res = await request(app)
      .post('/api/employees')
      .send({ ...baseEmp, email: 'bad' });
    expect(res.status).toBe(400);
  });

  it('5.10 negative salary', async () => {
    const res = await request(app)
      .post('/api/employees')
      .send({ ...baseEmp, email: 'z@z.com', salary: -1 });
    expect(res.status).toBe(400);
  });

  it('5.11 duplicate email', async () => {
    await request(app).post('/api/employees').send(baseEmp).expect(201);
    const res = await request(app).post('/api/employees').send(baseEmp);
    expect(res.status).toBe(409);
    expect(res.body.error).toBe('Email already exists');
  });

  it('5.12 strips unknown fields', async () => {
    const res = await request(app)
      .post('/api/employees')
      .send({ ...baseEmp, email: 'uniq@u.com', extraField: 'x' });
    expect(res.status).toBe(201);
    expect(res.body.data).not.toHaveProperty('extraField');
  });

  it('5.13–5.15 get by id', async () => {
    const c = await request(app).post('/api/employees').send({
      ...baseEmp,
      email: 'get@get.com',
    });
    const id = c.body.data.id;
    const ok = await request(app).get(`/api/employees/${id}`);
    expect(ok.status).toBe(200);
    const nf = await request(app).get('/api/employees/99999');
    expect(nf.status).toBe(404);
    const bad = await request(app).get('/api/employees/abc');
    expect(bad.status).toBe(400);
  });

  it('5.16–5.18 PUT', async () => {
    const c = await request(app).post('/api/employees').send({
      ...baseEmp,
      email: 'put@put.com',
    });
    const id = c.body.data.id;
    const res = await request(app)
      .put(`/api/employees/${id}`)
      .send({
        ...baseEmp,
        email: 'put2@put.com',
        salary: 90_000,
      });
    expect(res.status).toBe(200);
    const nf = await request(app)
      .put('/api/employees/99999')
      .send({ ...baseEmp, email: 'n@n.com' });
    expect(nf.status).toBe(404);
    const bad = await request(app)
      .put(`/api/employees/${id}`)
      .send({ ...baseEmp, email: 'put2@put.com', salary: -5 });
    expect(bad.status).toBe(400);
  });

  it('5.19–5.21 PATCH', async () => {
    const c = await request(app).post('/api/employees').send({
      ...baseEmp,
      email: 'patch@p.com',
    });
    const id = c.body.data.id;
    const p1 = await request(app)
      .patch(`/api/employees/${id}`)
      .send({ salary: 90000 });
    expect(p1.status).toBe(200);
    const p2 = await request(app).patch(`/api/employees/${id}`).send({});
    expect(p2.status).toBe(200);
    const nf = await request(app).patch('/api/employees/99999').send({ salary: 1 });
    expect(nf.status).toBe(404);
  });

  it('5.22–5.24 DELETE', async () => {
    const c = await request(app).post('/api/employees').send({
      ...baseEmp,
      email: 'del@d.com',
    });
    const id = c.body.data.id;
    await request(app).delete(`/api/employees/${id}`).expect(204);
    const nf = await request(app).delete('/api/employees/99999');
    expect(nf.status).toBe(404);
    const g = await request(app).get(`/api/employees/${id}`);
    expect(g.status).toBe(200);
    expect(g.body.data.status).toBe('inactive');
  });
});
