/**
 * VAT Calculation Tests
 *
 * Unit tests for VAT calculation utilities.
 * Run with: npm run test --workspace=packages/shared
 */

import { describe, it, expect } from 'vitest';
import {
  calculateVatBreakdown,
  calculateVatAmount,
  calculateTotalWithVat,
  calculatePriceBeforeVat,
} from './vat.js';
import { DEFAULT_VAT_RATE } from '../constants.js';

describe('VAT Calculations', () => {
  // =========================================================================
  // calculateVatBreakdown (Primary Function)
  // =========================================================================
  describe('calculateVatBreakdown', () => {
    it('should calculate complete VAT breakdown with default rate (21%)', () => {
      const result = calculateVatBreakdown({
        unitPriceCzk: 1990,
        quantity: 2,
      });

      expect(result.subtotalCzk).toBe(3980);
      expect(result.vatAmountCzk).toBe(835.8);
      expect(result.totalCzk).toBe(4815.8);
      expect(result.vatRate).toBe(DEFAULT_VAT_RATE);
    });

    it('should calculate breakdown with quantity of 1', () => {
      const result = calculateVatBreakdown({
        unitPriceCzk: 1000,
        quantity: 1,
      });

      expect(result.subtotalCzk).toBe(1000);
      expect(result.vatAmountCzk).toBe(210);
      expect(result.totalCzk).toBe(1210);
    });

    it('should use custom VAT rate when provided', () => {
      const result = calculateVatBreakdown({
        unitPriceCzk: 1000,
        quantity: 1,
        vatRate: 0.15,
      });

      expect(result.vatRate).toBe(0.15);
      expect(result.vatAmountCzk).toBe(150);
      expect(result.totalCzk).toBe(1150);
    });

    it('should handle zero quantity (returns zeros)', () => {
      const result = calculateVatBreakdown({
        unitPriceCzk: 1990,
        quantity: 0,
      });

      expect(result.subtotalCzk).toBe(0);
      expect(result.vatAmountCzk).toBe(0);
      expect(result.totalCzk).toBe(0);
    });

    it('should clamp negative quantity to zero', () => {
      const result = calculateVatBreakdown({
        unitPriceCzk: 1990,
        quantity: -5,
      });

      expect(result.subtotalCzk).toBe(0);
      expect(result.vatAmountCzk).toBe(0);
      expect(result.totalCzk).toBe(0);
    });

    it('should clamp negative price to zero', () => {
      const result = calculateVatBreakdown({
        unitPriceCzk: -100,
        quantity: 5,
      });

      expect(result.subtotalCzk).toBe(0);
      expect(result.vatAmountCzk).toBe(0);
      expect(result.totalCzk).toBe(0);
    });

    it('should handle NaN quantity defensively', () => {
      const result = calculateVatBreakdown({
        unitPriceCzk: 1000,
        quantity: NaN,
      });

      expect(result.subtotalCzk).toBe(0);
      expect(result.vatAmountCzk).toBe(0);
      expect(result.totalCzk).toBe(0);
    });

    it('should handle Infinity price defensively', () => {
      const result = calculateVatBreakdown({
        unitPriceCzk: Infinity,
        quantity: 1,
      });

      expect(result.subtotalCzk).toBe(0);
      expect(result.vatAmountCzk).toBe(0);
      expect(result.totalCzk).toBe(0);
    });

    it('should round fractional quantities to nearest integer', () => {
      const result = calculateVatBreakdown({
        unitPriceCzk: 1000,
        quantity: 2.7, // Should round to 3
      });

      expect(result.subtotalCzk).toBe(3000);
    });

    it('should round monetary values to 2 decimal places', () => {
      const result = calculateVatBreakdown({
        unitPriceCzk: 333.33,
        quantity: 3,
      });

      // 333.33 * 3 = 999.99
      // 999.99 * 0.21 = 209.9979 → 210.00
      expect(result.subtotalCzk).toBe(999.99);
      expect(result.vatAmountCzk).toBe(210);
      expect(result.totalCzk).toBe(1209.99);
    });
  });

  // =========================================================================
  // Legacy Functions (backwards compatibility)
  // =========================================================================
  describe('calculateVatAmount', () => {
    it('should calculate VAT amount with default rate (21%)', () => {
      expect(calculateVatAmount(1000)).toBe(210);
      expect(calculateVatAmount(100)).toBe(21);
      expect(calculateVatAmount(1990)).toBe(417.9);
    });

    it('should calculate VAT amount with custom rate', () => {
      expect(calculateVatAmount(1000, 0.15)).toBe(150);
      expect(calculateVatAmount(1000, 0.1)).toBe(100);
    });

    it('should handle zero amount', () => {
      expect(calculateVatAmount(0)).toBe(0);
    });

    it('should round to 2 decimal places', () => {
      // 333.33 * 0.21 = 69.9993 → should round to 70.00
      expect(calculateVatAmount(333.33)).toBe(70);
    });

    it('should handle negative values defensively', () => {
      expect(calculateVatAmount(-100)).toBe(0);
    });
  });

  describe('calculateTotalWithVat', () => {
    it('should calculate total including VAT with default rate', () => {
      expect(calculateTotalWithVat(1000)).toBe(1210);
      expect(calculateTotalWithVat(100)).toBe(121);
    });

    it('should calculate total including VAT with custom rate', () => {
      expect(calculateTotalWithVat(1000, 0.15)).toBe(1150);
    });

    it('should handle zero amount', () => {
      expect(calculateTotalWithVat(0)).toBe(0);
    });

    it('should handle negative values defensively', () => {
      expect(calculateTotalWithVat(-100)).toBe(0);
    });
  });

  describe('calculatePriceBeforeVat', () => {
    it('should extract price before VAT with default rate', () => {
      expect(calculatePriceBeforeVat(1210)).toBe(1000);
      expect(calculatePriceBeforeVat(121)).toBe(100);
    });

    it('should extract price before VAT with custom rate', () => {
      expect(calculatePriceBeforeVat(1150, 0.15)).toBe(1000);
    });

    it('should handle zero amount', () => {
      expect(calculatePriceBeforeVat(0)).toBe(0);
    });

    it('should handle negative values defensively', () => {
      expect(calculatePriceBeforeVat(-100)).toBe(0);
    });
  });

});
