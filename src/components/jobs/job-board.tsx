"use client";
import { StatusBadge } from "@/components/ui/badge";
import { BOARD_COLUMNS, ALL_STATUSES, isOverdue, priorityDot, type Job } from "./job-types";

type Props = {
  jobs: Job[];
  onStatusChange: (jobId: string, status: string) => void;
  onJobClick?: (job: Job) => void;
};

export function JobBoard({ jobs, onStatusChange, onJobClick }: Props) {
  return (
    <div
      className="grid gap-3"
      style={{ gridTemplateColumns: "repeat(5, minmax(160px, 1fr))", overflowX: "auto" }}
    >
      {BOARD_COLUMNS.map(({ status, label }) => {
        const colJobs = jobs.filter((j) => j.status === status);
        return (
          <div key={status} className="min-w-0">
            <div className="flex items-center justify-between mb-2 px-0.5">
              <StatusBadge status={status} />
              <span className="text-xs text-muted">{colJobs.length}</span>
            </div>
            <div className="space-y-2">
              {colJobs.length === 0 ? (
                <div
                  className="rounded-lg border-2 border-dashed p-3 text-xs text-center text-muted"
                  style={{ borderColor: "var(--border)" }}
                  aria-label={`No jobs in ${label}`}
                >
                  Empty
                </div>
              ) : colJobs.map((job) => (
                <JobCard key={job.id} job={job} onStatusChange={onStatusChange} onJobClick={onJobClick} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function JobCard({ job, onStatusChange, onJobClick }: { job: Job; onStatusChange: Props["onStatusChange"]; onJobClick?: Props["onJobClick"] }) {
  const overdue = isOverdue(job.dueDate, job.status);
  const dot = priorityDot(job.priority);

  return (
    <div
      className="card p-3 text-sm space-y-2 cursor-pointer"
      onClick={() => onJobClick?.(job)}
      style={overdue ? { borderColor: "var(--danger)" } : {}}
    >
      <div className="flex items-start justify-between gap-1">
        <p className="font-medium leading-snug">{job.title}</p>
        {dot && <span title={`Priority ${job.priority}`} aria-label={`Priority ${job.priority}`}>{dot}</span>}
      </div>
      <p className="text-xs text-secondary">
        {job.customer.firstName} {job.customer.lastName}
      </p>
      <p className={`text-xs ${overdue ? "font-medium" : "text-muted"}`}
        style={{ color: overdue ? "var(--danger)" : undefined }}>
        {overdue && "⚠ "}Due {new Date(job.dueDate).toLocaleDateString()}
      </p>
      {job.trackingCode && (
        <a
          href={`/track/${job.trackingCode}`}
          target="_blank"
          rel="noreferrer"
          className="text-xs font-mono px-1.5 py-0.5 rounded inline-flex items-center gap-1 hover:opacity-80 transition-opacity"
          style={{ background: "var(--brand-light)", color: "var(--brand)" }}
          aria-label={`Track job ${job.trackingCode}`}
        >
          📦 {job.trackingCode}
        </a>
      )}
      <select
        value={job.status}
        onChange={(e) => onStatusChange(job.id, e.target.value)}
        className="field text-xs py-1"
        aria-label={`Change status for ${job.title}`}
      >
        {ALL_STATUSES.map((s) => (
          <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
        ))}
      </select>
    </div>
  );
}
