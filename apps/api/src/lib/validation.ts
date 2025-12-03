/**
 * Request Validation Schemas
 *
 * Zod schemas for validating API request data.
 * These ensure type safety and provide clear error messages.
 */

import { z } from 'zod';

// =============================================================================
// Customer Schema
// =============================================================================

/**
 * Customer information validation
 */
export const customerSchema = z.object({
  name: z
    .string()
    .min(1, 'Customer name is required')
    .max(255, 'Customer name must be at most 255 characters'),

  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address')
    .max(255, 'Email must be at most 255 characters'),

  phone: z
    .string()
    .min(1, 'Phone number is required')
    .max(50, 'Phone number must be at most 50 characters'),

  addressLine1: z
    .string()
    .min(1, 'Address is required')
    .max(255, 'Address must be at most 255 characters'),

  addressLine2: z
    .string()
    .max(255, 'Address line 2 must be at most 255 characters')
    .optional()
    .nullable(),

  city: z
    .string()
    .min(1, 'City is required')
    .max(100, 'City must be at most 100 characters'),

  country: z
    .string()
    .min(1, 'Country is required')
    .max(100, 'Country must be at most 100 characters'),

  zipCode: z
    .string()
    .min(1, 'ZIP code is required')
    .max(20, 'ZIP code must be at most 20 characters'),
});

// =============================================================================
// Order Schemas
// =============================================================================

/**
 * Create order request validation
 */
export const createOrderSchema = z.object({
  productId: z
    .number({ invalid_type_error: 'Product ID must be a number' })
    .int('Product ID must be an integer')
    .positive('Product ID must be positive'),

  quantity: z
    .number({ invalid_type_error: 'Quantity must be a number' })
    .int('Quantity must be an integer')
    .positive('Quantity must be at least 1')
    .max(1000, 'Quantity cannot exceed 1000'),

  customer: customerSchema,
});

/**
 * Order ID parameter validation
 */
export const orderIdSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, 'Order ID must be a number')
    .transform(Number),
});

// =============================================================================
// Product Schemas
// =============================================================================

/**
 * Product ID parameter validation
 */
export const productIdSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, 'Product ID must be a number')
    .transform(Number),
});

// =============================================================================
// Type Exports (inferred from schemas)
// =============================================================================

export type CreateOrderRequest = z.infer<typeof createOrderSchema>;
export type CustomerInput = z.infer<typeof customerSchema>;

// =============================================================================
// Validation Helper
// =============================================================================

import { ValidationError } from './errors.js';

/**
 * Validate data against a Zod schema
 * Throws ValidationError with detailed field errors if validation fails
 *
 * @template Output - The output type after parsing
 * @template Input - The input type (may differ from output due to transforms)
 */
export function validate<Output, Input = Output>(
  schema: z.ZodType<Output, z.ZodTypeDef, Input>,
  data: unknown
): Output {
  const result = schema.safeParse(data);

  if (!result.success) {
    // Convert Zod errors to our format
    const details: Record<string, string[]> = {};

    for (const error of result.error.errors) {
      const path = error.path.join('.');
      if (!details[path]) {
        details[path] = [];
      }
      details[path].push(error.message);
    }

    throw new ValidationError('Validation failed', details);
  }

  return result.data;
}

