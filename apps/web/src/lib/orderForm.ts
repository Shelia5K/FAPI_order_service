import type { ProductDTO } from '@fapi/shared';

export const PHONE_PREFIX = '+420';
export const PHONE_LENGTH = 9;

export interface OrderFormData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddressLine1: string;
  customerAddressLine2: string;
  customerCity: string;
  customerCountry: string;
  customerZipCode: string;
  quantity: number;
}

export interface OrderFormErrors {
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddressLine1?: string;
  customerCity?: string;
  customerCountry?: string;
  customerZipCode?: string;
  quantity?: string;
  product?: string;
}

export const INITIAL_FORM_DATA: OrderFormData = {
  customerName: '',
  customerEmail: '',
  customerPhone: '',
  customerAddressLine1: '',
  customerAddressLine2: '',
  customerCity: '',
  customerCountry: 'Česká republika',
  customerZipCode: '',
  quantity: 1,
};

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePhone(phone: string): boolean {
  return /^\d{9}$/.test(phone);
}

export function validateOrderForm(
  data: OrderFormData,
  selectedProduct: ProductDTO | null
): OrderFormErrors {
  const errors: OrderFormErrors = {};

  if (!selectedProduct) {
    errors.product = 'Vyberte produkt';
  }

  if (!data.customerName.trim()) {
    errors.customerName = 'Jméno je povinné';
  }

  if (!data.customerEmail.trim()) {
    errors.customerEmail = 'Email je povinný';
  } else if (!validateEmail(data.customerEmail)) {
    errors.customerEmail = 'Neplatný formát emailu';
  }

  if (!data.customerPhone.trim()) {
    errors.customerPhone = 'Telefon je povinný';
  } else if (!validatePhone(data.customerPhone)) {
    errors.customerPhone = `Zadejte ${PHONE_LENGTH} číslic`;
  }

  if (!data.customerAddressLine1.trim()) {
    errors.customerAddressLine1 = 'Adresa je povinná';
  }

  if (!data.customerCity.trim()) {
    errors.customerCity = 'Město je povinné';
  }

  if (!data.customerCountry.trim()) {
    errors.customerCountry = 'Země je povinná';
  }

  if (!data.customerZipCode.trim()) {
    errors.customerZipCode = 'PSČ je povinné';
  }

  if (data.quantity < 1) {
    errors.quantity = 'Množství musí být alespoň 1';
  }

  return errors;
}

