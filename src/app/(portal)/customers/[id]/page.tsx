"use client";
import { FormEvent, use, useEffect, useState } from "react";
import Link from "next/link";
import { TableSkeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";

type CustomerDetails = {
  id: string; firstName: string; lastName: string;
  phone?: string; email?: string; preferredStyle?: string; gender?: string; notes?: string;
  measurements: Array<{ id: string; recordedAt: string; chestCm?: string; waistCm?: string; hipCm?: string; shoulderCm?: string; sleeveCm?: string; waistCm2?: string; neckCm?: string; inseamCm?: string }>;
  jobs: Array<{ id: string; title: string; status: string; dueDate: string }>;
  invoices: Array<{ id: string; invoiceNumber: string; total: string; paymentStatus: string }>;
};

const STATUS_CLASS: Record<string, string> = {
  PENDING: "badge badge-pending", IN_PROGRESS: "badge badge-progress",
  READY_FOR_FITTING: "badge badge-fitting", COMPLETED: "badge badge-completed",
  DELIVERED: "badge badge-delivered", CANCELLED: "badge badge-cancelled",
};
const PAYMENT_CLASS: Record<string, string> = {
  PAID: "badge badge-paid", PARTIAL: "badge badge-partial",
  UNPAID: "badge badge-unpaid", REFUNDED: "badge badge-refunded",
};

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [customer, setCustomer] = useState<CustomerDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"measurements" | "jobs" | "invoices">("measurements");
  const { toast } = useToast();

  async function load() {
    const res = await fetch(`/api/customers/${id}`);
    const data = await res.json();
    setCustomer(data.customer ?? null);
  }

  useEffect(() => { load().finally(() => setLoading(false)); }, [id]);

  async function onAddMeasurement(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const body: Record<string, number> = {};
    for (const [k, v] of formData.entries()) {
      const n = Number(v);
      if (n > 0) body[k] = n;
    }
    try {
      const res = await fetch("/api/measurements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: id, ...body }),
      });
      if (!res.ok) { toast("Failed to save measurements.", "error"); return; }
      toast("Measurements saved.");
      (e.target as HTMLFormElement).reset();
      await load();
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="space-y-4"><TableSkeleton rows={3} /></div>;
  if (!customer) return <p className="text-secondary">Customer not found.</p>;

  const TABS = [
    { id: "measurements", label: "Measurements", count: customer.measurements.length },
    { id: "jobs",         label: "Jobs",         count: customer.jobs.length },
    { id: "invoices",     label: "Invoices",     count: customer.invoices.length },
  ] as const;

  const MEASUREMENT_FIELDS = [
    { name: "chestCm", label: "Chest" }, { name: "waistCm", label: "Waist" },
    { name: "hipCm", label: "Hip" }, { name: "shoulderCm", label: "Shoulder" },
    { name: "sleeveCm", label: "Sleeve" }, { name: "neckCm", label: "Neck" },
    { name: "inseamCm", label: "Inseam" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link href="/customers" className="text-muted hover:text-secondary text-sm">← Customers</Link>
        </div>
      </div>

      {/* Profile card */}
      <div className="card p-5">
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 rounded-2xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 flex items-center justify-center text-xl font-semibold flex-shrink-0">
            {customer.firstName[0]}{customer.lastName[0]}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold">{customer.firstName} {customer.lastName}</h1>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-sm text-secondary">
              {customer.phone && <span>📞 {customer.phone}</span>}
              {customer.email && <span>✉️ {customer.email}</span>}
              {customer.gender && <span>🪪 {customer.gender}</span>}
              {customer.preferredStyle && <span>👔 {customer.preferredStyle}</span>}
            </div>
            {customer.notes && (
              <p className="mt-2 text-sm text-muted bg-stone-50 dark:bg-stone-900 rounded-lg px-3 py-2">{customer.notes}</p>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b" style={{ borderColor: "var(--border)" }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === tab.id
                ? "border-indigo-500 text-brand"
                : "border-transparent text-secondary hover:text-primary"
            }`}
          >
            {tab.label}
            <span className="ml-1.5 text-xs rounded-full px-1.5 py-0.5" style={{ background: "var(--bg-base)", color: "var(--text-muted)" }}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {activeTab === "measurements" && (
        <div className="space-y-4">
          <div className="card p-5">
            <h2 className="font-medium mb-4 text-sm text-secondary uppercase tracking-wide">Add measurement record</h2>
            <form onSubmit={onAddMeasurement} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {MEASUREMENT_FIELDS.map((f) => (
                <div key={f.name} className="space-y-1">
                  <label className="text-xs font-medium text-secondary">{f.label} (cm)</label>
                  <input name={f.name} type="number" step="0.1" min="0" className="field" />
                </div>
              ))}
              <div className="col-span-2 sm:col-span-4 flex justify-end pt-1">
                <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
                  {submitting ? "Saving…" : "Save measurements"}
                </button>
              </div>
            </form>
          </div>

          {customer.measurements.length === 0 ? (
            <p className="text-center text-secondary py-8 text-sm">No measurements recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {customer.measurements.map((m) => (
                <div key={m.id} className="card p-4">
                  <p className="text-xs font-medium text-muted mb-2">{new Date(m.recordedAt).toLocaleString()}</p>
                  <div className="grid grid-cols-3 sm:grid-cols-7 gap-3">
                    {MEASUREMENT_FIELDS.map((f) => {
                      const val = m[f.name as keyof typeof m];
                      return (
                        <div key={f.name}>
                          <p className="text-xs text-muted">{f.label}</p>
                          <p className="font-medium text-sm">{val ? `${val}` : "—"}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "jobs" && (
        <div className="card overflow-hidden">
          {customer.jobs.length === 0 ? (
            <p className="text-center text-secondary py-10 text-sm">No jobs for this customer.</p>
          ) : (
            <table className="data-table">
              <thead><tr><th>Title</th><th>Status</th><th>Due date</th></tr></thead>
              <tbody>
                {customer.jobs.map((j) => (
                  <tr key={j.id}>
                    <td className="font-medium">{j.title}</td>
                    <td><span className={STATUS_CLASS[j.status] ?? "badge"}>{j.status.replace(/_/g, " ")}</span></td>
                    <td className="text-secondary text-sm">{new Date(j.dueDate).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === "invoices" && (
        <div className="card overflow-hidden">
          {customer.invoices.length === 0 ? (
            <p className="text-center text-secondary py-10 text-sm">No invoices for this customer.</p>
          ) : (
            <table className="data-table">
              <thead><tr><th>Invoice</th><th>Total</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {customer.invoices.map((i) => (
                  <tr key={i.id}>
                    <td className="font-medium font-mono text-sm">{i.invoiceNumber}</td>
                    <td>${Number(i.total).toFixed(2)}</td>
                    <td><span className={PAYMENT_CLASS[i.paymentStatus] ?? "badge"}>{i.paymentStatus}</span></td>
                    <td><a href={`/api/invoices/${i.id}/pdf`} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">PDF</a></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
