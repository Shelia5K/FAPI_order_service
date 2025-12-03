/**
 * Orders Controller
 *
 * Handles HTTP requests related to orders.
 * This layer is thin - it validates input, calls services, and formats responses.
 *
 * Routes:
 * - POST /orders          - Create a new order
 * - GET /orders/:id       - Get order details by ID
 * - GET /orders/:id/summary - Get order summary with FX conversions
 */

import { Request, Response } from 'express';
import { ordersService } from '../services/orders.service.js';
import { cnbRatesService } from '../services/cnbRates.service.js';
import { formatPriceCZK } from '@fapi/shared';
import {
  validate,
  createOrderSchema,
  orderIdSchema,
} from '../lib/validation.js';

/**
 * Success response wrapper
 */
interface SuccessResponse<T> {
  success: true;
  data: T;
}

function success<T>(data: T): SuccessResponse<T> {
  return { success: true, data };
}

export const ordersController = {
  /**
   * POST /orders
   * Creates a new order
   *
   * Request body:
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
   * @throws 400 if validation fails
   * @throws 404 if product not found
   * @throws 409 if insufficient stock
   */
  async create(req: Request, res: Response): Promise<void> {
    // Validate request body
    const input = validate(createOrderSchema, req.body);

    // Create the order
    const order = await ordersService.create({
      productId: input.productId,
      quantity: input.quantity,
      customer: {
        name: input.customer.name,
        email: input.customer.email,
        phone: input.customer.phone,
        addressLine1: input.customer.addressLine1,
        addressLine2: input.customer.addressLine2,
        city: input.customer.city,
        country: input.customer.country,
        zipCode: input.customer.zipCode,
      },
    });

    // Return 201 Created with order data
    res.status(201).json(success(order));
  },

  /**
   * GET /orders/:id
   * Returns order details including product info and currency conversions
   *
   * @throws 400 if ID is not a valid number
   * @throws 404 if order not found
   */
  async getById(req: Request, res: Response): Promise<void> {
    // Validate path parameter
    const { id } = validate(orderIdSchema, req.params);

    const order = await ordersService.findById(id);

    res.json(success(order));
  },

  /**
   * GET /orders/:id/summary
   * Returns order summary with CZK totals and FX conversions
   *
   * Response includes:
   * - Basic order info (id, product title, quantity)
   * - CZK totals (subtotal, VAT, total)
   * - FX conversions (EUR, USD, PLN) if available
   * - fxAvailable flag indicating if conversion succeeded
   *
   * If CNB API is unavailable:
   * - Returns order with CZK totals
   * - Sets fxAvailable: false
   * - Sets fxError with error message
   *
   * @throws 400 if ID is not a valid number
   * @throws 404 if order not found
   */
  async getSummary(req: Request, res: Response): Promise<void> {
    // Validate path parameter
    const { id } = validate(orderIdSchema, req.params);

    // Fetch order (throws 404 if not found)
    const order = await ordersService.findByIdBasic(id);

    // Build CZK totals
    const czkTotals = {
      subtotalCzk: order.subtotalCzk,
      vatAmountCzk: order.vatAmountCzk,
      vatRate: order.vatRate,
      totalCzk: order.totalPriceCzk,
      // Formatted versions for display
      formatted: {
        subtotal: formatPriceCZK(order.subtotalCzk),
        vatAmount: formatPriceCZK(order.vatAmountCzk),
        total: formatPriceCZK(order.totalPriceCzk),
      },
    };

    // Attempt to fetch FX rates and convert
    const fxResult = await cnbRatesService.fetchCnbRates('CZK');
    const conversionResult = cnbRatesService.convertFromCzk(
      order.totalPriceCzk,
      fxResult.rates
    );

    // Build response
    const summary = {
      order: {
        id: order.id,
        createdAt: order.createdAt,
        productId: order.productId,
        productTitle: order.productTitle,
        quantity: order.quantity,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
      },
      totals: {
        czk: czkTotals,
        // FX conversions (may be unavailable)
        fx: {
          available: conversionResult.fxAvailable,
          error: fxResult.success ? undefined : fxResult.error,
          conversions: conversionResult.conversions,
        },
      },
    };

    res.json(success(summary));
  },
};
