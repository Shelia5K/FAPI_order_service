import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Test environment
    environment: 'node',

    // Include patterns
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],

    // Setup files (for test database, etc.)
    setupFiles: ['./tests/setup.ts'],

    // Run tests sequentially to avoid database conflicts
    sequence: {
      shuffle: false,
    },

    // Timeout for integration tests
    testTimeout: 30000,

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/**/index.ts'],
    },

    // Reporter
    reporters: ['verbose'],
  },
});

