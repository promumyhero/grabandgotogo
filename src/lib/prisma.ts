import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const isDatabaseConfigured = Boolean(process.env.DATABASE_URL);

function createPrismaClient(): PrismaClient | null {
  if (!isDatabaseConfigured || !process.env.DATABASE_URL) return null;
  try {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL,
    });
    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });
  } catch (err) {
    console.warn('Prisma adapter initialization deferred:', err);
    return null;
  }
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production' && prisma) {
  globalForPrisma.prisma = prisma;
}

export default prisma;
