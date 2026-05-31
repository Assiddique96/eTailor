"use client";
import { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { CardSkeleton, Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { RevenueBarChart } from "@/components/dashboard/revenue-chart";
import { JobsDonutChart } from "@/components/dashboard/jobs-donut-chart";

type Metrics = { customerCount: number; activeJobs: number; dueSoon: number; revenue: number };
type RevenuePoint = { month: string; revenue: number };
type JobStatusPoint = { status: string; count: number };
type RecentJob = {
  id: string; title: string; status: string; dueDate: string;
  customer: { firstName: string; lastName: string };
};

type DashboardData = {
  shop?: { name: string; logoUrl?: string | null; currency?: string };
  metrics: Metrics;
  revenueChart: RevenuePoint[];
  jobsChart: JobStatusPoint[];
  recentJobs: RecentJob[];
};

const STAT_CONFIG = [
  {
    key: "customerCount", label: "Total Customers",
    color: "var(--info)", bg: "var(--info-light)",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    key: "activeJobs", label: "Active Jobs",
    color: "var(--warning)", bg: "var(--warning-light)",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
        <rect x="9" y="3" width="6" height="4" rx="1"/>
      </svg>
    ),
  },
  {
    key: "dueSoon", label: "Due in 7 Days",
    color: "var(--danger)", bg: "var(--danger-light)",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
  },
  {
    key: "revenue", label: "Total Revenue",
    color: "var(--success)", bg: "var(--success-light)",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <line x1="12" y1="1" x2="12" y2="23"/>
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
    ),
  },
] as const;

export default function DashboardPage() {
  const { toast } = useToast();
  const [reminding, setReminding] = useState(false);

  const { data, isLoading: loading } =
    useSWR<DashboardData>("/api/dashboard", fetcher);

  // Currency symbol from shop settings, default to NGN
  const currencySymbol = data?.shop?.currency === "NGN" ? "₦"
    : data?.shop?.currency === "USD" ? "$"
    : data?.shop?.currency === "GBP" ? "£"
    : data?.shop?.currency === "EUR" ? "€"
    : "₦";

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
    if (key === "revenue") {
      return `${currencySymbol}${val.toLocaleString("en-NG", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })}`;
    }
    return val.toLocaleString();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-secondary mt-0.5">
            {data?.shop?.name ? `${data.shop.name} — at a glance` : "Your shop at a glance."}
          </p>
        </div>
        <button onClick={runReminders} disabled={reminding} className="btn btn-ghost btn-sm">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
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
                <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: bg, color }}>
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
                {currencySymbol}{data.metrics.revenue.toLocaleString("en-NG")}
              </p>
            )}
          </div>
          {loading ? <Skeleton className="h-48 w-full" /> : data?.revenueChart.length ? (
            <RevenueBarChart data={data.revenueChart} currency={currencySymbol} />
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
          <p className="text-sm text-secondary text-center py-10">
            No jobs yet.{" "}
            <a href="/jobs" className="text-brand hover:underline">Create your first job.</a>
          </p>
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>Job</th><th>Customer</th><th>Status</th><th>Due</th></tr>
            </thead>
            <tbody>
              {data.recentJobs.map((j) => {
                const overdue = new Date(j.dueDate) < new Date() &&
                  !["DELIVERED", "CANCELLED"].includes(j.status);
                return (
                  <tr key={j.id}>
                    <td className="font-medium">{j.title}</td>
                    <td className="text-secondary text-sm">{j.customer.firstName} {j.customer.lastName}</td>
                    <td><StatusBadge status={j.status} /></td>
                    <td
                      className="text-sm"
                      style={{ color: overdue ? "var(--danger)" : "var(--text-secondary)" }}
                    >
                      {overdue && <span aria-label="Overdue" title="Overdue">⚠ </span>}
                      {new Date(j.dueDate).toLocaleDateString()}
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
          { href: "/customers", label: "Add customer",  desc: "Create a new customer profile" },
          { href: "/jobs",      label: "Create job",    desc: "Start tracking a new tailoring job" },
          { href: "/billing",   label: "New invoice",   desc: "Generate an invoice for a customer" },
        ].map((a) => (
          <a
            key={a.href}
            href={a.href}
            className="card p-3 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
          >
            <p className="font-medium text-brand">{a.label} →</p>
            <p className="text-xs text-muted mt-0.5">{a.desc}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
