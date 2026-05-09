"use client";
import { useEffect, useState } from "react";
import { CardSkeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";

type Metrics = { customerCount: number; activeJobs: number; dueSoon: number; revenue: number };

const STAT_CONFIG = [
  { key: "customerCount", label: "Total Customers", icon: "👥", color: "var(--info)", bg: "var(--info-light)" },
  { key: "activeJobs",    label: "Active Jobs",      icon: "🧵", color: "var(--warning)", bg: "var(--warning-light)" },
  { key: "dueSoon",       label: "Due in 7 Days",    icon: "⏰", color: "var(--danger)", bg: "var(--danger-light)" },
  { key: "revenue",       label: "Total Revenue",    icon: "💰", color: "var(--success)", bg: "var(--success-light)" },
] as const;

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [reminding, setReminding] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => setMetrics(d.metrics))
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

  function formatValue(key: string, value: number) {
    if (key === "revenue") return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    return value.toLocaleString();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-secondary mt-0.5">Your shop at a glance.</p>
        </div>
        <button
          onClick={runReminders}
          disabled={reminding}
          className="btn btn-ghost btn-sm"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          {reminding ? "Running…" : "Send reminders"}
        </button>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {STAT_CONFIG.map(({ key, label, icon, color, bg }) => (
          loading ? <CardSkeleton key={key} /> : (
            <div key={key} className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-secondary uppercase tracking-wide">{label}</p>
                <div className="h-8 w-8 rounded-lg flex items-center justify-center text-base" style={{ background: bg, color }}>
                  {icon}
                </div>
              </div>
              <p className="text-2xl font-semibold tracking-tight">
                {metrics ? formatValue(key, metrics[key as keyof Metrics]) : "—"}
              </p>
            </div>
          )
        ))}
      </div>

      {/* Quick tips */}
      <div className="card p-5">
        <h2 className="font-medium mb-3">Quick actions</h2>
        <div className="grid gap-2 sm:grid-cols-3 text-sm">
          {[
            { href: "/customers", label: "Add customer", desc: "Create a new customer profile" },
            { href: "/jobs",      label: "Create job",   desc: "Start tracking a new tailoring job" },
            { href: "/billing",   label: "Create invoice", desc: "Generate an invoice for a customer" },
          ].map((a) => (
            <a
              key={a.href}
              href={a.href}
              className="rounded-lg border p-3 hover:border-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 transition-colors group"
              style={{ borderColor: "var(--border)" }}
            >
              <p className="font-medium text-brand">{a.label} →</p>
              <p className="text-xs text-muted mt-0.5">{a.desc}</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
