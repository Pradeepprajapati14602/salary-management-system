import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { PrismaClient } from '@prisma/client';
import { runSeed as _runSeed } from '../../src/db/seed/seed.js';

const API_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

/**
 * Apply Prisma migrations to the database (e.g. fresh testcontainer).
 */
export function runMigrations(databaseUrl: string): void {
  execSync('pnpm exec prisma migrate deploy', {
    cwd: API_ROOT,
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'pipe',
    shell: process.platform === 'win32',
  });
}

/**
 * Clear all employees from the database (used in afterEach cleanup).
 */
export async function truncateEmployees(prisma: PrismaClient): Promise<void> {
  await prisma.employee.deleteMany({});
}

/** Seeds 10 000 employees using the production seed function */
export async function runSeed(prisma: PrismaClient): Promise<void> {
  await _runSeed(prisma);
}
