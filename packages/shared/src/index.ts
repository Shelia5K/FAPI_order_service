/**
 * @fapi/shared - Shared Package
 *
 * This package contains code shared between frontend (apps/web) and backend (apps/api):
 *
 * - **Types** - Shared type definitions for Product, Order, VAT breakdown, etc.
 * - **VAT Utilities** - Calculate subtotals, VAT amounts, and totals
 * - **Formatting** - Format prices and dates for Czech locale
 * - **Constants** - VAT rates, currency codes, and other business constants
 *
 * @example
 * ```typescript
 * // In apps/web or apps/api:
 * import {
 *   calculateVatBreakdown,
 *   DEFAULT_VAT_RATE,
 *   formatPriceCZK,
 *   type VatBreakdown,
 *   type Product,
 * } from '@fapi/shared';
 *
 * const breakdown = calculateVatBreakdown({
 *   unitPriceCzk: 1990,
 *   quantity: 2,
 * });
 * console.log(formatPriceCZK(breakdown.totalCzk)); // "4 815,80 Kč"
 * ```
 *
 * @packageDocumentation
 */

// =============================================================================
// Type Exports
// =============================================================================
export type {
  // Money types
  MoneyCZK,
  // VAT types
  VatBreakdown,
  VatCalculationInput,
  PriceBreakdown,
  // Product types
  Product,
  ProductDTO,
  // Order types
  Order,
  CreateOrderInput,
  OrderWithConversions,
  // Currency types
  CurrencyConversion,
  // Customer types
  CustomerAddress,
  CustomerInfo,
  // API types
  ApiError,
  ApiResponse,
  ApiErrorResponse,
} from './types/index.js';

// =============================================================================
// VAT Utilities
// =============================================================================
export {
  // Primary function (recommended)
  calculateVatBreakdown,
  // Helper functions
  calculateVatAmount,
  calculateTotalWithVat,
  calculatePriceBeforeVat,
} from './utils/vat.js';

// =============================================================================
// Formatting Utilities
// =============================================================================
export {
  formatPriceCZK,
  formatPrice,
  formatDateCZ,
  formatDateTimeCZ,
  formatVatRate,
} from './utils/formatting.js';

// =============================================================================
// Constants
// =============================================================================
export {
  DEFAULT_VAT_RATE,
  SUPPORTED_CURRENCIES,
  CURRENCY_NAMES,
  CURRENCY_SYMBOLS,
} from './constants.js';
