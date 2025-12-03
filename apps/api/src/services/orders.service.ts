/**
 * Orders Service
 *
 * Business logic for orders.
 * Responsibilities:
 * - Create orders with price calculations
 * - Validate business rules (stock availability)
 * - Coordinate database transactions
 *
 * This layer contains all business rules related to orders.
 */

import { prisma } from '../db/prisma.js';
import {
  calculateVatBreakdown,
  DEFAULT_VAT_RATE,
  formatPriceCZK,
} from '@fapi/shared';
import type { OrderWithConversions, ProductDTO } from '@fapi/shared';
import { NotFoundError, ConflictError } from '../lib/errors.js';
import { cnbRatesService } from './cnbRates.service.js';

// Transaction client type from Prisma
type TransactionClient = Omit<
  typeof prisma,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

// =============================================================================
// Types
// =============================================================================

/**
 * Input for creating an order (from validated request)
 */
export interface CreateOrderInput {
  productId: number;
  quantity: number;
  customer: {
    name: string;
    email: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string | null;
    city: string;
    country: string;
    zipCode: string;
  };
}

/**
 * Basic order data for summary endpoint (without FX conversions)
 */
export interface OrderBasic {
  id: number;
  createdAt: Date;
  productId: number;
  productTitle: string;
  quantity: number;
  customerName: string;
  customerEmail: string;
  unitPriceCzk: number;
  subtotalCzk: number;
  vatRate: number;
  vatAmountCzk: number;
  totalPriceCzk: number;
}

/**
 * Prisma Decimal type (simplified for our use case)
 * Prisma Decimal can be converted using Number() or .toNumber()
 */
type DecimalLike = number | { toNumber(): number };

/**
 * Type for Order with Product relation
 * We define this explicitly since Prisma's inferred types can be complex
 */
interface OrderWithProduct {
  id: number;
  createdAt: Date;
  productId: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddressLine1: string;
  customerAddressLine2: string | null;
  customerCity: string;
  customerCountry: string;
  customerZipCode: string;
  quantity: number;
  unitPriceCzk: DecimalLike;
  subtotalCzk: DecimalLike;
  vatRate: DecimalLike;
  vatAmountCzk: DecimalLike;
  totalPriceCzk: DecimalLike;
  product: {
    id: number;
    title: string;
    description: string | null;
    priceCzk: DecimalLike;
    quantity: number;
    createdAt: Date;
  };
}

// =============================================================================
// Service
// =============================================================================

export const ordersService = {
  /**
   * Create a new order
   *
   * Business rules:
   * - Product must exist
   * - Product must have sufficient quantity
   * - Prices are calculated using shared VAT utilities
   * - Operation is atomic (transaction)
   *
   * @throws NotFoundError if product doesn't exist
   * @throws ConflictError if insufficient stock
   */
  async create(input: CreateOrderInput): Promise<OrderWithConversions> {
    console.log(`📦 Creating order for product ${input.productId}, qty: ${input.quantity}`);

    // Use a transaction to ensure atomicity
    // Note: tx is a transaction client (limited Prisma client)
    const order = await prisma.$transaction(async (tx: TransactionClient) => {
      // 1. Fetch product
      const product = await tx.product.findUnique({
        where: { id: input.productId },
      });

      if (!product) {
        throw new NotFoundError('Product', input.productId);
      }

      // 2. Check availability
      if (product.quantity < input.quantity) {
        throw new ConflictError(
          `Insufficient stock. Available: ${product.quantity}, Requested: ${input.quantity}`
        );
      }

      // 3. Calculate prices using shared VAT utilities
      const unitPriceCzk = Number(product.priceCzk);
      const vatBreakdown = calculateVatBreakdown({
        unitPriceCzk,
        quantity: input.quantity,
        vatRate: DEFAULT_VAT_RATE,
      });

      console.log(`💰 Price breakdown: subtotal=${vatBreakdown.subtotalCzk}, VAT=${vatBreakdown.vatAmountCzk}, total=${vatBreakdown.totalCzk}`);

      // 4. Create the order
      // Prisma automatically converts numbers to Decimal for decimal fields
      const createdOrder = await tx.order.create({
        data: {
          productId: input.productId,
          customerName: input.customer.name,
          customerEmail: input.customer.email,
          customerPhone: input.customer.phone,
          customerAddressLine1: input.customer.addressLine1,
          customerAddressLine2: input.customer.addressLine2,
          customerCity: input.customer.city,
          customerCountry: input.customer.country,
          customerZipCode: input.customer.zipCode,
          quantity: input.quantity,
          unitPriceCzk: unitPriceCzk,
          subtotalCzk: vatBreakdown.subtotalCzk,
          vatRate: vatBreakdown.vatRate,
          vatAmountCzk: vatBreakdown.vatAmountCzk,
          totalPriceCzk: vatBreakdown.totalCzk,
        },
        include: {
          product: true,
        },
      });

      // 5. Decrement product quantity
      await tx.product.update({
        where: { id: input.productId },
        data: {
          quantity: {
            decrement: input.quantity,
          },
        },
      });

      console.log(`✅ Order ${createdOrder.id} created successfully`);
      return createdOrder;
    }) as unknown as OrderWithProduct;

    // 6. Fetch currency conversions and return
    return this.enrichOrderWithConversions(order);
  },

  /**
   * Get order by ID with all details including FX conversions
   *
   * @throws NotFoundError if order doesn't exist
   */
  async findById(id: number): Promise<OrderWithConversions> {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        product: true,
      },
    });

    if (!order) {
      throw new NotFoundError('Order', id);
    }

    return this.enrichOrderWithConversions(order);
  },

  /**
   * Get order by ID with basic info (without FX conversions)
   *
   * Use this when you need to handle FX conversion separately
   * (e.g., for graceful degradation when CNB API is unavailable)
   *
   * @throws NotFoundError if order doesn't exist
   */
  async findByIdBasic(id: number): Promise<OrderBasic> {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        product: {
          select: {
            title: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundError('Order', id);
    }

    return {
      id: order.id,
      createdAt: order.createdAt,
      productId: order.productId,
      productTitle: order.product.title,
      quantity: order.quantity,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      unitPriceCzk: Number(order.unitPriceCzk),
      subtotalCzk: Number(order.subtotalCzk),
      vatRate: Number(order.vatRate),
      vatAmountCzk: Number(order.vatAmountCzk),
      totalPriceCzk: Number(order.totalPriceCzk),
    };
  },

  /**
   * Add currency conversions and format the order for API response
   *
   * FX Conversion Note:
   * - Fetches rates from Czech National Bank (CNB)
   * - CNB updates rates daily around 14:30 CET
   * - If CNB is unavailable, returns empty conversions array
   */
  async enrichOrderWithConversions(
    order: OrderWithProduct
  ): Promise<OrderWithConversions> {
    // Get currency conversions from CNB
    const totalCzk = Number(order.totalPriceCzk);
    const fxResult = await cnbRatesService.fetchAndConvert(totalCzk);

    // Map to the expected format for OrderWithConversions
    const conversions = fxResult.conversions.map((c) => ({
      code: c.code,
      amount: c.amount ?? 0,
      formatted: c.formatted,
    }));

    // Format product as DTO
    const productDTO: ProductDTO = {
      id: order.product.id,
      title: order.product.title,
      description: order.product.description,
      priceCzk: Number(order.product.priceCzk),
      formattedPrice: formatPriceCZK(Number(order.product.priceCzk)),
      available: order.product.quantity > 0,
      quantity: order.product.quantity,
    };

    return {
      id: order.id,
      productId: order.productId,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      customerAddressLine1: order.customerAddressLine1,
      customerAddressLine2: order.customerAddressLine2,
      customerCity: order.customerCity,
      customerCountry: order.customerCountry,
      customerZipCode: order.customerZipCode,
      quantity: order.quantity,
      unitPriceCzk: Number(order.unitPriceCzk),
      subtotalCzk: Number(order.subtotalCzk),
      vatRate: Number(order.vatRate),
      vatAmountCzk: Number(order.vatAmountCzk),
      totalPriceCzk: totalCzk,
      createdAt: order.createdAt,
      product: productDTO,
      conversions,
    };
  },
};
