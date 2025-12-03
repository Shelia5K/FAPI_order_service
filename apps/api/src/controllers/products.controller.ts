/**
 * Products Controller
 *
 * Handles HTTP requests related to products.
 * This layer is thin - it validates input, calls services, and formats responses.
 *
 * Routes:
 * - GET /products     - List all available products
 * - GET /products/:id - Get a single product by ID
 */

import { Request, Response } from 'express';
import { productsService } from '../services/products.service.js';
import { validate, productIdSchema } from '../lib/validation.js';

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

export const productsController = {
  /**
   * GET /products
   * Returns all products
   *
   * Query params:
   * - includeOutOfStock: if "true", includes products with quantity = 0
   */
  async getAll(req: Request, res: Response): Promise<void> {
    const includeOutOfStock = req.query.includeOutOfStock === 'true';
    const products = await productsService.findAll(includeOutOfStock);

    res.json(success(products));
  },

  /**
   * GET /products/:id
   * Returns a single product by ID
   *
   * @throws 400 if ID is not a valid number
   * @throws 404 if product not found
   */
  async getById(req: Request, res: Response): Promise<void> {
    // Validate path parameter
    const { id } = validate(productIdSchema, req.params);

    const product = await productsService.findById(id);

    res.json(success(product));
  },
};
