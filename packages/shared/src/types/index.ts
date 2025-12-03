/**
 * Shared Type Definitions
 *
 * These types are used by both frontend and backend
 * to ensure consistency across the application.
 *
 * @packageDocumentation
 */

// =============================================================================
// Money Types
// =============================================================================

/**
 * Represents a monetary amount in Czech Koruna (CZK).
 *
 * All prices in this application are stored and calculated in CZK.
 * The value should be a number with up to 2 decimal places.
 *
 * @example
 * const price: MoneyCZK = 1990.00;
 */
export type MoneyCZK = number;

// =============================================================================
// VAT Types
// =============================================================================

/**
 * Input parameters for VAT calculation
 */
export interface VatCalculationInput {
  /** Price per unit in CZK (without VAT) */
  unitPriceCzk: MoneyCZK;
  /** Number of units to purchase */
  quantity: number;
  /** VAT rate as decimal (e.g., 0.21 for 21%). Optional, defaults to 21% */
  vatRate?: number;
}

/**
 * Result of VAT calculation - complete price breakdown
 *
 * All monetary values are in CZK.
 * This is the primary interface for displaying order pricing to users.
 */
export interface VatBreakdown {
  /** Subtotal before VAT (unitPrice × quantity) */
  subtotalCzk: MoneyCZK;
  /** VAT amount (subtotalCzk × vatRate) */
  vatAmountCzk: MoneyCZK;
  /** Total including VAT (subtotalCzk + vatAmountCzk) */
  totalCzk: MoneyCZK;
  /** VAT rate used in calculation (e.g., 0.21 for 21%) */
  vatRate: number;
}

/**
 * Extended price breakdown including input values
 * @deprecated Use VatBreakdown for new code. This is kept for backwards compatibility.
 */
export interface PriceBreakdown extends VatBreakdown {
  /** Original unit price */
  unitPrice: MoneyCZK;
  /** Quantity ordered */
  quantity: number;
  /** @deprecated Use subtotalCzk */
  subtotal: MoneyCZK;
  /** @deprecated Use vatAmountCzk */
  vatAmount: MoneyCZK;
  /** @deprecated Use totalCzk */
  total: MoneyCZK;
}

// =============================================================================
// Product Types
// =============================================================================

/**
 * Product as stored in database
 */
export interface Product {
  id: number;
  title: string;
  description: string | null;
  priceCzk: MoneyCZK;
  quantity: number;
  createdAt: Date;
}

/**
 * Product as returned by API (formatted for frontend)
 */
export interface ProductDTO {
  id: number;
  title: string;
  description: string | null;
  priceCzk: MoneyCZK;
  formattedPrice: string;
  available: boolean;
  quantity: number;
}

// =============================================================================
// Order Types
// =============================================================================

/**
 * Order as stored in database
 */
export interface Order {
  id: number;
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
  unitPriceCzk: MoneyCZK;
  subtotalCzk: MoneyCZK;
  vatRate: number;
  vatAmountCzk: MoneyCZK;
  totalPriceCzk: MoneyCZK;
  createdAt: Date;
}

/**
 * Input for creating a new order
 */
export interface CreateOrderInput {
  productId: number;
  quantity: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddressLine1: string;
  customerAddressLine2?: string;
  customerCity: string;
  customerCountry: string;
  customerZipCode: string;
}

// =============================================================================
// Currency Types
// =============================================================================

/**
 * Currency conversion result
 */
export interface CurrencyConversion {
  /** ISO currency code (e.g., "EUR", "USD") */
  code: string;
  /** Converted amount in target currency */
  amount: number;
  /** Human-readable formatted string (e.g., "€82.64") */
  formatted: string;
}

/**
 * Order response with currency conversions (for thank-you page)
 */
export interface OrderWithConversions extends Order {
  product: ProductDTO;
  conversions: CurrencyConversion[];
}

// =============================================================================
// Customer Types
// =============================================================================

/**
 * Customer address information
 */
export interface CustomerAddress {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  country: string;
  zipCode: string;
}

/**
 * Customer information for order
 */
export interface CustomerInfo extends CustomerAddress {
  name: string;
  email: string;
  phone: string;
}

// =============================================================================
// API Types
// =============================================================================

/**
 * API error response
 */
export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, string[]>;
}

/**
 * API success response wrapper
 */
export interface ApiResponse<T> {
  success: true;
  data: T;
}

/**
 * API error response wrapper
 */
export interface ApiErrorResponse {
  success: false;
  error: ApiError;
}
