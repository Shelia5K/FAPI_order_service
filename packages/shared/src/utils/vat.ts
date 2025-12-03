/**
 * VAT Calculation Utilities
 *
 * Functions for calculating VAT (Value Added Tax) amounts.
 * These are used by both frontend (for preview) and backend (for order creation).
 *
 * All calculations use CZK (Czech Koruna) as the currency.
 * The default VAT rate is 21% (0.21), which is the standard rate in Czech Republic.
 *
 * @packageDocumentation
 */

import { DEFAULT_VAT_RATE } from '../constants.js';
import type { VatBreakdown, VatCalculationInput, MoneyCZK } from '../types/index.js';

/**
 * Round a number to 2 decimal places (standard for currency)
 */
function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Ensure quantity is a valid non-negative integer
 * Clamps negative values to 0 and rounds to nearest integer
 */
function sanitizeQuantity(quantity: number): number {
  if (!Number.isFinite(quantity) || quantity < 0) {
    return 0;
  }
  return Math.max(0, Math.round(quantity));
}

/**
 * Ensure price is a valid non-negative number
 * Clamps negative values to 0
 */
function sanitizePrice(price: number): number {
  if (!Number.isFinite(price) || price < 0) {
    return 0;
  }
  return Math.max(0, price);
}

/**
 * Calculate VAT breakdown for an order
 *
 * This is the primary function for calculating prices with VAT.
 * Use this for displaying order totals on both frontend and backend.
 *
 * @param input - Calculation parameters
 * @param input.unitPriceCzk - Price per unit in CZK (before VAT)
 * @param input.quantity - Number of units (will be clamped to >= 0)
 * @param input.vatRate - VAT rate as decimal (default: 0.21 for 21%)
 * @returns Complete VAT breakdown with subtotal, VAT amount, and total
 *
 * @example
 * ```typescript
 * const breakdown = calculateVatBreakdown({
 *   unitPriceCzk: 1990,
 *   quantity: 2,
 * });
 * // Result:
 * // {
 * //   subtotalCzk: 3980,
 * //   vatAmountCzk: 835.80,
 * //   totalCzk: 4815.80,
 * //   vatRate: 0.21
 * // }
 * ```
 */
export function calculateVatBreakdown(input: VatCalculationInput): VatBreakdown {
  const unitPrice = sanitizePrice(input.unitPriceCzk);
  const quantity = sanitizeQuantity(input.quantity);
  const vatRate = input.vatRate ?? DEFAULT_VAT_RATE;

  // Calculate subtotal (price before VAT)
  const subtotalCzk = roundToTwoDecimals(unitPrice * quantity);

  // Calculate VAT amount
  const vatAmountCzk = roundToTwoDecimals(subtotalCzk * vatRate);

  // Calculate total (price with VAT)
  const totalCzk = roundToTwoDecimals(subtotalCzk + vatAmountCzk);

  return {
    subtotalCzk,
    vatAmountCzk,
    totalCzk,
    vatRate,
  };
}

/**
 * Calculate VAT amount from a price before VAT
 *
 * @param priceBeforeVat - Price without VAT
 * @param vatRate - VAT rate as decimal (e.g., 0.21 for 21%)
 * @returns VAT amount rounded to 2 decimal places
 */
export function calculateVatAmount(
  priceBeforeVat: MoneyCZK,
  vatRate: number = DEFAULT_VAT_RATE
): MoneyCZK {
  const sanitizedPrice = sanitizePrice(priceBeforeVat);
  return roundToTwoDecimals(sanitizedPrice * vatRate);
}

/**
 * Calculate total price including VAT
 *
 * @param priceBeforeVat - Price without VAT
 * @param vatRate - VAT rate as decimal (e.g., 0.21 for 21%)
 * @returns Total price including VAT, rounded to 2 decimal places
 */
export function calculateTotalWithVat(
  priceBeforeVat: MoneyCZK,
  vatRate: number = DEFAULT_VAT_RATE
): MoneyCZK {
  const sanitizedPrice = sanitizePrice(priceBeforeVat);
  const vatAmount = calculateVatAmount(sanitizedPrice, vatRate);
  return roundToTwoDecimals(sanitizedPrice + vatAmount);
}

/**
 * Calculate price before VAT from a price including VAT
 *
 * @param priceWithVat - Price including VAT
 * @param vatRate - VAT rate as decimal (e.g., 0.21 for 21%)
 * @returns Price before VAT, rounded to 2 decimal places
 */
export function calculatePriceBeforeVat(
  priceWithVat: MoneyCZK,
  vatRate: number = DEFAULT_VAT_RATE
): MoneyCZK {
  const sanitizedPrice = sanitizePrice(priceWithVat);
  return roundToTwoDecimals(sanitizedPrice / (1 + vatRate));
}