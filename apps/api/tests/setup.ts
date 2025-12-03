/**
 * Test Setup
 *
 * This file runs before all tests.
 * It sets up the test environment and handles cleanup.
 */

import { beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';

// Test database client
export const testPrisma = new PrismaClient({
  datasources: {
    db: {
      // Use test database URL if provided, otherwise use default
      url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL,
    },
  },
});

/**
 * Clean up database before tests
 */
async function cleanDatabase() {
  // Delete in order to respect foreign key constraints
  await testPrisma.order.deleteMany();
  await testPrisma.product.deleteMany();
}

/**
 * Setup runs once before all tests
 */
beforeAll(async () => {
  console.log('🧪 Setting up test environment...');
  await testPrisma.$connect();
  await cleanDatabase();
  console.log('✅ Test environment ready');
});

/**
 * Teardown runs once after all tests
 */
afterAll(async () => {
  console.log('🧹 Cleaning up test environment...');
  await cleanDatabase();
  await testPrisma.$disconnect();
  console.log('✅ Test cleanup complete');
});

export { cleanDatabase };

