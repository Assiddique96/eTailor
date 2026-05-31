"use client";
import { useState, useEffect, type ChangeEvent } from "react";
import { useToast } from "@/components/ui/toast";
import { Modal } from "@/components/ui/modal";
import type { Customer, JobStyleProfile } from "./job-types";
import { StylePanel } from "@/components/customers/style-panel";

type Props = {
  open: boolean;
  onClose: () => void;
  customers: Customer[];
  onCreated: () => void;
  defaultCustomerId?: string;
  defaultTitle?: string;
  defaultDueDate?: string;
};

export function CreateJobModal({ open, onClose, customers, onCreated, defaultCustomerId, defaultTitle, defaultDueDate }: Props) {
  const { toast } = useToast();
  const [styleProfile, setStyleProfile] = useState<JobStyleProfile | null>(null);
  const [materials, setMaterials] = useState<Array<{ name: string; colour?: string; quantityMetres?: string; unitCost?: string; supplier?: string; notes?: string }>>([]);
  const [submitting, setSubmitting] = useState(false);
  const [fields, setFields] = useState({
    customerId: defaultCustomerId ?? "", title: "", description: "", dueDate: "", priority: "3",
    depositAmount: "", depositPaid: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!fields.customerId) e.customerId = "Customer is required.";
    if (!fields.title.trim()) e.title = "Title is required.";
    if (!fields.dueDate) e.dueDate = "Due date is required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  useEffect(() => {
    if (open) {
      setFields({
        customerId: defaultCustomerId ?? "",
        title: defaultTitle ?? "",
        description: "",
        dueDate: defaultDueDate ?? new Date().toISOString().slice(0, 10),
        priority: "3",
        depositAmount: "",
        depositPaid: false,
      });
      setMaterials([]);
      setErrors({});
      setStyleProfile(null);
    }
  }, [open, defaultCustomerId, defaultTitle, defaultDueDate]);

  async function handleSubmit() {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId:    fields.customerId,
          title:         fields.title,
          description:   fields.description || undefined,
          dueDate:       fields.dueDate,
          priority:      Number(fields.priority),
          depositAmount: fields.depositAmount ? Number(fields.depositAmount) : undefined,
          depositPaid:   fields.depositPaid,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast(err.error ?? "Failed to create job.", "error");
        return;
      }
      const payload = await res.json();
      const job = payload.job;
      toast("Job created.");
      // Persist selected style profile for the new job
      if (materials.length > 0 && job?.id) {
        for (const m of materials) {
          await fetch(`/api/jobs/${job.id}/materials`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: m.name,
              colour: m.colour || undefined,
              quantityMetres: m.quantityMetres ? Number(m.quantityMetres) : undefined,
              unitCost: m.unitCost ? Number(m.unitCost) : undefined,
              supplier: m.supplier || undefined,
              notes: m.notes || undefined,
            }),
          });
        }
      }
      if (styleProfile?.selectionMode) {
        await fetch(`/api/jobs/${job.id}/style`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(styleProfile),
        });
      }
      setFields({ customerId: "", title: "", description: "", dueDate: "", priority: "3", depositAmount: "", depositPaid: false });
      setErrors({});
      onCreated();
      onClose();
    } catch {
      toast("Network error.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  function field(name: Exclude<keyof typeof fields, "depositPaid">) {
    return {
      value: fields[name] as string,
      onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
        setFields((f) => ({ ...f, [name]: e.target.value })),
    };
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create job"
      footer={
        <>
          <button className="btn btn-ghost btn-sm" onClick={onClose} disabled={submitting}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Creating…" : "Create job"}
          </button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 max-h-[65vh] overflow-y-auto pb-4">
        <div className="space-y-1">
          <label className="text-xs font-medium text-secondary">Customer *</label>
          <select className="field" {...field("customerId")}>
            <option value="">Select customer</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
            ))}
          </select>
          {errors.customerId && <p className="text-xs text-danger">{errors.customerId}</p>}
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-secondary">Job title *</label>
          <input className="field" placeholder="e.g. Wedding suit alterations" {...field("title")} />
          {errors.title && <p className="text-xs text-danger">{errors.title}</p>}
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-secondary">Due date *</label>
          <input type="date" className="field" {...field("dueDate")} />
          {errors.dueDate && <p className="text-xs text-danger">{errors.dueDate}</p>}
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-secondary">Priority</label>
          <select className="field" {...field("priority")}>
            <option value="1">🔴 Urgent</option>
            <option value="2">🟠 High</option>
            <option value="3">Normal</option>
            <option value="4">🟢 Low</option>
            <option value="5">⚪ Minimal</option>
          </select>
        </div>

        <div className="space-y-1 sm:col-span-2">
          <label className="text-xs font-medium text-secondary">Description</label>
          <textarea
            className="field min-h-24 resize-none"
            placeholder="Additional details…"
            {...field("description")}
          />
        </div>

        {/* Style selection is available for every new job */}
        <div className="sm:col-span-2 space-y-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-900">Style preference</p>
            <p className="text-xs text-secondary mt-1">
              Every new job starts clean and can include a style preference. Pick a catalog item, upload an inspiration image, or select “Impress me”.
            </p>
            {!fields.customerId && (
              <p className="text-xs text-muted mt-2">
                You can still choose a style before selecting a customer; it will be saved to the new job.
              </p>
            )}
          </div>

          <StylePanel
            customerId={fields.customerId || ''}
            shopId={''}
          />

          {/* Initial materials (saved after job is created) */}
          <div className="card p-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-secondary">Initial materials</h3>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setMaterials((s) => [...s, { name: "", colour: "", quantityMetres: "", unitCost: "", supplier: "", notes: "" }])}
              >+ Add</button>
            </div>

            <div className="space-y-2 mt-3">
              {materials.map((m, idx) => (
                <div key={idx} className="grid grid-cols-2 gap-2">
                  <input className="field" placeholder="Name" value={m.name}
                    onChange={(e) => setMaterials((s) => s.map((it, i) => i === idx ? { ...it, name: e.target.value } : it))} />
                  <input className="field" placeholder="Colour" value={m.colour}
                    onChange={(e) => setMaterials((s) => s.map((it, i) => i === idx ? { ...it, colour: e.target.value } : it))} />
                  <input className="field" placeholder="Quantity (m)" value={m.quantityMetres}
                    onChange={(e) => setMaterials((s) => s.map((it, i) => i === idx ? { ...it, quantityMetres: e.target.value } : it))} />
                  <input className="field" placeholder="Unit cost" value={m.unitCost}
                    onChange={(e) => setMaterials((s) => s.map((it, i) => i === idx ? { ...it, unitCost: e.target.value } : it))} />
                  <input className="field" placeholder="Supplier" value={m.supplier}
                    onChange={(e) => setMaterials((s) => s.map((it, i) => i === idx ? { ...it, supplier: e.target.value } : it))} />
                  <input className="field" placeholder="Notes" value={m.notes}
                    onChange={(e) => setMaterials((s) => s.map((it, i) => i === idx ? { ...it, notes: e.target.value } : it))} />
                </div>
              ))}
              {materials.length === 0 && <p className="text-xs text-muted">No initial materials — you can add materials from the job details later.</p>}
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-secondary">Deposit amount (₦)</label>
          <input
            type="number" step="0.01" min="0"
            className="field"
            placeholder="0.00"
            value={fields.depositAmount}
            onChange={(e) => setFields((f) => ({ ...f, depositAmount: e.target.value }))}
          />
        </div>

        <div className="space-y-1 flex items-center gap-2 pt-4">
          <input
            type="checkbox"
            id="depositPaid"
            checked={fields.depositPaid}
            onChange={(e) => setFields((f) => ({ ...f, depositPaid: e.target.checked }))}
            className="rounded accent-indigo-600"
          />
          <label htmlFor="depositPaid" className="text-sm cursor-pointer">
            Deposit already collected
          </label>
        </div>
      </div>
    </Modal>
  );
}

