'use client';

/**
 * Home Page - Order Form
*/

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { calculateVatBreakdown, DEFAULT_VAT_RATE } from '@fapi/shared';
import type { ProductDTO, VatBreakdown } from '@fapi/shared';

import { API_URL } from '../lib/config';
import {
  INITIAL_FORM_DATA,
  OrderFormData,
  OrderFormErrors,
  PHONE_PREFIX,
  validateOrderForm,
} from '../lib/orderForm';
import { FormInput } from './components/FormInput';
import { PhoneInput } from './components/PhoneInput';
import { PriceSummary } from './components/PriceSummary';
import { ProductCard } from './components/ProductCard';
import styles from './page.module.css';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { message: string };
}
// =============================================================================
// Main Page Component
// =============================================================================

export default function HomePage() {
  const router = useRouter();

  const [products, setProducts] = useState<ProductDTO[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductDTO | null>(null);
  const [formData, setFormData] = useState<OrderFormData>(INITIAL_FORM_DATA);
  const [formErrors, setFormErrors] = useState<OrderFormErrors>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`${API_URL}/api/products?includeOutOfStock=true`);
        const data: ApiResponse<ProductDTO[]> = await response.json();

        if (data.success && data.data) {
          setProducts(data.data);
        } else {
          setError(data.error?.message || 'Nepodařilo se načíst produkty');
        }
      } catch (err) {
        console.error('Failed to fetch products:', err);
        setError('Nepodařilo se připojit k serveru');
      } finally {
        setIsLoading(false);
      }
    }

    fetchProducts();
  }, []);

  // Calculate VAT breakdown when product or quantity changes
  const priceBreakdown = useMemo<VatBreakdown | null>(() => {
    if (!selectedProduct) return null;

    return calculateVatBreakdown({
      unitPriceCzk: selectedProduct.priceCzk,
      quantity: formData.quantity,
      vatRate: DEFAULT_VAT_RATE,
    });
  }, [selectedProduct, formData.quantity]);

  // Handle form field changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;

    if (name === 'quantity' && type === 'number') {
      // Validate quantity: min 1, max = product stock
      const numValue = parseInt(value) || 1;
      const maxQuantity = selectedProduct?.quantity ?? 1000;
      const clampedValue = Math.min(Math.max(1, numValue), maxQuantity);

      setFormData((prev) => ({
        ...prev,
        quantity: clampedValue,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    // Clear error for this field when user starts typing
    if (formErrors[name as keyof OrderFormErrors]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  // Handle phone change (special handler for phone with prefix)
  const handlePhoneChange = (value: string) => {
    setFormData((prev) => ({ ...prev, customerPhone: value }));
    if (formErrors.customerPhone) {
      setFormErrors((prev) => ({ ...prev, customerPhone: undefined }));
    }
  };

  // Handle product selection
  const handleProductSelect = (product: ProductDTO) => {
    if (product.quantity === 0) return; // Don't allow selecting sold out products
    setSelectedProduct(product);
    setSubmitError(null);
    // Reset quantity to 1 when selecting a different product
    setFormData((prev) => ({ ...prev, quantity: 1 }));
    // Clear product error
    if (formErrors.product) {
      setFormErrors((prev) => ({ ...prev, product: undefined }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const errors = validateOrderForm(formData, selectedProduct);
    setFormErrors(errors);

    // If there are errors, don't submit
    if (Object.keys(errors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: selectedProduct!.id,
          quantity: formData.quantity,
          customer: {
            name: formData.customerName,
            email: formData.customerEmail,
            phone: `${PHONE_PREFIX}${formData.customerPhone}`,
            addressLine1: formData.customerAddressLine1,
            addressLine2: formData.customerAddressLine2 || undefined,
            city: formData.customerCity,
            country: formData.customerCountry,
            zipCode: formData.customerZipCode,
          },
        }),
      });

      const data = await response.json();

      if (data.success && data.data) {
        // Redirect to thank you page with order ID
        router.push(`/thank-you/${data.data.id}`);
      } else {
        setSubmitError(data.error?.message || 'Nepodařilo se vytvořit objednávku');
      }
    } catch (err) {
      console.error('Failed to submit order:', err);
      setSubmitError('Nepodařilo se připojit k serveru');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================================================
  // Render
  // ==========================================================================

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <h1>FAPI Objednávkový systém</h1>
        <p>Vyberte produkt a vyplňte objednávku</p>
      </header>

      <div className={styles.container}>
        {/* Left side: Product Grid */}
        <section className={styles.productsSection}>
          <h2>Produkty</h2>

          {isLoading && (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              <p>Načítám produkty...</p>
            </div>
          )}

          {error && (
            <div className={styles.errorMessage}>
              <p>⚠️ {error}</p>
              <button
                onClick={() => window.location.reload()}
                className={styles.retryButton}
              >
                Zkusit znovu
              </button>
            </div>
          )}

          {!isLoading && !error && products.length === 0 && (
            <p className={styles.noProducts}>Žádné produkty nejsou k dispozici</p>
          )}

          {!isLoading && !error && products.length > 0 && (
            <div className={styles.productGrid}>
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isSelected={selectedProduct?.id === product.id}
                  onSelect={() => handleProductSelect(product)}
                />
              ))}
            </div>
          )}
        </section>

        {/* Right side: Order Form */}
        <section className={styles.orderSection}>
          <h2>Vaše objednávka</h2>

          {!selectedProduct ? (
            <div className={styles.noSelection}>
              <p>👈 Vyberte produkt ze seznamu vlevo</p>
              {formErrors.product && (
                <p className={styles.productError}>{formErrors.product}</p>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className={styles.orderForm}>
              {/* Selected Product Info */}
              <div className={styles.selectedProduct}>
                <h3>{selectedProduct.title}</h3>
                <p className={styles.selectedPrice}>
                  {selectedProduct.formattedPrice} / ks
                </p>
                {selectedProduct.description && (
                  <p className={styles.selectedDescription}>
                    {selectedProduct.description}
                  </p>
                )}
              </div>

              {/* Quantity */}
              <div className={styles.formGroup}>
                <label htmlFor="quantity" className={styles.label}>
                  Množství
                  <span className={styles.required}>*</span>
                </label>
                <input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min={1}
                  max={selectedProduct.quantity}
                  value={formData.quantity}
                  onChange={handleInputChange}
                  className={`${styles.input} ${formErrors.quantity ? styles.inputError : ''}`}
                />
                <span className={styles.helperText}>
                  Skladem: {selectedProduct.quantity} ks
                </span>
                {formErrors.quantity && (
                  <span className={styles.errorText}>{formErrors.quantity}</span>
                )}
              </div>

              {/* Price Summary */}
              {priceBreakdown && <PriceSummary breakdown={priceBreakdown} />}

              <hr className={styles.divider} />

              {/* Customer Information */}
              <h3 className={styles.sectionTitle}>Fakturační údaje</h3>

              <FormInput
                label="Jméno a příjmení"
                name="customerName"
                value={formData.customerName}
                onChange={handleInputChange}
                error={formErrors.customerName}
                required
                placeholder="Jan Novák"
              />

              <FormInput
                label="Email"
                name="customerEmail"
                type="email"
                value={formData.customerEmail}
                onChange={handleInputChange}
                error={formErrors.customerEmail}
                required
                placeholder="jan.novak@example.com"
              />

              <PhoneInput
                value={formData.customerPhone}
                onChange={handlePhoneChange}
                error={formErrors.customerPhone}
              />

              <h3 className={styles.sectionTitle}>Adresa</h3>

              <FormInput
                label="Ulice a číslo popisné"
                name="customerAddressLine1"
                value={formData.customerAddressLine1}
                onChange={handleInputChange}
                error={formErrors.customerAddressLine1}
                required
                placeholder="Hlavní 123"
              />

              <FormInput
                label="Doplňující adresa"
                name="customerAddressLine2"
                value={formData.customerAddressLine2}
                onChange={handleInputChange}
                placeholder="Byt 4, 2. patro (volitelné)"
              />

              <div className={styles.formRow}>
                <FormInput
                  label="Město"
                  name="customerCity"
                  value={formData.customerCity}
                  onChange={handleInputChange}
                  error={formErrors.customerCity}
                  required
                  placeholder="Praha"
                />

                <FormInput
                  label="PSČ"
                  name="customerZipCode"
                  value={formData.customerZipCode}
                  onChange={handleInputChange}
                  error={formErrors.customerZipCode}
                  required
                  placeholder="110 00"
                />
              </div>

              <FormInput
                label="Země"
                name="customerCountry"
                value={formData.customerCountry}
                onChange={handleInputChange}
                error={formErrors.customerCountry}
                required
              />

              {/* Submit Error */}
              {submitError && (
                <div className={styles.submitError}>
                  <p>❌ {submitError}</p>
                </div>
              )}

              {/* Submit Button - always clickable, shows errors on click */}
              <button
                type="submit"
                className={styles.submitButton}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Odesílám...' : 'Odeslat objednávku'}
              </button>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
