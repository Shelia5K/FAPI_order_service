'use client';

import styles from '../page.module.css';

interface CurrencyConversion {
  code: string;
  amount: number | null;
  formatted: string;
}

interface CurrencyTableProps {
  conversions: CurrencyConversion[];
  totalCzk: number;
}

export function CurrencyTable({ conversions, totalCzk }: CurrencyTableProps) {
  return (
    <table className={styles.currencyTable}>
      <thead>
        <tr>
          <th>Měna</th>
          <th>Kurz</th>
          <th>Celkem</th>
        </tr>
      </thead>
      <tbody>
        {conversions.map((conv) => {
          const exchangeRate =
            conv.amount !== null && conv.amount > 0
              ? (totalCzk / conv.amount).toFixed(3)
              : 'N/A';

          return (
            <tr key={conv.code}>
              <td className={styles.currencyCode}>{conv.code}</td>
              <td className={styles.exchangeRate}>
                {exchangeRate !== 'N/A'
                  ? `${Number(exchangeRate).toFixed(2)} CZK`
                  : 'N/A'}
              </td>
              <td className={styles.currencyAmount}>
                {conv.amount !== null ? conv.formatted : 'N/A'}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

