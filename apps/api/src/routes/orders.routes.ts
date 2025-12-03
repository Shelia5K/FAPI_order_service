/**
 * Orders Routes
 *
 * Route definitions for order-related endpoints.
 *
 * Routes:
 * - POST /orders          - Create a new order
 * - GET /orders/:id       - Get order details by ID
 * - GET /orders/:id/summary - Get order summary with FX conversions
 */

import { Router } from 'express';
import { ordersController } from '../controllers/orders.controller.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

/**
 * POST /orders
 * Creates a new order
 *
 * Body:
 * {
 *   productId: number,
 *   quantity: number,
 *   customer: {
 *     name: string,
 *     email: string,
 *     phone: string,
 *     addressLine1: string,
 *     addressLine2?: string,
 *     city: string,
 *     country: string,
 *     zipCode: string
 *   }
 * }
 *
 * Returns: 201 Created with order data
 * Errors: 400 (validation), 404 (product not found), 409 (insufficient stock)
 */
router.post('/', asyncHandler(ordersController.create));

/**
 * GET /orders/:id
 * Returns full order details including product info and currency conversions
 *
 * Returns: 200 with order data and conversions
 * Errors: 400 (invalid ID), 404 (order not found)
 */
router.get('/:id', asyncHandler(ordersController.getById));

/**
 * GET /orders/:id/summary
 * Returns order summary with CZK totals and optional FX conversions
 *
 * This endpoint handles CNB API failures gracefully:
 * - If CNB is available: returns CZK totals + FX conversions (fxAvailable: true)
 * - If CNB fails: returns CZK totals only (fxAvailable: false, fxError: "...")
 *
 * Response format:
 * {
 *   success: true,
 *   data: {
 *     order: { id, createdAt, productId, productTitle, quantity, customerName, customerEmail },
 *     totals: {
 *       czk: { subtotalCzk, vatAmountCzk, vatRate, totalCzk, formatted: {...} },
 *       fx: {
 *         available: boolean,
 *         error?: string,
 *         conversions: [{ code, amount, formatted }, ...]
 *       }
 *     }
 *   }
 * }
 *
 * Returns: 200 with summary data
 * Errors: 400 (invalid ID), 404 (order not found)
 */
router.get('/:id/summary', asyncHandler(ordersController.getSummary));

export default router;
