"use client";
import { useEffect, useState } from "react";
import { CardSkeleton, Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";

type Metrics = { customerCount: number; activeJobs: number; dueSoon: number; revenue: number };
type RevenuePoint = { month: string; revenue: number };
type JobStatusPoint = { status: string; count: number };
type RecentJob = { id: string; title: string; status: string; dueDate: string; customer: { firstName: string; lastName: string } };

type DashboardData = {
  metrics: Metrics;
  revenueChart: RevenuePoint[];
  jobsChart: JobStatusPoint[];
  recentJobs: RecentJob[];
};

const STAT_CONFIG = [
  { key: "customerCount", label: "Total Customers", icon: "👥", color: "var(--info)",    bg: "var(--info-light)" },
  { key: "activeJobs",    label: "Active Jobs",     icon: "🧵", color: "var(--warning)", bg: "var(--warning-light)" },
  { key: "dueSoon",       label: "Due in 7 Days",   icon: "⏰", color: "var(--danger)",  bg: "var(--danger-light)" },
  { key: "revenue",       label: "Total Revenue",   icon: "💰", color: "var(--success)", bg: "var(--success-light)" },
] as const;

const STATUS_CLASS: Record<string, string> = {
  PENDING: "badge badge-pending", IN_PROGRESS: "badge badge-progress",
  READY_FOR_FITTING: "badge badge-fitting", COMPLETED: "badge badge-completed",
  DELIVERED: "badge badge-delivered", CANCELLED: "badge badge-cancelled",
};

const JOB_COLORS = ["#4f46e5","#0284c7","#7c3aed","#059669","#d97706","#dc2626"];

// Simple bar chart using SVG
function RevenueBarChart({ data }: { data: RevenuePoint[] }) {
  if (!data.length) return null;
  const max = Math.max(...data.map((d) => d.revenue), 1);
  const W = 600; const H = 180; const PAD = { t: 16, r: 16, b: 40, l: 52 };
  const chartW = W - PAD.l - PAD.r;
  const chartH = H - PAD.t - PAD.b;
  const barW = (chartW / data.length) * 0.55;
  const gap = chartW / data.length;

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => ({
    val: max * t,
    y: PAD.t + chartH * (1 - t),
  }));

  function fmtMoney(v: number) {
    if (v >= 1000) return `$${(v / 1000).toFixed(1)}k`;
    return `$${v.toFixed(0)}`;
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 200 }}>
      {/* Grid lines */}
      {yTicks.map((t) => (
        <g key={t.val}>
          <line x1={PAD.l} x2={W - PAD.r} y1={t.y} y2={t.y} stroke="var(--border)" strokeWidth="1" />
          <text x={PAD.l - 6} y={t.y + 4} textAnchor="end" fontSize="10" fill="var(--text-muted)">{fmtMoney(t.val)}</text>
        </g>
      ))}

      {/* Bars */}
      {data.map((d, i) => {
        const barH = Math.max((d.revenue / max) * chartH, d.revenue > 0 ? 4 : 0);
        const x = PAD.l + i * gap + (gap - barW) / 2;
        const y = PAD.t + chartH - barH;
        return (
          <g key={d.month}>
            <rect x={x} y={y} width={barW} height={barH} rx="4" fill="var(--brand)" opacity="0.85" />
            {d.revenue > 0 && (
              <text x={x + barW / 2} y={y - 4} textAnchor="middle" fontSize="9" fill="var(--text-secondary)">{fmtMoney(d.revenue)}</text>
            )}
            <text x={x + barW / 2} y={H - PAD.b + 14} textAnchor="middle" fontSize="10" fill="var(--text-muted)">{d.month}</text>
          </g>
        );
      })}
    </svg>
  );
}

// Donut chart for jobs by status
function JobsDonutChart({ data }: { data: JobStatusPoint[] }) {
  const [hovered, setHovered] = useState<string | null>(null);
  if (!data.length) return null;
  const total = data.reduce((s, d) => s + d.count, 0);
  if (total === 0) return <p className="text-sm text-muted text-center py-8">No jobs yet.</p>;

  const R = 60; const CX = 80; const CY = 80;
  let cumAngle = -Math.PI / 2;

  const slices = data.map((d, i) => {
    const angle = (d.count / total) * 2 * Math.PI;
    const x1 = CX + R * Math.cos(cumAngle);
    const y1 = CY + R * Math.sin(cumAngle);
    cumAngle += angle;
    const x2 = CX + R * Math.cos(cumAngle);
    const y2 = CY + R * Math.sin(cumAngle);
    const largeArc = angle > Math.PI ? 1 : 0;
    const path = `M ${CX} ${CY} L ${x1} ${y1} A ${R} ${R} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    return { ...d, path, color: JOB_COLORS[i % JOB_COLORS.length] };
  });

  const hov = slices.find((s) => s.status === hovered);

  return (
    <div className="flex items-center gap-6 flex-wrap">
      <svg viewBox="0 0 160 160" style={{ width: 140, height: 140, flexShrink: 0 }}>
        {slices.map((s) => (
          <path
            key={s.status}
            d={s.path}
            fill={s.color}
            opacity={hovered && hovered !== s.status ? 0.4 : 1}
            onMouseEnter={() => setHovered(s.status)}
            onMouseLeave={() => setHovered(null)}
            style={{ cursor: "pointer", transition: "opacity 150ms" }}
          />
        ))}
        {/* Donut hole */}
        <circle cx={CX} cy={CY} r={R * 0.55} fill="var(--bg-card)" />
        <text x={CX} y={CY - 6} textAnchor="middle" fontSize="18" fontWeight="600" fill="var(--text-primary)">{hov ? hov.count : total}</text>
        <text x={CX} y={CY + 10} textAnchor="middle" fontSize="9" fill="var(--text-muted)">{hov ? hov.status : "total"}</text>
      </svg>

      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
        {slices.map((s) => (
          <div
            key={s.status}
            className="flex items-center justify-between gap-2 cursor-pointer"
            onMouseEnter={() => setHovered(s.status)}
            onMouseLeave={() => setHovered(null)}
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
              <span className="text-xs text-secondary truncate">{s.status}</span>
            </div>
            <span className="text-xs font-medium flex-shrink-0">{s.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [reminding, setReminding] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, []);

  async function runReminders() {
    setReminding(true);
    try {
      const res = await fetch("/api/reminders/run", { method: "POST" });
      const d = await res.json();
      toast(`Reminders sent: ${d.remindersSent ?? 0} of ${d.checked ?? 0} checked.`);
    } catch {
      toast("Failed to run reminders.", "error");
    } finally {
      setReminding(false);
    }
  }

  function fmtValue(key: string, val: number) {
    if (key === "revenue") return `$${val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    return val.toLocaleString();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-secondary mt-0.5">Your shop at a glance.</p>
        </div>
        <button onClick={runReminders} disabled={reminding} className="btn btn-ghost btn-sm">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          {reminding ? "Running…" : "Send reminders"}
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {STAT_CONFIG.map(({ key, label, icon, color, bg }) =>
          loading ? <CardSkeleton key={key} /> : (
            <div key={key} className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-secondary uppercase tracking-wide">{label}</p>
                <div className="h-8 w-8 rounded-lg flex items-center justify-center text-base" style={{ background: bg, color }}>
                  {icon}
                </div>
              </div>
              <p className="text-2xl font-semibold tracking-tight">
                {data ? fmtValue(key, data.metrics[key as keyof Metrics]) : "—"}
              </p>
            </div>
          )
        )}
      </div>

      {/* Charts row */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Revenue chart — 2/3 width */}
        <div className="card p-5 md:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-medium">Revenue</h2>
              <p className="text-xs text-muted">Last 6 months</p>
            </div>
            {data && (
              <p className="text-sm font-semibold text-brand">
                ${data.metrics.revenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </p>
            )}
          </div>
          {loading ? <Skeleton className="h-48 w-full" /> : data?.revenueChart.length ? (
            <RevenueBarChart data={data.revenueChart} />
          ) : (
            <p className="text-sm text-muted text-center py-12">No payment data yet.</p>
          )}
        </div>

        {/* Jobs donut — 1/3 width */}
        <div className="card p-5">
          <div className="mb-4">
            <h2 className="font-medium">Jobs by status</h2>
            <p className="text-xs text-muted">All time</p>
          </div>
          {loading ? <Skeleton className="h-48 w-full" /> : (
            <JobsDonutChart data={data?.jobsChart ?? []} />
          )}
        </div>
      </div>

      {/* Recent jobs */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
          <h2 className="font-medium">Recent jobs</h2>
          <a href="/jobs" className="text-xs text-brand hover:underline">View all →</a>
        </div>
        {loading ? (
          <div className="p-4 space-y-2">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
          </div>
        ) : !data?.recentJobs.length ? (
          <p className="text-sm text-secondary text-center py-10">No jobs yet. <a href="/jobs" className="text-brand hover:underline">Create your first job.</a></p>
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>Job</th><th>Customer</th><th>Status</th><th>Due</th></tr>
            </thead>
            <tbody>
              {data.recentJobs.map((j) => {
                const overdue = new Date(j.dueDate) < new Date() && !["DELIVERED","CANCELLED"].includes(j.status);
                return (
                  <tr key={j.id}>
                    <td className="font-medium">{j.title}</td>
                    <td className="text-secondary text-sm">{j.customer.firstName} {j.customer.lastName}</td>
                    <td><span className={STATUS_CLASS[j.status] ?? "badge"}>{j.status.replace(/_/g, " ")}</span></td>
                    <td className="text-sm" style={{ color: overdue ? "var(--danger)" : "var(--text-secondary)" }}>
                      {overdue && "⚠ "}{new Date(j.dueDate).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid gap-2 sm:grid-cols-3 text-sm">
        {[
          { href: "/customers", label: "Add customer", desc: "Create a new customer profile" },
          { href: "/jobs",      label: "Create job",   desc: "Start tracking a new tailoring job" },
          { href: "/billing",   label: "New invoice",  desc: "Generate an invoice for a customer" },
        ].map((a) => (
          <a key={a.href} href={a.href} className="card p-3 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors group">
            <p className="font-medium text-brand">{a.label} →</p>
            <p className="text-xs text-muted mt-0.5">{a.desc}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
