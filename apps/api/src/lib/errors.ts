/**
 * Custom Error Classes
 *
 * Structured errors for consistent API error responses.
 * Each error type maps to a specific HTTP status code.
 */

/**
 * Base class for API errors
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
    public details?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'ApiError';
    // Maintains proper stack trace for where our error was thrown (only in V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }
}

/**
 * 400 Bad Request - Invalid input data
 */
export class ValidationError extends ApiError {
  constructor(message: string, details?: Record<string, string[]>) {
    super(400, message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

/**
 * 404 Not Found - Resource does not exist
 */
export class NotFoundError extends ApiError {
  constructor(resource: string, id?: string | number) {
    const message = id
      ? `${resource} with ID ${id} not found`
      : `${resource} not found`;
    super(404, message, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

/**
 * 409 Conflict - Business rule violation (e.g., insufficient stock)
 */
export class ConflictError extends ApiError {
  constructor(message: string) {
    super(409, message, 'CONFLICT');
    this.name = 'ConflictError';
  }
}

/**
 * 500 Internal Server Error - Unexpected errors
 */
export class InternalError extends ApiError {
  constructor(message = 'An unexpected error occurred') {
    super(500, message, 'INTERNAL_ERROR');
    this.name = 'InternalError';
  }
}

/**
 * Type guard to check if an error is an ApiError
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

