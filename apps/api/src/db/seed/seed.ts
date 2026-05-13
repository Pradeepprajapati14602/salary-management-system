import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Prisma, PrismaClient } from '@prisma/client';
import { getPrismaClient } from '../connection.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const COUNTRIES = [
  'India',
  'USA',
  'UK',
  'Germany',
  'Canada',
  'Australia',
  'Japan',
  'Brazil',
];
const JOB_TITLES = [
  'Software Engineer',
  'Product Manager',
  'Data Analyst',
  'HR Specialist',
  'Sales Executive',
  'DevOps Engineer',
  'QA Engineer',
  'Designer',
];
const DEPARTMENTS = [
  'Engineering',
  'Product',
  'HR',
  'Sales',
  'Operations',
  'Finance',
];

function mulberry32(seed: number) {
  return function next() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)]!;
}

export async function runSeed(client?: PrismaClient): Promise<void> {
  const prisma = client ?? getPrismaClient();
  const firstNames = readFileSync(
    path.join(__dirname, 'first_names.txt'),
    'utf8',
  )
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  const lastNames = readFileSync(
    path.join(__dirname, 'last_names.txt'),
    'utf8',
  )
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  const rng = mulberry32(42);
  const started = Date.now();
  await prisma.employee.deleteMany();

  const BATCH = 500;
  const total = 10_000;
  for (let offset = 0; offset < total; offset += BATCH) {
    const rows = Math.min(BATCH, total - offset);
    const batch: Prisma.EmployeeCreateManyInput[] = [];
    for (let i = 0; i < rows; i++) {
      const idx = offset + i;
      const fn = firstNames[idx % firstNames.length]!;
      const ln = lastNames[Math.floor(idx / firstNames.length) % lastNames.length]!;
      const fullName = `${fn} ${ln}`;
      const email = `employee${idx}@seed.example.com`;
      const jobTitle = pick(rng, JOB_TITLES);
      const department = pick(rng, DEPARTMENTS);
      const country = pick(rng, COUNTRIES);
      const salary = Math.round(30_000 + rng() * 170_000);
      const hireDate = new Date(
        2015 + Math.floor(rng() * 8),
        Math.floor(rng() * 12),
        1 + Math.floor(rng() * 27),
      );
      batch.push({
        fullName,
        email,
        jobTitle,
        department,
        country,
        salary,
        currency: 'USD',
        hireDate,
        status: 'active',
      });
    }
    await prisma.employee.createMany({ data: batch, skipDuplicates: true });
  }

  // eslint-disable-next-line no-console
  console.info(`Seed completed: ${total} rows in ${Date.now() - started}ms`);
}
