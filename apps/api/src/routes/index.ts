/**
 * Routes Index
 *
 * Aggregates all route modules for easy mounting in the main app.
 */

import { Router } from 'express';
import productsRoutes from './products.routes.js';
import ordersRoutes from './orders.routes.js';

const router = Router();

// Mount route modules
router.use('/products', productsRoutes);
router.use('/orders', ordersRoutes);

export default router;

