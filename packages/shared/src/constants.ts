/**
 * Shared Constants
 * 
 * Business constants used across the application.
 */

/**
 * Default VAT rate in Czech Republic (21%)
 */
export const DEFAULT_VAT_RATE = 0.21;

/**
 * Supported currency codes for conversion
 */
export const SUPPORTED_CURRENCIES = ['CZK', 'EUR', 'USD', 'PLN'] as const;

/**
 * Currency display names
 */
export const CURRENCY_NAMES: Record<string, string> = {
  CZK: 'Czech Koruna',
  EUR: 'Euro',
  USD: 'US Dollar',
  PLN: 'Polish Zloty',
};

/**
 * Currency symbols
 */
export const CURRENCY_SYMBOLS: Record<string, string> = {
  CZK: 'Kč',
  EUR: '€',
  USD: '$',
  PLN: 'zł',
};

