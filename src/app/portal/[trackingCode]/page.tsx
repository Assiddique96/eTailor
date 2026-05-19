"use client";
import { use, useEffect, useState } from "react";
import { formatCurrency } from "@/lib/currency";

type JobStatus = string;
type JobData = {
  id: string; title: string; status: JobStatus;
  dueDate: string; trackingCode: string; description?: string;
  customer: { firstName: string; lastName: string };
  shop: { name: string; logoUrl?: string | null };
  invoice?: {
    invoiceNumber: string; total: string; paymentStatus: string;
    lines: Array<{ description: string; quantity: number; unitPrice: number; amount: number }>;
    payments: Array<{ amount: string; method: string; paidAt: string }>;
  } | null;
};

const STATUS_STEPS: JobStatus[] = [
  "PENDING", "IN_PROGRESS", "READY_FOR_FITTING", "COMPLETED", "DELIVERED",
];

const STATUS_LABEL: Record<string, string> = {
  PENDING:           "Order received",
  IN_PROGRESS:       "In progress",
  READY_FOR_FITTING: "Ready for fitting",
  COMPLETED:         "Completed",
  DELIVERED:         "Delivered",
  CANCELLED:         "Cancelled",
};

const STATUS_DESC: Record<string, string> = {
  PENDING:           "Your order has been received and is being prepared.",
  IN_PROGRESS:       "Your garment is being worked on.",
  READY_FOR_FITTING: "Your garment is ready! Please schedule a fitting.",
  COMPLETED:         "Your garment is complete and ready for collection.",
  DELIVERED:         "Your order has been delivered. Thank you!",
  CANCELLED:         "This order has been cancelled. Please contact the shop.",
};

function StatusProgress({ status }: { status: string }) {
  const stepIndex = STATUS_STEPS.indexOf(status);
  if (stepIndex === -1) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-0">
        {STATUS_STEPS.map((step, i) => {
          const done    = i <= stepIndex;
          const current = i === stepIndex;
          return (
            <div key={step} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div
                  className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors"
                  style={{
                    background: done ? "var(--brand)"      : "var(--bg-base)",
                    color:      done ? "#fff"              : "var(--text-muted)",
                    border:     current ? "3px solid var(--brand)" : "2px solid var(--border)",
                    boxShadow:  current ? "0 0 0 3px var(--brand-light)" : "none",
                  }}
                  aria-label={`Step ${i + 1}: ${STATUS_LABEL[step]}`}
                >
                  {done && !current ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" aria-hidden>
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  ) : (
                    i + 1
                  )}
                </div>
                <p className="text-xs mt-1 text-center hidden sm:block"
                  style={{
                    color:      done ? "var(--brand)"  : "var(--text-muted)",
                    fontWeight: current ? 600 : 400,
                    maxWidth:   72,
                  }}>
                  {STATUS_LABEL[step]}
                </p>
              </div>
              {i < STATUS_STEPS.length - 1 && (
                <div
                  className="flex-1 h-0.5 mx-1"
                  style={{ background: i < stepIndex ? "var(--brand)" : "var(--border)" }}
                  aria-hidden
                />
              )}
            </div>
          );
        })}
      </div>
      <p className="text-sm text-secondary text-center mt-2">{STATUS_DESC[status]}</p>
    </div>
  );
}

export default function CustomerPortalPage({
  params,
}: {
  params: Promise<{ trackingCode: string }>;
}) {
  const { trackingCode } = use(params);
  const [job, setJob]     = useState<JobData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/track/${trackingCode}`)
      .then(async (res) => {
        const d = await res.json();
        if (!res.ok) { setError(d.error ?? "Job not found."); return; }
        setJob(d.job ?? d);
      })
      .catch(() => setError("Could not load your order. Please try again."))
      .finally(() => setLoading(false));
  }, [trackingCode]);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base, #f7f6f3)", padding: "40px 16px 80px" }}>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>

        {/* Header */}
        <div className="text-center mb-8">
          {job?.shop?.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={job.shop.logoUrl.split("?")[0]} alt={job.shop.name}
              className="h-14 w-14 mx-auto rounded-2xl object-contain mb-3"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }} />
          )}
          <h1 className="text-2xl font-bold">{job?.shop?.name ?? "eTailor"}</h1>
          <p className="text-secondary text-sm mt-1">Order tracking</p>
        </div>

        {loading && (
          <div className="card p-8 text-center">
            <p className="text-secondary text-sm">Loading your order…</p>
          </div>
        )}

        {error && (
          <div className="card p-8 text-center">
            <p className="text-4xl mb-3" aria-hidden>🔍</p>
            <h2 className="font-semibold text-lg mb-1">Order not found</h2>
            <p className="text-secondary text-sm">{error}</p>
          </div>
        )}

        {job && (
          <div className="space-y-4">
            {/* Order summary card */}
            <div className="card p-5">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <p className="text-xs text-muted mb-1">Order</p>
                  <h2 className="font-bold text-lg">{job.title}</h2>
                  <p className="text-secondary text-sm mt-0.5">
                    {job.customer.firstName} {job.customer.lastName}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted mb-1">Tracking code</p>
                  <code
                    className="text-xs font-mono px-2 py-1 rounded"
                    style={{ background: "var(--brand-light)", color: "var(--brand)" }}
                  >
                    {job.trackingCode}
                  </code>
                  <p className="text-xs text-muted mt-2">
                    Due {new Date(job.dueDate).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
              </div>

              {/* Progress tracker */}
              {job.status !== "CANCELLED" ? (
                <StatusProgress status={job.status} />
              ) : (
                <div className="rounded-lg px-4 py-3 text-sm text-center"
                  style={{ background: "var(--danger-light)", color: "var(--danger)" }}>
                  ✕ This order has been cancelled. Please contact the shop.
                </div>
              )}
            </div>

            {/* Invoice section */}
            {job.invoice && (
              <div className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Invoice {job.invoice.invoiceNumber}</h3>
                  <span
                    className="badge text-xs"
                    style={{
                      background: job.invoice.paymentStatus === "PAID" ? "var(--success-light)" :
                                  job.invoice.paymentStatus === "PARTIAL" ? "var(--warn-light)" : "var(--danger-light)",
                      color:      job.invoice.paymentStatus === "PAID" ? "var(--success)" :
                                  job.invoice.paymentStatus === "PARTIAL" ? "var(--warn)" : "var(--danger)",
                    }}
                  >
                    {job.invoice.paymentStatus}
                  </span>
                </div>

                {/* Line items */}
                {job.invoice.lines.length > 0 && (
                  <table className="w-full text-sm mb-4">
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--border)" }}>
                        <th className="text-left text-xs text-muted pb-2 font-medium">Item</th>
                        <th className="text-right text-xs text-muted pb-2 font-medium">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {job.invoice.lines.map((line, i) => (
                        <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                          <td className="py-2 text-secondary">{line.description}</td>
                          <td className="py-2 text-right font-medium">{formatCurrency(line.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td className="pt-3 font-bold">Total</td>
                        <td className="pt-3 text-right font-bold text-lg">
                          {formatCurrency(job.invoice.total)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                )}

                {/* Payment history */}
                {job.invoice.payments.length > 0 && (
                  <div>
                    <p className="text-xs text-muted font-medium uppercase tracking-wide mb-2">
                      Payment history
                    </p>
                    <div className="space-y-1.5">
                      {job.invoice.payments.map((p, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-secondary">
                            {new Date(p.paidAt).toLocaleDateString()} · {p.method}
                          </span>
                          <span className="font-medium" style={{ color: "var(--success)" }}>
                            {formatCurrency(p.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Footer note */}
            <p className="text-center text-xs text-muted">
              Questions? Contact {job.shop.name} directly. · Powered by eTailor
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
