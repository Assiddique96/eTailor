"use client";
import { FormEvent, useEffect, useState, useRef } from "react";
import { TableSkeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";

type Invoice = {
  id: string; invoiceNumber: string; subtotal: string; discount: string;
  tax: string; total: string; paymentStatus: string; issuedAt: string;
  customer: { firstName: string; lastName: string };
  payments: Array<{ id: string; amount: string; method: string; paidAt: string }>;
};
type Customer = { id: string; firstName: string; lastName: string };

const PAYMENT_CLASS: Record<string, string> = {
  PAID: "badge badge-paid", PARTIAL: "badge badge-partial",
  UNPAID: "badge badge-unpaid", REFUNDED: "badge badge-refunded",
};

export default function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const invFormRef = useRef<HTMLFormElement>(null);
  const payFormRef = useRef<HTMLFormElement>(null);
  const { toast } = useToast();

  async function load() {
    const [ir, cr] = await Promise.all([fetch("/api/invoices"), fetch("/api/customers")]);
    const id = await ir.json(); const cd = await cr.json();
    setInvoices(id.invoices ?? []); setCustomers(cd.customers ?? []);
  }

  useEffect(() => { load().finally(() => setLoading(false)); }, []);

  async function onCreateInvoice(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const subtotal = Number(fd.get("subtotal") || 0);
    const discount = Number(fd.get("discount") || 0);
    const tax = Number(fd.get("tax") || 0);
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: fd.get("customerId"), subtotal, discount, tax }),
      });
      if (!res.ok) { const err = await res.json(); toast(err.error || "Failed.", "error"); return; }
      toast("Invoice created.");
      invFormRef.current?.reset();
      setShowInvoiceForm(false);
      await load();
    } catch { toast("Network error.", "error"); }
    finally { setSubmitting(false); }
  }

  async function onRecordPayment(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedInvoice) return;
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: selectedInvoice.id,
          amount: Number(fd.get("amount")),
          method: fd.get("method"),
          reference: fd.get("reference"),
        }),
      });
      if (!res.ok) { const err = await res.json(); toast(err.error || "Failed.", "error"); return; }
      toast("Payment recorded.");
      payFormRef.current?.reset();
      setShowPaymentForm(false);
      setSelectedInvoice(null);
      await load();
    } catch { toast("Network error.", "error"); }
    finally { setSubmitting(false); }
  }

  const totalRevenue = invoices.reduce((sum, i) => sum + Number(i.total), 0);
  const paidCount = invoices.filter((i) => i.paymentStatus === "PAID").length;
  const unpaidAmount = invoices
    .filter((i) => i.paymentStatus !== "PAID")
    .reduce((sum, i) => sum + Number(i.total), 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
          <p className="text-sm text-secondary mt-0.5">{invoices.length} invoices</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-ghost btn-sm" onClick={() => setShowPaymentForm((v) => !v)} disabled={!selectedInvoice}>
            Record payment
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowInvoiceForm((v) => !v)}>
            + New invoice
          </button>
        </div>
      </div>

      {/* Stats */}
      {!loading && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total invoiced", value: `$${totalRevenue.toLocaleString("en", { minimumFractionDigits: 2 })}` },
            { label: "Paid", value: `${paidCount} of ${invoices.length}` },
            { label: "Outstanding", value: `$${unpaidAmount.toLocaleString("en", { minimumFractionDigits: 2 })}`, warn: unpaidAmount > 0 },
          ].map((s) => (
            <div key={s.label} className="card p-4">
              <p className="text-xs text-muted mb-1">{s.label}</p>
              <p className={`text-xl font-semibold ${s.warn ? "" : ""}`} style={{ color: s.warn ? "var(--warning)" : undefined }}>
                {s.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Invoice form */}
      {showInvoiceForm && (
        <div className="card p-5">
          <h2 className="font-medium mb-4">New invoice</h2>
          <form ref={invFormRef} onSubmit={onCreateInvoice} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-secondary">Customer *</label>
              <select name="customerId" required className="field">
                <option value="">Select customer</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-secondary">Subtotal ($) *</label>
              <input name="subtotal" type="number" step="0.01" min="0" required className="field" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-secondary">Discount ($)</label>
              <input name="discount" type="number" step="0.01" min="0" defaultValue="0" className="field" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-secondary">Tax ($)</label>
              <input name="tax" type="number" step="0.01" min="0" defaultValue="0" className="field" />
            </div>
            <div className="sm:col-span-2 flex gap-2 justify-end pt-1">
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowInvoiceForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
                {submitting ? "Creating…" : "Create invoice"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Payment form */}
      {showPaymentForm && selectedInvoice && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-medium">Record payment — {selectedInvoice.invoiceNumber}</h2>
            <button className="btn btn-ghost btn-sm" onClick={() => { setShowPaymentForm(false); setSelectedInvoice(null); }}>✕</button>
          </div>
          <p className="text-sm text-secondary mb-4">
            Total: <strong>${Number(selectedInvoice.total).toFixed(2)}</strong> |
            Status: <span className={`ml-1 ${PAYMENT_CLASS[selectedInvoice.paymentStatus] ?? "badge"}`}>{selectedInvoice.paymentStatus}</span>
          </p>
          <form ref={payFormRef} onSubmit={onRecordPayment} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-secondary">Amount ($) *</label>
              <input name="amount" type="number" step="0.01" min="0.01" required className="field" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-secondary">Payment method *</label>
              <select name="method" required className="field">
                <option value="">Select method</option>
                {["Cash","Bank Transfer","Card","Mobile Money","Cheque","Other"].map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-medium text-secondary">Reference / notes</label>
              <input name="reference" className="field" />
            </div>
            <div className="sm:col-span-2 flex gap-2 justify-end pt-1">
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setShowPaymentForm(false); setSelectedInvoice(null); }}>Cancel</button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
                {submitting ? "Recording…" : "Record payment"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Invoice table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-4"><TableSkeleton /></div>
        ) : invoices.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-4xl mb-3">💳</p>
            <p className="font-medium">No invoices yet</p>
            <p className="text-sm text-secondary mt-1">Create your first invoice above.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>Invoice</th><th>Customer</th><th>Total</th><th>Status</th><th>Issued</th><th></th></tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td className="font-mono font-medium text-sm">{inv.invoiceNumber}</td>
                  <td className="text-secondary">{inv.customer.firstName} {inv.customer.lastName}</td>
                  <td className="font-medium">${Number(inv.total).toFixed(2)}</td>
                  <td><span className={PAYMENT_CLASS[inv.paymentStatus] ?? "badge"}>{inv.paymentStatus}</span></td>
                  <td className="text-muted text-xs">{new Date(inv.issuedAt).toLocaleDateString()}</td>
                  <td>
                    <div className="flex gap-1">
                      {inv.paymentStatus !== "PAID" && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => { setSelectedInvoice(inv); setShowPaymentForm(true); setShowInvoiceForm(false); }}
                        >
                          Pay
                        </button>
                      )}
                      <a href={`/api/invoices/${inv.id}/pdf`} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">PDF</a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
