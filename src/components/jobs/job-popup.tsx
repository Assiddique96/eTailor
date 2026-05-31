"use client";
import { useEffect, useRef } from "react";
import { StatusBadge } from "@/components/ui/badge";
import { JobComments } from "@/components/jobs/job-comments";
import { JobMaterials } from "@/components/jobs/job-materials";
import { formatCurrency } from "@/lib/currency";
import type { Job } from "@/components/jobs/job-types";
import { ALL_STATUSES, priorityLabel, isOverdue } from "@/components/jobs/job-types";
import { useState } from "react";

type PopupTab = "overview" | "comments" | "materials";

type Props = {
  job: Job | null;
  onClose: () => void;
  onStatusChange: (jobId: string, status: string) => Promise<void>;
  onUpdated: () => void;
};

const TAB_LIST: { id: PopupTab; label: string }[] = [
  { id: "overview",  label: "Overview" },
  { id: "comments",  label: "Activity" },
  { id: "materials", label: "Materials" },
];

const STATUS_LABEL: Record<string, string> = {
  PENDING:           "Pending",
  IN_PROGRESS:       "In Progress",
  READY_FOR_FITTING: "Ready for Fitting",
  COMPLETED:         "Completed",
  DELIVERED:         "Delivered",
  CANCELLED:         "Cancelled",
};

export function JobPopup({ job, onClose, onStatusChange, onUpdated }: Props) {
  const [tab, setTab]         = useState<PopupTab>("overview");
  const [updating, setUpdating] = useState(false);
  const overlayRef            = useRef<HTMLDivElement>(null);

  // Reset to overview when switching jobs
  useEffect(() => { setTab("overview"); }, [job?.id]);

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = job ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [job]);

  if (!job) return null;

  const overdue = isOverdue(job.dueDate, job.status);
  const jobWithExtras = job as Job & { depositAmount?: number; depositPaidAt?: string | null };

  async function handleStatusChange(status: string) {
    setUpdating(true);
    await onStatusChange(job!.id, status);
    setUpdating(false);
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      aria-modal="true"
      role="dialog"
      aria-label={`Job: ${job.title}`}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" aria-hidden />

      {/* Popup */}
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
          className="flex items-start gap-3 px-6 py-5 border-b shrink-0"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-semibold text-base leading-tight truncate">{job.title}</h2>
              {overdue && (
                <span
                  className="badge text-xs shrink-0"
                  style={{ background: "var(--danger-light)", color: "var(--danger)" }}
                >
                  Overdue
                </span>
              )}
            </div>
            <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
              {job.customer.firstName} {job.customer.lastName}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <StatusBadge status={job.status} />
            <button
              onClick={onClose}
              className="p-2 rounded-lg transition-colors hover:opacity-70"
              style={{ color: "var(--text-muted)" }}
              aria-label="Close"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        {/* ── Tabs ───────────────────────────────────────────────── */}
        <div
          className="flex gap-0 px-6 border-b shrink-0"
          style={{ borderColor: "var(--border)" }}
          role="tablist"
        >
          {TAB_LIST.map((t) => (
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
            </button>
          ))}
        </div>

        {/* ── Tab body ───────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 py-5">

          {/* ── Overview ── */}
          {tab === "overview" && (
            <div className="space-y-5">
              {/* Key details grid */}
              <div
                className="grid grid-cols-2 gap-3 rounded-xl p-4"
                style={{ background: "var(--bg-base)", border: "1px solid var(--border)" }}
              >
                <div>
                  <div className="text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Due date</div>
                  <div
                    className="text-sm font-medium"
                    style={{ color: overdue ? "var(--danger)" : "var(--text-primary)" }}
                  >
                    {new Date(job.dueDate).toLocaleDateString("en-GB", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Priority</div>
                  <div className="text-sm font-medium">{priorityLabel(job.priority)}</div>
                </div>
                <div>
                  <div className="text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Assigned to</div>
                  <div className="text-sm">
                    {job.assignedTo ? job.assignedTo.fullName : (
                      <span style={{ color: "var(--text-muted)" }}>Unassigned</span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Tracking code</div>
                  <div
                    className="text-sm font-mono"
                    style={{ color: "var(--brand)", letterSpacing: "0.05em" }}
                  >
                    {job.trackingCode}
                  </div>
                </div>
                {jobWithExtras.depositAmount != null && (
                  <div className="col-span-2">
                    <div className="text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Deposit</div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">{formatCurrency(jobWithExtras.depositAmount)}</span>
                      <span
                        className="badge text-xs"
                        style={
                          jobWithExtras.depositPaidAt
                            ? { background: "var(--success-light)", color: "var(--success)" }
                            : { background: "var(--warning-light)", color: "var(--warning)" }
                        }
                      >
                        {jobWithExtras.depositPaidAt ? "✓ Paid" : "Pending"}
                      </span>
                    </div>
                  </div>
                )}
                {job.description && (
                  <div className="col-span-2">
                    <div className="text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Description</div>
                    <div className="text-sm" style={{ color: "var(--text-secondary)" }}>{job.description}</div>
                  </div>
                )}
              </div>

              {/* Status update */}
              <div>
                <div className="text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>
                  Update status
                </div>
                <div className="flex flex-wrap gap-2">
                  {ALL_STATUSES.filter((s) => s !== "CANCELLED").map((s) => (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(s)}
                      disabled={updating || job.status === s}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors"
                      style={{
                        borderColor: job.status === s ? "var(--brand)" : "var(--border)",
                        background:  job.status === s ? "var(--brand-light)" : "var(--bg-base)",
                        color:       job.status === s ? "var(--brand)" : "var(--text-secondary)",
                        opacity:     updating ? 0.6 : 1,
                      }}
                    >
                      {STATUS_LABEL[s]}
                    </button>
                  ))}
                  <button
                    onClick={() => handleStatusChange("CANCELLED")}
                    disabled={updating || job.status === "CANCELLED"}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors"
                    style={{
                      borderColor: job.status === "CANCELLED" ? "var(--danger)" : "var(--border)",
                      background:  job.status === "CANCELLED" ? "var(--danger-light)" : "var(--bg-base)",
                      color:       job.status === "CANCELLED" ? "var(--danger)" : "var(--text-muted)",
                      opacity:     updating ? 0.6 : 1,
                    }}
                  >
                    Cancel job
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Activity / Comments ── */}
          {tab === "comments" && <JobComments jobId={job.id} />}

          {/* ── Materials ── */}
          {tab === "materials" && <JobMaterials jobId={job.id} />}
        </div>
      </div>
    </div>
  );
}



