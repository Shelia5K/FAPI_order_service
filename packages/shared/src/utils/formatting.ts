/**
 * Formatting Utilities
 * 
 * Functions for formatting prices, dates, and other display values.
 */

import { CURRENCY_SYMBOLS } from '../constants.js';

/**
 * Format a price in CZK with proper Czech formatting
 * 
 * @param amount - Amount in CZK
 * @param includeSymbol - Whether to include the currency symbol (default: true)
 * @returns Formatted price string (e.g., "1 990,00 Kč")
 */
export function formatPriceCZK(amount: number, includeSymbol = true): string {
  const formatted = new Intl.NumberFormat('cs-CZ', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  return includeSymbol ? `${formatted} ${CURRENCY_SYMBOLS.CZK}` : formatted;
}

/**
 * Format a price in a specific currency
 * 
 * @param amount - Amount in the currency
 * @param currencyCode - Currency code (EUR, USD, PLN, etc.)
 * @returns Formatted price string
 */
export function formatPrice(amount: number, currencyCode: string): string {
  const locale = currencyCode === 'CZK' ? 'cs-CZ' : 'en-US';
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a date for display in Czech locale
 * 
 * @param date - Date to format
 * @returns Formatted date string (e.g., "2. 1. 2024")
 */
export function formatDateCZ(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('cs-CZ', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  }).format(d);
}

/**
 * Format a datetime for display in Czech locale
 * 
 * @param date - Date to format
 * @returns Formatted datetime string (e.g., "2. 1. 2024 14:30")
 */
export function formatDateTimeCZ(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('cs-CZ', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

/**
 * Format VAT rate for display
 * 
 * @param vatRate - VAT rate as decimal (e.g., 0.21)
 * @returns Formatted percentage (e.g., "21 %")
 */
export function formatVatRate(vatRate: number): string {
  return `${Math.round(vatRate * 100)} %`;
}

