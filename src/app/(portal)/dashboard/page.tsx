"use client";

import { useEffect, useState } from "react";

type Metrics = {
  customerCount: number;
  activeJobs: number;
  dueSoon: number;
  revenue: number;
};

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [runningReminders, setRunningReminders] = useState(false);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then((data) => setMetrics(data.metrics));
  }, []);

  const cards = [
    { label: "Customers", value: metrics?.customerCount ?? "-" },
    { label: "Active Jobs", value: metrics?.activeJobs ?? "-" },
    { label: "Due in 7 Days", value: metrics?.dueSoon ?? "-" },
    { label: "Revenue", value: metrics ? `$${Number(metrics.revenue).toFixed(2)}` : "-" },
  ];

  async function runReminders() {
    setRunningReminders(true);
    await fetch("/api/reminders/run", { method: "POST" });
    setRunningReminders(false);
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Dashboard</h2>
      <button
        onClick={runReminders}
        disabled={runningReminders}
        className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700"
      >
        {runningReminders ? "Running reminders..." : "Run due-date reminders now"}
      </button>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{card.label}</p>
            <p className="mt-1 text-2xl font-semibold">{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
