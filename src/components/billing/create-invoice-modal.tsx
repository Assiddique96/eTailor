"use client";
import { useState } from "react";
import { useToast } from "@/components/ui/toast";
import { Modal } from "@/components/ui/modal";
import { formatCurrency } from "@/lib/currency";
import type { Customer } from "./billing-types";

type LineItem = { description: string; quantity: string; unitPrice: string };

type Props = {
  open: boolean;
  onClose: () => void;
  customers: Customer[];
  onCreated: () => void;
};

const EMPTY_LINE: LineItem = { description: "", quantity: "1", unitPrice: "" };

export function CreateInvoiceModal({ open, onClose, customers, onCreated }: Props) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [jobId,      setJobId]      = useState("");
  const [discount,   setDiscount]   = useState("0");
  const [tax,        setTax]        = useState("0");
  const [dueAt,      setDueAt]      = useState("");
  const [lines, setLines]           = useState<LineItem[]>([{ ...EMPTY_LINE }]);
  const [errors, setErrors]         = useState<Record<string, string>>({});

  function updateLine(i: number, field: keyof LineItem, value: string) {
    setLines((prev) => prev.map((l, idx) => idx === i ? { ...l, [field]: value } : l));
  }

  function addLine()     { setLines((l) => [...l, { ...EMPTY_LINE }]); }
  function removeLine(i: number) {
    if (lines.length === 1) return;
    setLines((l) => l.filter((_, idx) => idx !== i));
  }

  const subtotal = lines.reduce((s, l) => s + (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0), 0);
  const total    = Math.max(0, subtotal - Number(discount)) + Number(tax);

  function validate() {
    const e: Record<string, string> = {};
    if (!customerId) e.customerId = "Customer is required.";
    const validLines = lines.filter((l) => l.description.trim() && Number(l.unitPrice) > 0);
    if (validLines.length === 0) e.lines = "Add at least one line item with a description and price.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const validLines = lines
        .filter((l) => l.description.trim() && Number(l.unitPrice) > 0)
        .map((l) => ({
          description: l.description.trim(),
          quantity:    Number(l.quantity) || 1,
          unitPrice:   Number(l.unitPrice),
        }));

      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          jobId:    jobId || undefined,
          lines:    validLines,
          discount: Number(discount) || 0,
          tax:      Number(tax)      || 0,
          dueAt:    dueAt            || undefined,
        }),
      });
      if (!res.ok) { const err = await res.json(); toast(err.error ?? "Failed.", "error"); return; }
      toast("Invoice created.");
      // Reset
      setCustomerId(""); setJobId(""); setDiscount("0"); setTax("0"); setDueAt("");
      setLines([{ ...EMPTY_LINE }]); setErrors({});
      onCreated(); onClose();
    } catch { toast("Network error.", "error"); }
    finally { setSubmitting(false); }
  }

  function close() { if (!submitting) onClose(); }

  return (
    <Modal
      open={open}
      onClose={close}
      title="New invoice"
      footer={
        <>
          <button className="btn btn-ghost btn-sm" onClick={close} disabled={submitting}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Creating…" : "Create invoice"}
          </button>
        </>
      }
    >
      <div className="space-y-4" style={{ maxHeight: "70vh", overflowY: "auto", paddingRight: 4 }}>
        {/* Customer + Due date */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-secondary">Customer *</label>
            <select className="field" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
              <option value="">Select customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
              ))}
            </select>
            {errors.customerId && <p className="text-xs text-danger">{errors.customerId}</p>}
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-secondary">Due date</label>
            <input type="date" className="field" value={dueAt}
              onChange={(e) => setDueAt(e.target.value ? new Date(e.target.value).toISOString() : "")} />
          </div>
        </div>

        {/* Line items */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-secondary">Line items *</label>
            <button className="text-xs text-brand hover:underline" onClick={addLine}>+ Add line</button>
          </div>

          {/* Header row */}
          <div className="grid gap-1 mb-1" style={{ gridTemplateColumns: "1fr 60px 90px 28px" }}>
            <p className="text-xs text-muted">Description</p>
            <p className="text-xs text-muted text-center">Qty</p>
            <p className="text-xs text-muted text-right">Unit price (₦)</p>
            <span />
          </div>

          <div className="space-y-1.5">
            {lines.map((line, i) => (
              <div key={i} className="grid gap-1 items-center" style={{ gridTemplateColumns: "1fr 60px 90px 28px" }}>
                <input
                  className="field text-sm"
                  placeholder="e.g. Suit tailoring labour"
                  value={line.description}
                  onChange={(e) => updateLine(i, "description", e.target.value)}
                />
                <input
                  type="number" min="0.01" step="0.01"
                  className="field text-sm text-center"
                  value={line.quantity}
                  onChange={(e) => updateLine(i, "quantity", e.target.value)}
                />
                <input
                  type="number" min="0" step="0.01"
                  className="field text-sm text-right"
                  placeholder="0.00"
                  value={line.unitPrice}
                  onChange={(e) => updateLine(i, "unitPrice", e.target.value)}
                />
                <button
                  onClick={() => removeLine(i)}
                  disabled={lines.length === 1}
                  className="flex items-center justify-center rounded p-1 text-muted hover:text-danger transition-colors disabled:opacity-30"
                  aria-label={`Remove line ${i + 1}`}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
          {errors.lines && <p className="text-xs text-danger mt-1">{errors.lines}</p>}
        </div>

        {/* Subtotal preview */}
        <div
          className="rounded-lg px-3 py-2 text-sm"
          style={{ background: "var(--bg-base)", border: "1px solid var(--border)" }}
        >
          <div className="flex justify-between text-muted">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
        </div>

        {/* Discount + Tax */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-secondary">Discount (₦)</label>
            <input type="number" step="0.01" min="0" className="field"
              value={discount} onChange={(e) => setDiscount(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-secondary">Tax (₦)</label>
            <input type="number" step="0.01" min="0" className="field"
              value={tax} onChange={(e) => setTax(e.target.value)} />
          </div>
        </div>

        {/* Total */}
        <div
          className="flex items-center justify-between rounded-lg px-3 py-3"
          style={{ background: "var(--brand-light)", border: "1px solid var(--border)" }}
        >
          <span className="font-semibold text-sm" style={{ color: "var(--brand)" }}>Total</span>
          <span className="font-bold text-lg" style={{ color: "var(--brand)" }}>
            {formatCurrency(total)}
          </span>
        </div>
      </div>
    </Modal>
  );
}
