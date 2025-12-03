/**
 * Environment Configuration
 *
 * Centralizes environment variable access with type safety and defaults.
 * All environment variables should be accessed through this module.
 */

import { z } from 'zod';

/**
 * Environment schema with validation
 */
const envSchema = z.object({
  // Server
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().default(3001),

  // Database (handled by Prisma, but we validate it exists)
  DATABASE_URL: z.string().url(),

  // CORS
  CORS_ORIGIN: z.string().url().default('http://localhost:3000'),

  // CNB API
  CNB_EXCHANGE_RATE_URL: z
    .string()
    .url()
    .default(
      'https://www.cnb.cz/cs/financni-trhy/devizovy-trh/kurzy-devizoveho-trhu/kurzy-devizoveho-trhu/denni_kurz.txt'
    ),
});

/**
 * Parse and validate environment variables
 * Will throw if required variables are missing
 */
function loadEnv() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('❌ Invalid environment variables:');
    console.error(parsed.error.flatten().fieldErrors);
    throw new Error('Invalid environment configuration');
  }

  return parsed.data;
}

/**
 * Validated environment configuration
 * Access via: import { env } from './config/env.js'
 */
export const env = loadEnv();

/**
 * Check if we're in development mode
 */
export const isDev = env.NODE_ENV === 'development';

/**
 * Check if we're in production mode
 */
export const isProd = env.NODE_ENV === 'production';

/**
 * Check if we're in test mode
 */
export const isTest = env.NODE_ENV === 'test';

