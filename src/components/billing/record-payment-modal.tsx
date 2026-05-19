"use client";
import { useState } from "react";
import { useToast } from "@/components/ui/toast";
import { Modal } from "@/components/ui/modal";
import { StatusBadge } from "@/components/ui/badge";
import { PAYMENT_METHODS, type Invoice } from "./billing-types";

type Props = {
  invoice: Invoice | null;
  onClose: () => void;
  onRecorded: () => void;
};

export function RecordPaymentModal({ invoice, onClose, onRecorded }: Props) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [fields, setFields] = useState({ amount: "", method: "", reference: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!fields.amount || Number(fields.amount) <= 0) e.amount = "Valid amount required.";
    if (!fields.method) e.method = "Payment method is required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!invoice || !validate()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: invoice.id,
          amount: Number(fields.amount),
          method: fields.method,
          reference: fields.reference || undefined,
        }),
      });
      if (!res.ok) { const err = await res.json(); toast(err.error ?? "Failed.", "error"); return; }
      toast("Payment recorded.");
      setFields({ amount: "", method: "", reference: "" });
      setErrors({});
      onRecorded();
      onClose();
    } catch { toast("Network error.", "error"); }
    finally { setSubmitting(false); }
  }

  function field(name: keyof typeof fields) {
    return {
      value: fields[name],
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setFields((f) => ({ ...f, [name]: e.target.value })),
    };
  }

  return (
    <Modal
      open={!!invoice}
      onClose={onClose}
      title={`Record payment — ${invoice?.invoiceNumber ?? ""}`}
      footer={
        <>
          <button className="btn btn-ghost btn-sm" onClick={onClose} disabled={submitting}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Recording…" : "Record payment"}
          </button>
        </>
      }
    >
      {invoice && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg text-sm" style={{ background: "var(--bg-base)" }}>
            <span className="text-muted">Total:</span>
            <strong>₦{Number(invoice.total).toFixed(2)}</strong>
            <span className="text-muted">·</span>
            <StatusBadge status={invoice.paymentStatus} />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-secondary">Amount (₦) *</label>
              <input type="number" step="0.01" min="0.01" className="field" placeholder="0.00" {...field("amount")} />
              {errors.amount && <p className="text-xs text-danger">{errors.amount}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-secondary">Method *</label>
              <select className="field" {...field("method")}>
                <option value="">Select method</option>
                {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
              {errors.method && <p className="text-xs text-danger">{errors.method}</p>}
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-medium text-secondary">Reference / notes</label>
              <input className="field" placeholder="Optional" {...field("reference")} />
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
