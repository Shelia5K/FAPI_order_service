/**
 * Orders API Integration Tests
 *
 * Tests the POST /orders endpoint end-to-end:
 * - Creates a test product
 * - Submits an order
 * - Verifies response and database state
 *
 * Run with: npm run test --workspace=apps/api
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { testPrisma, cleanDatabase } from './setup.js';
import { calculateVatBreakdown, DEFAULT_VAT_RATE } from '@fapi/shared';

// =============================================================================
// Test Data
// =============================================================================

const TEST_PRODUCT = {
  title: 'Test Produkt',
  description: 'Testovací produkt pro integrační testy',
  priceCzk: 1000, // 1000 CZK without VAT
  quantity: 50,
};

const TEST_ORDER = {
  quantity: 2,
  customer: {
    name: 'Test Zákazník',
    email: 'test@example.com',
    phone: '+420 123 456 789',
    addressLine1: 'Testovací 123',
    city: 'Praha',
    country: 'Česká republika',
    zipCode: '110 00',
  },
};

// API base URL
const API_URL = process.env.API_TEST_URL || 'http://localhost:3001';

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Make an API request
 */
async function apiRequest(
  method: string,
  path: string,
  body?: object
): Promise<{ status: number; data: unknown }> {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();
  return { status: response.status, data };
}

// =============================================================================
// Tests
// =============================================================================

describe('POST /api/orders', () => {
  let testProductId: number;

  /**
   * Setup: Create a test product
   */
  beforeAll(async () => {
    await cleanDatabase();

    const product = await testPrisma.product.create({
      data: {
        title: TEST_PRODUCT.title,
        description: TEST_PRODUCT.description,
        priceCzk: TEST_PRODUCT.priceCzk,
        quantity: TEST_PRODUCT.quantity,
      },
    });

    testProductId = product.id;
    console.log(`📦 Created test product with ID: ${testProductId}`);
  });

  /**
   * Cleanup: Delete test data
   */
  afterAll(async () => {
    await cleanDatabase();
  });

  // ===========================================================================
  // Success Cases
  // ===========================================================================

  it('should create an order and return 201 with correct data', async () => {
    // Arrange
    const orderPayload = {
      productId: testProductId,
      quantity: TEST_ORDER.quantity,
      customer: TEST_ORDER.customer,
    };

    // Calculate expected values using shared utility
    const expectedBreakdown = calculateVatBreakdown({
      unitPriceCzk: TEST_PRODUCT.priceCzk,
      quantity: TEST_ORDER.quantity,
      vatRate: DEFAULT_VAT_RATE,
    });

    // Act
    const { status, data } = await apiRequest('POST', '/api/orders', orderPayload);

    // Assert - Response
    expect(status).toBe(201);
    expect(data).toHaveProperty('success', true);
    expect(data).toHaveProperty('data');

    const order = (data as { data: { id: number; subtotalCzk: number; vatAmountCzk: number; totalPriceCzk: number } }).data;

    // Assert - Order ID
    expect(order.id).toBeDefined();
    expect(typeof order.id).toBe('number');

    // Assert - Pricing matches shared utility calculation
    expect(order.subtotalCzk).toBe(expectedBreakdown.subtotalCzk);
    expect(order.vatAmountCzk).toBe(expectedBreakdown.vatAmountCzk);
    expect(order.totalPriceCzk).toBe(expectedBreakdown.totalCzk);

    console.log(`✅ Order created with ID: ${order.id}`);
    console.log(`   Subtotal: ${order.subtotalCzk} CZK`);
    console.log(`   VAT: ${order.vatAmountCzk} CZK`);
    console.log(`   Total: ${order.totalPriceCzk} CZK`);
  });

  it('should decrease product quantity after order', async () => {
    // Arrange - Get current quantity
    const productBefore = await testPrisma.product.findUnique({
      where: { id: testProductId },
    });
    const quantityBefore = productBefore!.quantity;

    const orderQuantity = 3;
    const orderPayload = {
      productId: testProductId,
      quantity: orderQuantity,
      customer: TEST_ORDER.customer,
    };

    // Act
    const { status } = await apiRequest('POST', '/api/orders', orderPayload);

    // Assert - Order succeeded
    expect(status).toBe(201);

    // Assert - Product quantity decreased
    const productAfter = await testPrisma.product.findUnique({
      where: { id: testProductId },
    });

    expect(productAfter!.quantity).toBe(quantityBefore - orderQuantity);

    console.log(`✅ Product quantity decreased: ${quantityBefore} → ${productAfter!.quantity}`);
  });

  it('should store order in database with correct values', async () => {
    // Arrange
    const orderPayload = {
      productId: testProductId,
      quantity: 1,
      customer: TEST_ORDER.customer,
    };

    // Act
    const { status, data } = await apiRequest('POST', '/api/orders', orderPayload);

    // Assert - Response
    expect(status).toBe(201);

    const orderId = (data as { data: { id: number } }).data.id;

    // Assert - Database record
    const dbOrder = await testPrisma.order.findUnique({
      where: { id: orderId },
    });

    expect(dbOrder).not.toBeNull();
    expect(dbOrder!.customerName).toBe(TEST_ORDER.customer.name);
    expect(dbOrder!.customerEmail).toBe(TEST_ORDER.customer.email);
    expect(dbOrder!.productId).toBe(testProductId);
    expect(dbOrder!.quantity).toBe(1);

    // Verify VAT rate stored correctly
    expect(Number(dbOrder!.vatRate)).toBe(DEFAULT_VAT_RATE);

    console.log(`✅ Order ${orderId} verified in database`);
  });

  // ===========================================================================
  // Error Cases
  // ===========================================================================

  it('should return 404 for non-existent product', async () => {
    // Arrange
    const orderPayload = {
      productId: 99999, // Non-existent
      quantity: 1,
      customer: TEST_ORDER.customer,
    };

    // Act
    const { status, data } = await apiRequest('POST', '/api/orders', orderPayload);

    // Assert
    expect(status).toBe(404);
    expect(data).toHaveProperty('success', false);
    expect(data).toHaveProperty('error');

    console.log('✅ Correctly returned 404 for non-existent product');
  });

  it('should return 400 for invalid request body', async () => {
    // Arrange - Missing required fields
    const invalidPayload = {
      productId: testProductId,
      // Missing quantity and customer
    };

    // Act
    const { status, data } = await apiRequest('POST', '/api/orders', invalidPayload);

    // Assert
    expect(status).toBe(400);
    expect(data).toHaveProperty('success', false);
    expect(data).toHaveProperty('error');

    console.log('✅ Correctly returned 400 for invalid request');
  });

  it('should return 409 for insufficient stock', async () => {
    // Arrange - Get current stock
    const product = await testPrisma.product.findUnique({
      where: { id: testProductId },
    });

    // Request more than available
    const orderPayload = {
      productId: testProductId,
      quantity: product!.quantity + 100,
      customer: TEST_ORDER.customer,
    };

    // Act
    const { status, data } = await apiRequest('POST', '/api/orders', orderPayload);

    // Assert
    expect(status).toBe(409);
    expect(data).toHaveProperty('success', false);

    console.log('✅ Correctly returned 409 for insufficient stock');
  });
});

