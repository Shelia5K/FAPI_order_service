/**
 * FAPI Order Service - API Entry Point
 *
 * This file bootstraps the Express server.
 *
 * Responsibilities:
 * - Load environment variables
 * - Set up middleware (CORS, JSON parsing, error handling)
 * - Mount routes
 * - Start the HTTP server
 *
 * @module
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables before other imports
dotenv.config();

import routes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { prisma, disconnectPrisma } from './db/prisma.js';

// =============================================================================
// App Configuration
// =============================================================================

const app = express();
const PORT = process.env.PORT || 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';
const NODE_ENV = process.env.NODE_ENV || 'development';

// =============================================================================
// Middleware
// =============================================================================

// CORS - Allow requests from frontend
app.use(
  cors({
    origin: CORS_ORIGIN,
    credentials: true,
  })
);

// JSON body parsing
app.use(express.json());

// Request logging in development
if (NODE_ENV === 'development') {
  app.use((req, _res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// =============================================================================
// Routes
// =============================================================================

/**
 * Health check endpoint
 * GET /health
 */
app.get('/health', async (_req, res) => {
  try {
    // Verify database connection
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected',
    });
  } catch {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
    });
  }
});

/**
 * API routes
 * All routes are prefixed with /api
 */
app.use('/api', routes);

/**
 * 404 handler for unknown routes
 */
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'Endpoint not found',
      code: 'NOT_FOUND',
    },
  });
});

/**
 * Global error handler
 * Must be registered last
 */
app.use(errorHandler);

// =============================================================================
// Server Startup
// =============================================================================

const server = app.listen(PORT, () => {
  console.log('');
  console.log('🚀 FAPI Order Service API');
  console.log('========================');
  console.log(`📡 Server:      http://localhost:${PORT}`);
  console.log(`🌐 CORS origin: ${CORS_ORIGIN}`);
  console.log(`🔧 Environment: ${NODE_ENV}`);
  console.log('');
  console.log('Available endpoints:');
  console.log(`  GET  /health              - Health check`);
  console.log(`  GET  /api/products        - List all products`);
  console.log(`  GET  /api/products/:id    - Get product by ID`);
  console.log(`  POST /api/orders          - Create order`);
  console.log(`  GET  /api/orders/:id      - Get order by ID`);
  console.log(`  GET  /api/orders/:id/summary - Order summary with FX rates`);
  console.log('');
});

// =============================================================================
// Graceful Shutdown
// =============================================================================

async function shutdown(signal: string) {
  console.log(`\n${signal} received. Shutting down gracefully...`);

  server.close(async () => {
    console.log('HTTP server closed');

    // Disconnect Prisma
    await disconnectPrisma();
    console.log('Database connection closed');

    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export default app;
