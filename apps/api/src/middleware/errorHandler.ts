/**
 * Global Error Handler Middleware
 *
 * Catches all errors and returns consistent JSON responses.
 */

import { Request, Response, NextFunction } from 'express';
import { ApiError, isApiError } from '../lib/errors.js';

/**
 * Error response format
 */
interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    details?: Record<string, string[]>;
  };
}

/**
 * Global error handling middleware
 * Must be registered after all routes
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log the error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('❌ Error:', err);
  }

  // Handle known API errors
  if (isApiError(err)) {
    const response: ErrorResponse = {
      success: false,
      error: {
        message: err.message,
        code: err.code,
        details: err.details,
      },
    };
    res.status(err.statusCode).json(response);
    return;
  }

  // Handle Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    const response: ErrorResponse = {
      success: false,
      error: {
        message: 'Database operation failed',
        code: 'DATABASE_ERROR',
      },
    };
    res.status(500).json(response);
    return;
  }

  // Handle unknown errors (don't expose internal details)
  const response: ErrorResponse = {
    success: false,
    error: {
      message:
        process.env.NODE_ENV === 'development'
          ? err.message
          : 'An unexpected error occurred',
      code: 'INTERNAL_ERROR',
    },
  };
  res.status(500).json(response);
}

/**
 * Async handler wrapper to catch async errors
 * Wraps async route handlers to ensure errors are passed to error middleware
 */
export function asyncHandler<T>(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<T>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

