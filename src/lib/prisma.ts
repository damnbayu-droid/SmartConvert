import { PrismaClient } from '@prisma/client';

// Hardening: Explicitly define the prisma type to help the IDE and build process
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Export type for use in other files if needed
export type PrismaInstance = typeof prisma;
