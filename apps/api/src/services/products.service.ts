/**
 * Products Service
 *
 * Business logic for products.
 * Responsibilities:
 * - Fetch products from database
 * - Format products for API responses
 *
 * This layer sits between controllers and database access,
 * containing all business rules related to products.
 */

import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '../db/prisma.js';
import { formatPriceCZK } from '@fapi/shared';
import type { ProductDTO } from '@fapi/shared';
import { NotFoundError } from '../lib/errors.js';

/**
 * Type representing the raw product data from database
 */
interface ProductRecord {
  id: number;
  title: string;
  description: string | null;
  priceCzk: Decimal;
  quantity: number;
  createdAt: Date;
}

/**
 * Convert a database product record to a ProductDTO for API responses
 */
function toProductDTO(p: ProductRecord): ProductDTO {
  return {
    id: p.id,
    title: p.title,
    description: p.description,
    priceCzk: Number(p.priceCzk),
    formattedPrice: formatPriceCZK(Number(p.priceCzk)),
    available: p.quantity > 0,
    quantity: p.quantity,
  };
}

export const productsService = {
  /**
   * Get all products
   *
   * @param includeOutOfStock - If true, includes products with quantity = 0
   * Returns formatted DTOs ready for API response
   */
  async findAll(includeOutOfStock = false): Promise<ProductDTO[]> {
    console.log(`📋 Fetching products (includeOutOfStock: ${includeOutOfStock})`);

    const products = await prisma.product.findMany({
      where: includeOutOfStock ? {} : { quantity: { gt: 0 } },
      orderBy: {
        title: 'asc',
      },
    });

    console.log(`✅ Found ${products.length} products`);

    return products.map(toProductDTO);
  },

  /**
   * Get a single product by ID
   *
   * @throws NotFoundError if product doesn't exist
   */
  async findById(id: number): Promise<ProductDTO> {
    console.log(`🔍 Fetching product ${id}`);

    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundError('Product', id);
    }

    return toProductDTO(product);
  },

  /**
   * Check if product has sufficient quantity for an order
   */
  async checkAvailability(
    productId: number,
    requestedQuantity: number
  ): Promise<boolean> {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { quantity: true },
    });

    if (!product) {
      return false;
    }

    return product.quantity >= requestedQuantity;
  },
};
