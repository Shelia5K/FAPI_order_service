/**
 * Products Routes
 *
 * Route definitions for product-related endpoints.
 *
 * Routes:
 * - GET /products     - List all available products
 * - GET /products/:id - Get a single product by ID
 */

import { Router } from 'express';
import { productsController } from '../controllers/products.controller.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

/**
 * GET /products
 * Returns all available products (with quantity > 0)
 */
router.get('/', asyncHandler(productsController.getAll));

/**
 * GET /products/:id
 * Returns a single product by ID
 */
router.get('/:id', asyncHandler(productsController.getById));

export default router;

