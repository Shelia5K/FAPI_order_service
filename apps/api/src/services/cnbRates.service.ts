/**
 * CNB (Czech National Bank) Exchange Rates Service
 *
 * Fetches and parses exchange rates from the Czech National Bank.
 *
 * CNB API Details:
 * - Endpoint: https://www.cnb.cz/cs/financni-trhy/devizovy-trh/kurzy-devizoveho-trhu/kurzy-devizoveho-trhu/denni_kurz.txt
 * - Format: Pipe-separated text file
 * - Updated: Daily (around 14:30 CET)
 *
 * Rate Convention (IMPORTANT):
 * ============================
 * CNB rates are expressed as: "X CZK = N units of foreign currency"
 *
 * Example from CNB:
 *   EMU|euro|1|EUR|24,725
 *   means: 24.725 CZK = 1 EUR
 *
 * Our `CnbRates` mapping uses the same convention:
 *   { EUR: 24.725 } means "1 EUR costs 24.725 CZK"
 *
 * To convert CZK to foreign currency:
 *   foreignAmount = czkAmount / rate
 *   Example: 1000 CZK → EUR = 1000 / 24.725 = 40.44 EUR
 *
 * @module
 */

import { formatPrice } from '@fapi/shared';

// =============================================================================
// Types
// =============================================================================

/**
 * Supported currencies for conversion
 */
export const SUPPORTED_CURRENCIES = ['EUR', 'USD', 'PLN'] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

/**
 * Exchange rates mapping: currency code → rate in CZK
 *
 * Convention: rate value = how many CZK for 1 unit of foreign currency
 * Example: { EUR: 24.725 } means 1 EUR = 24.725 CZK
 */
export type CnbRates = Record<SupportedCurrency, number | null>;

/**
 * Result of fetching CNB rates
 */
export interface FetchRatesResult {
  success: boolean;
  rates: CnbRates | null;
  error?: string;
  fetchedAt?: Date;
}

/**
 * Single currency conversion result
 */
export interface CurrencyConversionResult {
  code: SupportedCurrency;
  /** Converted amount (null if rate unavailable) */
  amount: number | null;
  /** Human-readable formatted string */
  formatted: string;
}

/**
 * All conversions for a CZK amount
 */
export interface ConversionResult {
  /** Original amount in CZK */
  originalCzk: number;
  /** Whether FX conversion was successful */
  fxAvailable: boolean;
  /** Individual currency conversions */
  conversions: CurrencyConversionResult[];
}

// =============================================================================
// Configuration
// =============================================================================

/**
 * CNB API URL - can be overridden via environment variable for testing
 */
const CNB_API_URL =
  process.env.CNB_API_URL ||
  'https://www.cnb.cz/cs/financni-trhy/devizovy-trh/kurzy-devizoveho-trhu/kurzy-devizoveho-trhu/denni_kurz.txt';

/**
 * Request timeout in milliseconds
 */
const FETCH_TIMEOUT_MS = 10000; // 10 seconds

// =============================================================================
// Service
// =============================================================================

export const cnbRatesService = {
  /**
   * Fetch current exchange rates from CNB
   *
   * @param _baseCurrency - Base currency (only 'CZK' supported)
   * @returns Rates mapping or null if fetch failed
   *
   * @example
   * const result = await cnbRatesService.fetchCnbRates('CZK');
   * if (result.success && result.rates) {
   *   console.log('1 EUR =', result.rates.EUR, 'CZK');
   * }
   */
  async fetchCnbRates(_baseCurrency: 'CZK'): Promise<FetchRatesResult> {
    console.log('💱 Fetching exchange rates from CNB...');

    try {
      // Fetch with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

      const response = await fetch(CNB_API_URL, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(`⚠️ CNB API returned status ${response.status}`);
        return {
          success: false,
          rates: null,
          error: `CNB API returned status ${response.status}`,
        };
      }

      const text = await response.text();
      const rates = this.parseRatesText(text);

      console.log('✅ Exchange rates fetched successfully');

      return {
        success: true,
        rates,
        fetchedAt: new Date(),
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Failed to fetch CNB rates:', errorMessage);

      return {
        success: false,
        rates: null,
        error: `Failed to fetch rates: ${errorMessage}`,
      };
    }
  },

  /**
   * Parse CNB text format into rates mapping
   *
   * CNB Format:
   * Line 1: Date and sequence (e.g., "02.01.2024 #1")
   * Line 2: Headers (země|měna|množství|kód|kurz)
   * Lines 3+: Data (country|currency|amount|code|rate)
   *
   * Example data line:
   * EMU|euro|1|EUR|24,725
   */
  parseRatesText(text: string): CnbRates {
    const rates: CnbRates = {
      EUR: null,
      USD: null,
      PLN: null,
    };

    const lines = text.trim().split('\n');

    // Skip first two lines (date and header)
    for (let i = 2; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;

      const parts = line.split('|');
      if (parts.length < 5) continue;

      const code = parts[3]?.trim() as SupportedCurrency;
      const amountStr = parts[2]?.trim() ?? '';
      const rateStr = parts[4]?.trim() ?? '';

      // Only process currencies we care about
      if (!SUPPORTED_CURRENCIES.includes(code)) continue;

      // Parse values (CNB uses comma as decimal separator)
      const amount = parseInt(amountStr, 10);
      const rate = parseFloat(rateStr.replace(',', '.'));

      if (isNaN(amount) || isNaN(rate) || amount === 0) continue;

      // Normalize rate to "1 unit of foreign = X CZK"
      // CNB format: rate = how many CZK for 'amount' units
      // We want: how many CZK for 1 unit
      rates[code] = rate / amount;
    }

    return rates;
  },

  /**
   * Convert a CZK amount to supported foreign currencies
   *
   * This is a pure function that takes rates as input,
   * making it easy to test and mock.
   *
   * @param amountCzk - Amount in Czech Koruna
   * @param rates - Exchange rates (from fetchCnbRates)
   * @returns Conversion results for all supported currencies
   *
   * @example
   * const rates = { EUR: 24.725, USD: 22.50, PLN: 5.50 };
   * const result = cnbRatesService.convertFromCzk(1000, rates);
   * // result.conversions[0] = { code: 'EUR', amount: 40.44, formatted: '€40.44' }
   */
  convertFromCzk(amountCzk: number, rates: CnbRates | null): ConversionResult {
    const conversions: CurrencyConversionResult[] = [];
    let hasAnyConversion = false;

    for (const code of SUPPORTED_CURRENCIES) {
      const rate = rates?.[code];

      if (rate !== null && rate !== undefined && rate > 0) {
        // Convert: foreignAmount = czkAmount / rate
        const convertedAmount = amountCzk / rate;
        const roundedAmount = Math.round(convertedAmount * 100) / 100;

        conversions.push({
          code,
          amount: roundedAmount,
          formatted: formatPrice(roundedAmount, code),
        });
        hasAnyConversion = true;
      } else {
        // Rate unavailable
        conversions.push({
          code,
          amount: null,
          formatted: 'N/A',
        });
      }
    }

    return {
      originalCzk: amountCzk,
      fxAvailable: hasAnyConversion,
      conversions,
    };
  },

  /**
   * Convenience method: fetch rates and convert in one call
   *
   * Use this for simple cases. For multiple conversions,
   * prefer fetching rates once and reusing them.
   */
  async fetchAndConvert(amountCzk: number): Promise<ConversionResult> {
    const { rates } = await this.fetchCnbRates('CZK');
    return this.convertFromCzk(amountCzk, rates);
  },
};

export default cnbRatesService;

