"use client";
import { useState, useEffect, useRef } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { StatusBadge } from "@/components/ui/badge";
import { MeasurementPanel } from "@/components/customers/measurement-panel";
import { RemoteLinkPanel } from "@/components/customers/remote-link-panel";
import type { Gender } from "@/lib/measurement-fields";

type MeasurementLink = {
  id: string; token: string; url: string;
  gender: Gender; expiresAt: string; usedAt: string | null;
  active: boolean; expired: boolean;
};
type CustomerDetails = {
  id: string; firstName: string; lastName: string;
  phone?: string; email?: string; gender?: Gender | null; notes?: string;
  measurements: Array<{ id: string; recordedAt: string; [key: string]: unknown }>;
  jobs: Array<{ id: string; title: string; status: string; dueDate: string }>;
  invoices: Array<{ id: string; invoiceNumber: string; total: string; paymentStatus: string }>;
  measurementLinks: MeasurementLink[];
};

type Tab = "measurements" | "jobs" | "invoices";

const TABS: { id: Tab; label: string }[] = [
  { id: "measurements", label: "Measurements" },
  { id: "jobs",         label: "Jobs" },
  { id: "invoices",     label: "Invoices" },
];

const PAYMENT_STATUS_COLOR: Record<string, { bg: string; color: string }> = {
  UNPAID:   { bg: "var(--danger-light)",  color: "var(--danger)" },
  PARTIAL:  { bg: "var(--warning-light)", color: "var(--warning)" },
  PAID:     { bg: "var(--success-light)", color: "var(--success)" },
  REFUNDED: { bg: "var(--bg-base)",       color: "var(--text-muted)" },
};

type Props = { customerId: string | null; onClose: () => void };

export function CustomerPopup({ customerId, onClose }: Props) {
  const [tab, setTab] = useState<Tab>("measurements");

  const { data, isLoading, mutate } = useSWR<{ customer: CustomerDetails }>(
    customerId ? `/api/customers/${customerId}` : null,
    fetcher
  );

  const overlayRef = useRef<HTMLDivElement>(null);
  const customer   = data?.customer;

  // Reset tab when switching customers
  useEffect(() => { setTab("measurements"); }, [customerId]);

  // Escape key
  useEffect(() => {
    if (!customerId) return;
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [customerId, onClose]);

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = customerId ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [customerId]);

  if (!customerId) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      aria-modal="true"
      role="dialog"
      aria-label={customer ? `${customer.firstName} ${customer.lastName}` : "Customer details"}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" aria-hidden />

      {/* Popup panel */}
      <div
        className="relative w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          maxHeight: "88vh",
        }}
      >
        {/* ── Header ─────────────────────────────────────────────── */}
        <div
          className="flex items-center gap-3 px-6 py-5 border-b shrink-0"
          style={{ borderColor: "var(--border)" }}
        >
          {customer ? (
            <>
              <div
                className="h-11 w-11 rounded-full flex items-center justify-center text-sm font-semibold shrink-0"
                style={{ background: "var(--brand-light)", color: "var(--brand)" }}
                aria-hidden
              >
                {customer.firstName[0]}{customer.lastName[0]}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-base leading-tight">
                  {customer.firstName} {customer.lastName}
                </h2>
                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                  {customer.phone && (
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>{customer.phone}</span>
                  )}
                  {customer.email && (
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>{customer.email}</span>
                  )}
                  {customer.gender && (
                    <span
                      className="badge text-xs"
                      style={{
                        background: customer.gender === "MALE"   ? "var(--info-light)"   :
                                    customer.gender === "FEMALE" ? "var(--purple-light)"  : "var(--bg-base)",
                        color:      customer.gender === "MALE"   ? "var(--info)"          :
                                    customer.gender === "FEMALE" ? "var(--purple)"        : "var(--text-muted)",
                      }}
                    >
                      {customer.gender === "MALE" ? "♂ Male" : customer.gender === "FEMALE" ? "♀ Female" : "⚧ Other"}
                    </span>
                  )}
                </div>
              </div>
            </>
          ) : (
            /* Loading skeleton */
            <div className="flex-1 space-y-2">
              <div className="h-5 w-44 rounded animate-pulse" style={{ background: "var(--border)" }} />
              <div className="h-3.5 w-32 rounded animate-pulse" style={{ background: "var(--border)" }} />
            </div>
          )}
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors shrink-0 hover:opacity-70"
            style={{ color: "var(--text-muted)" }}
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Notes banner */}
        {customer?.notes && (
          <div
            className="px-6 py-2.5 text-xs border-b"
            style={{ background: "var(--warning-light)", borderColor: "var(--border)", color: "var(--warning)" }}
          >
            <span className="font-medium">Note: </span>{customer.notes}
          </div>
        )}

        {/* ── Tabs ───────────────────────────────────────────────── */}
        <div
          className="flex gap-0 px-6 border-b shrink-0"
          style={{ borderColor: "var(--border)" }}
          role="tablist"
        >
          {TABS.map((t) => {
            const count = !customer ? 0
              : t.id === "measurements" ? customer.measurements.length
              : t.id === "jobs"         ? customer.jobs.length
              :                           customer.invoices.length;
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className="px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px"
                style={{
                  borderColor: tab === t.id ? "var(--brand)" : "transparent",
                  color:       tab === t.id ? "var(--brand)" : "var(--text-secondary)",
                }}
              >
                {t.label}
                {customer && (
                  <span
                    className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full"
                    style={{ background: "var(--bg-base)", color: "var(--text-muted)" }}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Tab body ───────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {isLoading || !customer ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 rounded-xl animate-pulse" style={{ background: "var(--border)" }} />
              ))}
            </div>
          ) : (
            <>
              {/* ── Measurements ── */}
              {tab === "measurements" && (
                <div className="space-y-5">
                  <RemoteLinkPanel
                    customerId={customer.id}
                    customerName={`${customer.firstName} ${customer.lastName}`}
                    customerEmail={customer.email}
                    gender={customer.gender ?? null}
                    activeLinks={customer.measurementLinks}
                    onCreated={() => mutate()}
                  />
                  <MeasurementPanel
                    customerId={customer.id}
                    gender={customer.gender ?? "OTHER"}
                    records={customer.measurements}
                    onSaved={() => mutate()}
                  />
                </div>
              )}

              {/* ── Jobs ── */}
              {tab === "jobs" && (
                <div className="space-y-2">
                  {customer.jobs.length === 0 ? (
                    <p className="text-sm py-10 text-center" style={{ color: "var(--text-muted)" }}>
                      No jobs yet for this customer.
                    </p>
                  ) : customer.jobs.map((job) => (
                    <div
                      key={job.id}
                      className="flex items-center justify-between rounded-xl px-4 py-3"
                      style={{ background: "var(--bg-base)", border: "1px solid var(--border)" }}
                    >
                      <div>
                        <div className="font-medium text-sm">{job.title}</div>
                        <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                          Due {new Date(job.dueDate).toLocaleDateString()}
                        </div>
                      </div>
                      <StatusBadge status={job.status} />
                    </div>
                  ))}
                </div>
              )}

              {/* ── Invoices ── */}
              {tab === "invoices" && (
                <div className="space-y-2">
                  {customer.invoices.length === 0 ? (
                    <p className="text-sm py-10 text-center" style={{ color: "var(--text-muted)" }}>
                      No invoices yet for this customer.
                    </p>
                  ) : customer.invoices.map((inv) => {
                    const sc = PAYMENT_STATUS_COLOR[inv.paymentStatus] ?? PAYMENT_STATUS_COLOR.UNPAID;
                    return (
                      <div
                        key={inv.id}
                        className="flex items-center justify-between rounded-xl px-4 py-3"
                        style={{ background: "var(--bg-base)", border: "1px solid var(--border)" }}
                      >
                        <div>
                          <div className="font-medium text-sm">{inv.invoiceNumber}</div>
                          <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                            Total: {Number(inv.total).toLocaleString("en-NG", { style: "currency", currency: "NGN" })}
                          </div>
                        </div>
                        <span className="badge text-xs" style={{ background: sc.bg, color: sc.color }}>
                          {inv.paymentStatus.charAt(0) + inv.paymentStatus.slice(1).toLowerCase()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}




