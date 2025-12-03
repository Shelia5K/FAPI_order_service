'use client';

/**
 * Thank You Page
 *
 * Displayed after successful order submission.
 * Uses the /orders/:id/summary endpoint which provides:
 * - Order details with product title
 * - CZK price breakdown (subtotal, VAT, total)
 * - Currency conversions (if CNB API available)
 * - fxAvailable flag for graceful degradation
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';

import { API_URL } from '../../../lib/config';
import { CurrencyTable } from './components/CurrencyTable';
import styles from './page.module.css';

// =============================================================================
// Types (matching backend /orders/:id/summary response)
// =============================================================================

interface CurrencyConversion {
  code: string;
  amount: number | null;
  formatted: string;
  rate?: number; // Exchange rate from CNB
}

interface OrderSummary {
  order: {
    id: number;
    createdAt: string;
    productId: number;
    productTitle: string;
    quantity: number;
    customerName: string;
    customerEmail: string;
  };
  totals: {
    czk: {
      subtotalCzk: number;
      vatAmountCzk: number;
      vatRate: number;
      totalCzk: number;
      formatted: {
        subtotal: string;
        vatAmount: string;
        total: string;
      };
    };
    fx: {
      available: boolean;
      error?: string;
      conversions: CurrencyConversion[];
    };
  };
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { message: string };
}

// =============================================================================
// Constants
// =============================================================================

// =============================================================================
// Main Page Component
// =============================================================================

export default function ThankYouPage({
  params,
}: {
  params: { orderId: string };
}) {
  const [summary, setSummary] = useState<OrderSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch order summary on mount
  useEffect(() => {
    async function fetchOrderSummary() {
      try {
        setIsLoading(true);
        setError(null);

        // Use the /summary endpoint for better FX handling
        const response = await fetch(
          `${API_URL}/api/orders/${params.orderId}/summary`
        );
        const data: ApiResponse<OrderSummary> = await response.json();

        if (data.success && data.data) {
          setSummary(data.data);
        } else {
          setError(data.error?.message || 'Nepodařilo se načíst objednávku');
        }
      } catch (err) {
        console.error('Failed to fetch order summary:', err);
        setError('Nepodařilo se připojit k serveru');
      } finally {
        setIsLoading(false);
      }
    }

    fetchOrderSummary();
  }, [params.orderId]);

  // Format VAT rate for display
  const formatVatRate = (rate: number): string => {
    return `${Math.round(rate * 100)} %`;
  };

  // Format date for display
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('cs-CZ', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  // ==========================================================================
  // Loading State
  // ==========================================================================
  if (isLoading) {
    return (
      <main className={styles.main}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Načítám objednávku...</p>
        </div>
      </main>
    );
  }

  // ==========================================================================
  // Error State
  // ==========================================================================
  if (error || !summary) {
    return (
      <main className={styles.main}>
        <div className={styles.errorContainer}>
          <h1>😕 Něco se pokazilo</h1>
          <p>{error || 'Objednávka nenalezena'}</p>
          <Link href="/" className={styles.homeLink}>
            ← Zpět na hlavní stránku
          </Link>
        </div>
      </main>
    );
  }

  // Destructure for easier access
  const { order, totals } = summary;

  // ==========================================================================
  // Success State
  // ==========================================================================
  return (
    <main className={styles.main}>
      <div className={styles.container}>
        {/* Success Header */}
        <div className={styles.successHeader}>
          <div className={styles.checkmark}>✓</div>
          <h1>Děkujeme za objednávku!</h1>
          <p>Vaše objednávka byla úspěšně přijata</p>
          <p className={styles.orderId}>Číslo objednávky: #{order.id}</p>
          <p className={styles.orderDate}>{formatDate(order.createdAt)}</p>
        </div>

        {/* Order Summary Card */}
        <div className={styles.card}>
          <h2>Souhrn objednávky</h2>

          {/* Product & Customer */}
          <div className={styles.section}>
            <h3>Objednané položky</h3>
            <div className={styles.orderDetails}>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Produkt:</span>
                <span className={styles.detailValue}>{order.productTitle}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Množství:</span>
                <span className={styles.detailValue}>{order.quantity} ks</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Zákazník:</span>
                <span className={styles.detailValue}>{order.customerName}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Email:</span>
                <span className={styles.detailValue}>{order.customerEmail}</span>
              </div>
            </div>
          </div>

          {/* CZK Price Breakdown */}
          <div className={styles.section}>
            <h3>Cenový přehled (CZK)</h3>
            <div className={styles.priceBreakdown}>
              <div className={styles.priceRow}>
                <span>Mezisoučet (bez DPH):</span>
                <span>{totals.czk.formatted.subtotal}</span>
              </div>
              <div className={styles.priceRow}>
                <span>DPH ({formatVatRate(totals.czk.vatRate)}):</span>
                <span>{totals.czk.formatted.vatAmount}</span>
              </div>
              <div className={`${styles.priceRow} ${styles.priceTotal}`}>
                <span>Celkem s DPH:</span>
                <span>{totals.czk.formatted.total}</span>
              </div>
            </div>
          </div>

          {/* Currency Conversions */}
          <div className={styles.section}>
            <h3>Celková cena v jiných měnách</h3>

            {totals.fx.available ? (
              <>
                <p className={styles.conversionNote}>
                  Kurzy dle České národní banky (CNB)
                </p>
                <CurrencyTable
                  conversions={totals.fx.conversions}
                  totalCzk={totals.czk.totalCzk}
                />
              </>
            ) : (
              <div className={styles.fxUnavailable}>
                <p>
                  ⚠️ Přepočet měn je momentálně nedostupný; ceny jsou uvedeny
                  pouze v CZK.
                </p>
                {totals.fx.error && (
                  <p className={styles.fxErrorDetail}>
                    Důvod: {totals.fx.error}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className={styles.actions}>
          <Link href="/" className={styles.newOrderButton}>
            Vytvořit novou objednávku
          </Link>
        </div>

        {/* Print / Save hint */}
        <p className={styles.printHint}>
          💡 Tip: Tuto stránku si můžete uložit nebo vytisknout jako potvrzení
          objednávky.
        </p>
      </div>
    </main>
  );
}
