import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient | undefined;

export function createPrismaClient(databaseUrl?: string): PrismaClient {
  return new PrismaClient(
    databaseUrl
      ? {
          datasources: {
            db: {
              url: databaseUrl,
            },
          },
        }
      : undefined,
  );
}

export function getPrismaClient(): PrismaClient {
  if (!prisma) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error('DATABASE_URL is not set');
    }
    prisma = createPrismaClient(url);
  }
  return prisma;
}

export async function setPrismaForTests(
  client: PrismaClient | undefined,
): Promise<void> {
  if (prisma && prisma !== client) {
    await prisma.$disconnect();
  }
  prisma = client;
}

export async function disconnectPrismaClient(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    prisma = undefined;
  }
}
