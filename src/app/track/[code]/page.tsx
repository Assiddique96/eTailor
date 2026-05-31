"use client";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { STATUS_STEPS, getStepIndex } from "@/lib/tracking";

type TrackingJob = {
  trackingCode: string;
  title: string;
  description?: string;
  status: string;
  priority: number;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  shop: { name: string; phone?: string; email?: string };
};

const CANCELLED_STATUS = "CANCELLED";

export default function TrackingDetailPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const [job, setJob] = useState<TrackingJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/track/${code.toUpperCase()}`)
      .then(async (res) => {
        if (!res.ok) { setNotFound(true); return; }
        const data = await res.json();
        setJob(data.job);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [code]);

  const isCancelled = job?.status === CANCELLED_STATUS;
  const currentStep = job ? getStepIndex(job.status) : -1;
  const isOverdue = job && new Date(job.dueDate) < new Date() && !["DELIVERED", "CANCELLED"].includes(job.status);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-base)" }}>
      {/* Nav */}
      <header className="border-b" style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}>
        <div className="mx-auto max-w-2xl px-5 py-3.5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">eT</div>
            <span className="font-semibold">eTailor</span>
          </Link>
          <Link href="/track" className="btn btn-ghost btn-sm">
            ← Track another
          </Link>
        </div>
      </header>

      <div className="flex-1 mx-auto w-full max-w-2xl px-5 py-10 space-y-5">

        {/* Loading */}
        {loading && (
          <div className="space-y-4">
            <div className="card p-6 space-y-3">
              <div className="skeleton h-5 w-1/3 rounded" />
              <div className="skeleton h-8 w-2/3 rounded" />
              <div className="skeleton h-4 w-1/2 rounded" />
            </div>
            <div className="card p-6 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-3">
                  <div className="skeleton h-8 w-8 rounded-full shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="skeleton h-4 w-1/3 rounded" />
                    <div className="skeleton h-3 w-2/3 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Not found */}
        {!loading && notFound && (
          <div className="card p-10 text-center space-y-4">
            <div className="text-5xl">🔍</div>
            <h2 className="text-xl font-semibold">Order not found</h2>
            <p className="text-secondary text-sm">
              We couldn't find an order with tracking code <strong className="font-mono">{code.toUpperCase()}</strong>.
              Please check the code and try again.
            </p>
            <div className="flex gap-2 justify-center">
              <Link href="/track" className="btn btn-primary btn-sm">Try again</Link>
              <Link href="/contact" className="btn btn-ghost btn-sm">Contact shop</Link>
            </div>
          </div>
        )}

        {/* Order found */}
        {!loading && job && (
          <>
            {/* Order summary card */}
            <div className="card p-5">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <p className="text-xs font-medium text-muted mb-1 font-mono tracking-widest">{job.trackingCode}</p>
                  <h1 className="text-xl font-semibold">{job.title}</h1>
                  {job.description && <p className="text-sm text-secondary mt-1">{job.description}</p>}
                </div>
                {isCancelled ? (
                  <span className="badge badge-cancelled shrink-0">Cancelled</span>
                ) : (
                  <span
                    className="badge shrink-0"
                    style={{ background: "var(--brand-light)", color: "var(--brand)" }}
                  >
                    {job.status.replace(/_/g, " ")}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                <div className="rounded-lg p-3" style={{ background: "var(--bg-base)" }}>
                  <p className="text-xs text-muted mb-0.5">Shop</p>
                  <p className="font-medium">{job.shop.name}</p>
                </div>
                <div className="rounded-lg p-3" style={{ background: isOverdue ? "var(--danger-light)" : "var(--bg-base)" }}>
                  <p className="text-xs text-muted mb-0.5">Expected by</p>
                  <p className="font-medium" style={{ color: isOverdue ? "var(--danger)" : undefined }}>
                    {isOverdue && "⚠ "}{new Date(job.dueDate).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <div className="rounded-lg p-3" style={{ background: "var(--bg-base)" }}>
                  <p className="text-xs text-muted mb-0.5">Order placed</p>
                  <p className="font-medium">{new Date(job.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}</p>
                </div>
              </div>
            </div>

            {/* Progress tracker */}
            {!isCancelled && (
              <div className="card p-5">
                <h2 className="font-medium mb-5">Order progress</h2>
                <div className="space-y-0">
                  {STATUS_STEPS.map((step, index) => {
                    const isCompleted = index < currentStep;
                    const isCurrent = index === currentStep;
                    const isFuture = index > currentStep;
                    const isLast = index === STATUS_STEPS.length - 1;

                    return (
                      <div key={step.status} className="flex gap-4">
                        {/* Step indicator + connector */}
                        <div className="flex flex-col items-center">
                          <div
                            className="h-9 w-9 rounded-full flex items-center justify-center text-base shrink-0 transition-all"
                            style={{
                              background: isCompleted
                                ? "var(--success-light)"
                                : isCurrent
                                ? "var(--brand)"
                                : "var(--bg-base)",
                              border: isFuture ? "2px dashed var(--border-strong)" : "none",
                              fontSize: isCurrent ? "16px" : "14px",
                            }}
                          >
                            {isCompleted ? (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5">
                                <polyline points="20 6 9 17 4 12"/>
                              </svg>
                            ) : (
                              <span style={{ filter: isFuture ? "grayscale(1) opacity(0.4)" : "none" }}>
                                {step.icon}
                              </span>
                            )}
                          </div>
                          {!isLast && (
                            <div
                              className="w-0.5 flex-1 my-1"
                              style={{
                                background: isCompleted ? "var(--success)" : "var(--border)",
                                minHeight: "24px",
                              }}
                            />
                          )}
                        </div>

                        {/* Step content */}
                        <div className={`pb-6 flex-1 ${isLast ? "pb-0" : ""}`}>
                          <div className="flex items-center gap-2 mb-0.5">
                            <p
                              className="text-sm font-medium"
                              style={{
                                color: isCurrent
                                  ? "var(--brand)"
                                  : isFuture
                                  ? "var(--text-muted)"
                                  : "var(--text-primary)",
                              }}
                            >
                              {step.label}
                            </p>
                            {isCurrent && (
                              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "var(--brand-light)", color: "var(--brand)" }}>
                                Current
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted leading-relaxed">{step.desc}</p>
                          {isCurrent && (
                            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                              Last updated: {new Date(job.updatedAt).toLocaleString("en-US", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Cancelled state */}
            {isCancelled && (
              <div className="card p-6 text-center space-y-3" style={{ borderColor: "var(--danger)", background: "var(--danger-light)" }}>
                <div className="text-3xl">❌</div>
                <h2 className="font-semibold" style={{ color: "var(--danger)" }}>Order Cancelled</h2>
                <p className="text-sm text-secondary">This order has been cancelled. Please contact the shop for more information.</p>
              </div>
            )}

            {/* Contact shop */}
            {(job.shop.phone || job.shop.email) && (
              <div className="card p-5">
                <h2 className="font-medium mb-3 text-sm">Contact {job.shop.name}</h2>
                <div className="flex flex-wrap gap-2">
                  {job.shop.phone && (
                    <a href={`tel:${job.shop.phone}`} className="btn btn-ghost btn-sm">
                      📞 {job.shop.phone}
                    </a>
                  )}
                  {job.shop.email && (
                    <a href={`mailto:${job.shop.email}`} className="btn btn-ghost btn-sm">
                      ✉️ {job.shop.email}
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Share tracking link */}
            <div className="card p-5">
              <h2 className="font-medium mb-3 text-sm">Share tracking link</h2>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={typeof window !== "undefined" ? window.location.href : ""}
                  className="field text-sm font-mono flex-1"
                />
                <button
                  className="btn btn-ghost btn-sm shrink-0"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                  }}
                >
                  Copy
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <footer className="border-t py-5 text-center text-xs text-muted" style={{ borderColor: "var(--border)" }}>
        © {new Date().getFullYear()} eTailor · Order Tracking
      </footer>
    </div>
  );
}



