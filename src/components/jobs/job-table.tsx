"use client";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ALL_STATUSES, isOverdue, priorityDot, type Job } from "./job-types";

type Props = {
  jobs: Job[];
  onStatusChange: (jobId: string, status: string) => void;
  onJobClick?: (job: Job) => void;
};

export function JobTable({ jobs, onStatusChange, onJobClick }: Props) {
  if (jobs.length === 0) {
    return <EmptyState icon="🧵" title="No jobs yet" description="Create your first job to get started." />;
  }

  return (
    <div className="card overflow-hidden">
      <table className="data-table">
        <thead>
          <tr>
            <th>Job</th><th>Customer</th><th>Tracking</th>
            <th>Status</th><th>Due date</th><th>Priority</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((j) => {
            const overdue = isOverdue(j.dueDate, j.status);
            return (
              <tr key={j.id} className="cursor-pointer" onClick={() => onJobClick?.(j)}>
                <td>
                  <p className="font-medium">{j.title}</p>
                  {j.description && <p className="text-xs text-muted">{j.description}</p>}
                </td>
                <td className="text-secondary text-sm">
                  {j.customer.firstName} {j.customer.lastName}
                </td>
                <td>
                  {j.trackingCode && (
                    <a
                      href={`/track/${j.trackingCode}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-mono px-1.5 py-0.5 rounded"
                      style={{ background: "var(--brand-light)", color: "var(--brand)" }}
                    >
                      📦 {j.trackingCode}
                    </a>
                  )}
                </td>
                <td>
                  <select
                    value={j.status}
                    onChange={(e) => onStatusChange(j.id, e.target.value)}
                    className="field text-xs py-1"
                    style={{ width: "auto", minWidth: "140px" }}
                    aria-label={`Status for ${j.title}`}
                  >
                    {ALL_STATUSES.map((s) => (
                      <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                    ))}
                  </select>
                </td>
                <td
                  className="text-sm"
                  style={{ color: overdue ? "var(--danger)" : "var(--text-secondary)", fontWeight: overdue ? 500 : undefined }}
                >
                  {overdue && "⚠ "}{new Date(j.dueDate).toLocaleDateString()}
                </td>
                <td className="text-center" aria-label={`Priority ${j.priority}`}>
                  {priorityDot(j.priority) || j.priority}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
