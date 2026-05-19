"use client";
import { useState } from "react";
import { useToast } from "@/components/ui/toast";
import { Modal } from "@/components/ui/modal";
import type { Customer } from "./job-types";

type Props = {
  open: boolean;
  onClose: () => void;
  customers: Customer[];
  onCreated: () => void;
};

export function CreateJobModal({ open, onClose, customers, onCreated }: Props) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [fields, setFields] = useState({
    customerId: "", title: "", description: "", dueDate: "", priority: "3",
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
      toast("Job created.");
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
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
          <input className="field" placeholder="Additional details…" {...field("description")} />
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
