"use client";
import { FormEvent, useEffect, useState, useRef } from "react";
import { TableSkeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";

type Job = {
  id: string; title: string; description?: string; status: string;
  priority: number; dueDate: string;
  customer: { id: string; firstName: string; lastName: string };
  assignedTo?: { id: string; fullName: string } | null;
};
type Customer = { id: string; firstName: string; lastName: string };

const COLUMNS = [
  { status: "PENDING",           label: "Pending",          cls: "badge-pending" },
  { status: "IN_PROGRESS",       label: "In Progress",      cls: "badge-progress" },
  { status: "READY_FOR_FITTING", label: "Ready for Fitting", cls: "badge-fitting" },
  { status: "COMPLETED",         label: "Completed",        cls: "badge-completed" },
  { status: "DELIVERED",         label: "Delivered",        cls: "badge-delivered" },
];

const ALL_STATUSES = ["PENDING","IN_PROGRESS","READY_FOR_FITTING","COMPLETED","DELIVERED","CANCELLED"];

function priorityDot(p: number) {
  if (p <= 1) return "🔴";
  if (p === 2) return "🟠";
  if (p === 4) return "🟢";
  if (p === 5) return "⚪";
  return "";
}

function isOverdue(dueDate: string, status: string) {
  return new Date(dueDate) < new Date() && !["DELIVERED", "CANCELLED"].includes(status);
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [view, setView] = useState<"board" | "list">("board");
  const formRef = useRef<HTMLFormElement>(null);
  const { toast } = useToast();

  async function load() {
    const [jr, cr] = await Promise.all([fetch("/api/jobs"), fetch("/api/customers")]);
    const jd = await jr.json();
    const cd = await cr.json();
    setJobs(jd.jobs ?? []);
    setCustomers(cd.customers ?? []);
  }

  useEffect(() => { load().finally(() => setLoading(false)); }, []);

  async function onCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: fd.get("customerId"),
          title: fd.get("title"),
          description: fd.get("description"),
          dueDate: fd.get("dueDate"),
          priority: Number(fd.get("priority") ?? 3),
        }),
      });
      if (!res.ok) { const err = await res.json(); toast(err.error || "Failed.", "error"); return; }
      toast("Job created.");
      formRef.current?.reset();
      setShowForm(false);
      await load();
    } catch { toast("Network error.", "error"); }
    finally { setSubmitting(false); }
  }

  async function updateStatus(jobId: string, status: string) {
    const res = await fetch(`/api/jobs/${jobId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) { toast("Failed to update status.", "error"); return; }
    setJobs((prev) => prev.map((j) => j.id === jobId ? { ...j, status } : j));
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Jobs</h1>
          <p className="text-sm text-secondary mt-0.5">{jobs.length} total jobs</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-lg border overflow-hidden text-xs font-medium" style={{ borderColor: "var(--border)" }}>
            {(["board", "list"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 capitalize transition-colors ${view === v ? "text-white bg-indigo-600" : "text-secondary hover:text-primary"}`}
              >
                {v}
              </button>
            ))}
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm((s) => !s)}>
            + New job
          </button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card p-5">
          <h2 className="font-medium mb-4">Create job</h2>
          <form ref={formRef} onSubmit={onCreate} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-secondary">Customer *</label>
              <select name="customerId" required className="field">
                <option value="">Select customer</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-secondary">Job title *</label>
              <input name="title" placeholder="e.g. Wedding suit alterations" required className="field" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-secondary">Due date *</label>
              <input type="date" name="dueDate" required className="field" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-secondary">Priority</label>
              <select name="priority" className="field" defaultValue="3">
                <option value="1">🔴 Urgent (1)</option>
                <option value="2">🟠 High (2)</option>
                <option value="3">Normal (3)</option>
                <option value="4">🟢 Low (4)</option>
                <option value="5">⚪ Minimal (5)</option>
              </select>
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-medium text-secondary">Description</label>
              <input name="description" placeholder="Additional details…" className="field" />
            </div>
            <div className="sm:col-span-2 flex gap-2 justify-end pt-1">
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
                {submitting ? "Creating…" : "Create job"}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="p-4"><TableSkeleton /></div>
      ) : view === "board" ? (
        /* Kanban board */
        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(5, minmax(0,1fr))", overflowX: "auto" }}>
          {COLUMNS.map(({ status, label, cls }) => {
            const colJobs = jobs.filter((j) => j.status === status);
            return (
              <div key={status} className="min-w-0">
                <div className="flex items-center justify-between mb-2 px-0.5">
                  <span className={`badge ${cls} text-xs`}>{label}</span>
                  <span className="text-xs text-muted">{colJobs.length}</span>
                </div>
                <div className="space-y-2">
                  {colJobs.length === 0 && (
                    <div className="rounded-lg border-2 border-dashed p-3 text-xs text-center text-muted" style={{ borderColor: "var(--border)" }}>
                      Empty
                    </div>
                  )}
                  {colJobs.map((job) => {
                    const overdue = isOverdue(job.dueDate, job.status);
                    return (
                      <div
                        key={job.id}
                        className="card p-3 text-sm space-y-2"
                        style={overdue ? { borderColor: "var(--danger)", borderWidth: "1px" } : {}}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <p className="font-medium leading-snug">{job.title}</p>
                          {priorityDot(job.priority) && <span title={`Priority ${job.priority}`}>{priorityDot(job.priority)}</span>}
                        </div>
                        <p className="text-xs text-secondary">{job.customer.firstName} {job.customer.lastName}</p>
                        <p className={`text-xs ${overdue ? "text-danger font-medium" : "text-muted"}`}>
                          {overdue ? "⚠ " : ""}Due {new Date(job.dueDate).toLocaleDateString()}
                        </p>
                        <select
                          value={job.status}
                          onChange={(e) => updateStatus(job.id, e.target.value)}
                          className="field text-xs py-1"
                        >
                          {ALL_STATUSES.map((s) => (
                            <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List view */
        <div className="card overflow-hidden">
          {jobs.length === 0 ? (
            <p className="text-center text-secondary py-10 text-sm">No jobs yet.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Job</th><th>Customer</th><th>Status</th><th>Due date</th><th>Priority</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((j) => {
                  const overdue = isOverdue(j.dueDate, j.status);
                  return (
                    <tr key={j.id}>
                      <td>
                        <p className="font-medium">{j.title}</p>
                        {j.description && <p className="text-xs text-muted">{j.description}</p>}
                      </td>
                      <td className="text-secondary text-sm">{j.customer.firstName} {j.customer.lastName}</td>
                      <td>
                        <select
                          value={j.status}
                          onChange={(e) => updateStatus(j.id, e.target.value)}
                          className="field text-xs py-1"
                          style={{ width: "auto", minWidth: "140px" }}
                        >
                          {ALL_STATUSES.map((s) => (
                            <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                          ))}
                        </select>
                      </td>
                      <td className={`text-sm ${overdue ? "font-medium" : "text-secondary"}`} style={{ color: overdue ? "var(--danger)" : undefined }}>
                        {overdue && "⚠ "}{new Date(j.dueDate).toLocaleDateString()}
                      </td>
                      <td className="text-center">{priorityDot(j.priority) || j.priority}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
