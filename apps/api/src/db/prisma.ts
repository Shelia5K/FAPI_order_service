/**
 * Prisma Client Singleton
 *
 * Exports a single PrismaClient instance to be reused across the application.
 * This prevents creating multiple connections during development with hot-reloading.
 *
 * Usage:
 *   import { prisma } from './db/prisma.js';
 *   const products = await prisma.product.findMany();
 */

import { PrismaClient } from '@prisma/client';

// Declare global type for the Prisma client singleton (for hot-reloading in dev)
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

/**
 * Create or reuse existing PrismaClient instance.
 * In development, we store the client on globalThis to prevent
 * multiple instances during hot-reloading (which causes connection pool exhaustion).
 */
function createPrismaClient(): PrismaClient {
  const client = new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'info', 'warn', 'error']
        : ['error'],
  });

  return client;
}

// Use singleton pattern for the Prisma client
export const prisma: PrismaClient =
  globalThis.__prisma ?? createPrismaClient();

// In development, store on globalThis to prevent multiple instances
if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}

/**
 * Graceful shutdown helper
 * Call this when the application is shutting down to close database connections
 */
export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}

export default prisma;

