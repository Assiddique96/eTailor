"use client";
import { useState } from "react";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency } from "@/lib/currency";
import type { Invoice } from "./billing-types";

type Props = {
  invoices: Invoice[];
  onRecordPayment: (invoice: Invoice) => void;
};

export function InvoiceTable({ invoices, onRecordPayment }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (invoices.length === 0) {
    return (
      <EmptyState icon="💳" title="No invoices yet" description="Create your first invoice above." />
    );
  }

  return (
    <table className="data-table">
      <thead>
        <tr>
          <th></th>
          <th>Invoice</th>
          <th>Customer</th>
          <th>Total</th>
          <th>Status</th>
          <th>Issued</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {invoices.map((inv) => (
          <>
            <tr key={inv.id}>
              {/* Expand toggle for line items */}
              <td style={{ width: 32, paddingRight: 0 }}>
                {(inv as Invoice & { lines?: unknown[] }).lines?.length ? (
                  <button
                    onClick={() => setExpandedId(expandedId === inv.id ? null : inv.id)}
                    className="p-1 rounded text-muted hover:text-primary transition-colors"
                    aria-label={expandedId === inv.id ? "Collapse" : "Expand line items"}
                    aria-expanded={expandedId === inv.id}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2.5" aria-hidden
                      style={{ transform: expandedId === inv.id ? "rotate(90deg)" : "none", transition: "transform 0.15s" }}>
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </button>
                ) : null}
              </td>
              <td className="font-mono font-medium text-sm">{inv.invoiceNumber}</td>
              <td className="text-secondary">{inv.customer.firstName} {inv.customer.lastName}</td>
              <td className="font-medium">{formatCurrency(inv.total)}</td>
              <td><StatusBadge status={inv.paymentStatus} /></td>
              <td className="text-muted text-xs">{new Date(inv.issuedAt).toLocaleDateString()}</td>
              <td>
                <div className="flex gap-1">
                  {inv.paymentStatus !== "PAID" && (
                    <button className="btn btn-primary btn-sm" onClick={() => onRecordPayment(inv)}>
                      Pay
                    </button>
                  )}
                  <a
                    href={`/api/invoices/${inv.id}/pdf`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-ghost btn-sm"
                    aria-label={`Download PDF for ${inv.invoiceNumber}`}
                  >
                    PDF
                  </a>
                </div>
              </td>
            </tr>

            {/* Expanded line items */}
            {expandedId === inv.id && (inv as Invoice & { lines?: Array<{ id: string; description: string; quantity: number; unitPrice: number; amount: number }> }).lines?.map((line) => (
              <tr
                key={line.id}
                style={{ background: "var(--bg-base)", borderLeft: "3px solid var(--brand-light)" }}
              >
                <td />
                <td colSpan={2} className="text-sm text-secondary pl-6">
                  ↳ {line.description}
                </td>
                <td className="text-sm text-muted text-right pr-6">
                  {line.quantity} × {formatCurrency(line.unitPrice)}
                </td>
                <td className="text-sm font-medium">{formatCurrency(line.amount)}</td>
                <td colSpan={2} />
              </tr>
            ))}
          </>
        ))}
      </tbody>
    </table>
  );
}
