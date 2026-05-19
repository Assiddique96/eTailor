/**
 * Currency formatting utility.
 * All monetary values in eTailor are stored as Decimal in the DB.
 * This module formats them for display using the shop's configured currency.
 *
 * Default currency: NGN (Nigerian Naira ₦)
 * Shops can change this in Settings.
 */

const CURRENCY_SYMBOLS: Record<string, string> = {
  NGN: "₦",
  USD: "$",
  GBP: "£",
  EUR: "€",
  GHS: "₵",
  KES: "KSh",
  ZAR: "R",
  AED: "د.إ",
};

export function formatCurrency(
  amount: number | string | null | undefined,
  currency = "NGN",
  locale   = "en-NG"
): string {
  const n = Number(amount ?? 0);
  try {
    return new Intl.NumberFormat(locale, {
      style:                 "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    // Fallback for unsupported locale/currency combos
    const symbol = CURRENCY_SYMBOLS[currency] ?? currency;
    return `${symbol}${n.toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}

/** Short symbol only, e.g. "₦" */
export function currencySymbol(currency = "NGN"): string {
  return CURRENCY_SYMBOLS[currency] ?? currency;
}

export const SUPPORTED_CURRENCIES = [
  { code: "NGN", label: "Nigerian Naira (₦)" },
  { code: "USD", label: "US Dollar ($)" },
  { code: "GBP", label: "British Pound (£)" },
  { code: "EUR", label: "Euro (€)" },
  { code: "GHS", label: "Ghanaian Cedi (₵)" },
  { code: "KES", label: "Kenyan Shilling (KSh)" },
  { code: "ZAR", label: "South African Rand (R)" },
  { code: "AED", label: "UAE Dirham (د.إ)" },
] as const;
