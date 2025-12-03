'use client';

import { formatPriceCZK, formatVatRate } from '@fapi/shared';
import type { VatBreakdown } from '@fapi/shared';
import styles from '../page.module.css';

interface PriceSummaryProps {
  breakdown: VatBreakdown;
}

export function PriceSummary({ breakdown }: PriceSummaryProps) {
  return (
    <div className={styles.priceSummary}>
      <h3>Cenový přehled</h3>
      <div className={styles.priceRow}>
        <span>Mezisoučet (bez DPH):</span>
        <span>{formatPriceCZK(breakdown.subtotalCzk)}</span>
      </div>
      <div className={styles.priceRow}>
        <span>DPH ({formatVatRate(breakdown.vatRate)}):</span>
        <span>{formatPriceCZK(breakdown.vatAmountCzk)}</span>
      </div>
      <div className={`${styles.priceRow} ${styles.priceTotal}`}>
        <span>Celkem s DPH:</span>
        <span>{formatPriceCZK(breakdown.totalCzk)}</span>
      </div>
    </div>
  );
}

