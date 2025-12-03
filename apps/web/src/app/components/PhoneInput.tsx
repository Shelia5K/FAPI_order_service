'use client';

import { PHONE_LENGTH, PHONE_PREFIX } from '../../lib/orderForm';
import styles from '../page.module.css';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function PhoneInput({ value, onChange, error }: PhoneInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '');
    const limited = digits.slice(0, PHONE_LENGTH);
    onChange(limited);
  };

  return (
    <div className={styles.formGroup}>
      <label htmlFor="customerPhone" className={styles.label}>
        Telefon
        <span className={styles.required}>*</span>
      </label>
      <div className={styles.phoneInputWrapper}>
        <span className={styles.phonePrefix}>{PHONE_PREFIX}</span>
        <input
          id="customerPhone"
          name="customerPhone"
          type="tel"
          value={value}
          onChange={handleChange}
          className={`${styles.input} ${styles.phoneInput} ${
            error ? styles.inputError : ''
          }`}
          placeholder="123 456 789"
          maxLength={PHONE_LENGTH}
        />
      </div>
      {error && <span className={styles.errorText}>{error}</span>}
    </div>
  );
}

