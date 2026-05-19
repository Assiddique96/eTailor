export type Invoice = {
  id: string;
  invoiceNumber: string;
  subtotal: string;
  discount: string;
  tax: string;
  total: string;
  paymentStatus: string;
  issuedAt: string;
  customer: { firstName: string; lastName: string };
  payments: Array<{ id: string; amount: string; method: string; paidAt: string }>;
  lines?: Array<{ id: string; description: string; quantity: number; unitPrice: number; amount: number }>;
};

export type Customer = { id: string; firstName: string; lastName: string };

export const PAYMENT_METHODS = [
  "Cash", "Bank Transfer", "Card", "Mobile Money", "Cheque", "Other",
] as const;
