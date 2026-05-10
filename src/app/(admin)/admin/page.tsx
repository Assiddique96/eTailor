"use client";
import { useEffect, useState } from "react";
import { CardSkeleton } from "@/components/ui/skeleton";

type Stats = {
  totalShops: number; activeShops: number; totalUsers: number;
  totalCustomers: number; totalJobs: number; activeJobs: number; totalRevenue: number;
};
type RecentShop = {
  id: string; name: string; slug: string; isActive: boolean; createdAt: string;
  _count: { customers: number; jobs: number; users: number };
};

const STAT_CONFIG = [
  { key: "totalShops",     label: "Total Shops",      icon: "🏪", sub: (s: Stats) => `${s.activeShops} active` },
  { key: "totalUsers",     label: "Platform Users",   icon: "👤", sub: () => "across all shops" },
  { key: "totalCustomers", label: "Total Customers",  icon: "👥", sub: () => "across all shops" },
  { key: "totalJobs",      label: "Total Jobs",       icon: "🧵", sub: (s: Stats) => `${s.activeJobs} active` },
  { key: "totalRevenue",   label: "Platform Revenue", icon: "💰", sub: () => "all payments recorded", isMoney: true },
] as const;

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentShops, setRecentShops] = useState<RecentShop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((d) => { setStats(d.stats); setRecentShops(d.recentShops ?? []); })
      .finally(() => setLoading(false));
  }, []);

  function fmt(key: string, val: number, isMoney?: boolean) {
    if (isMoney) return `$${val.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
    return val.toLocaleString();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Platform Overview</h1>
        <p className="text-sm text-secondary mt-0.5">Real-time metrics across all shops.</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        {STAT_CONFIG.map(({ key, label, icon, sub, isMoney }) =>
          loading ? <CardSkeleton key={key} /> : (
            <div key={key} className="card p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted uppercase tracking-wide">{label}</p>
                <span className="text-lg">{icon}</span>
              </div>
              <p className="text-2xl font-semibold">
                {stats ? fmt(key, stats[key as keyof Stats] as number, isMoney) : "—"}
              </p>
              {stats && <p className="text-xs text-muted mt-0.5">{sub(stats)}</p>}
            </div>
          )
        )}
      </div>

      {/* Recently registered shops */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
          <h2 className="font-medium">Recently Registered Shops</h2>
        </div>
        {loading ? (
          <div className="p-4 space-y-2">
            {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-12 rounded-lg" />)}
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>Shop</th><th>Customers</th><th>Jobs</th><th>Users</th><th>Status</th><th>Registered</th></tr>
            </thead>
            <tbody>
              {recentShops.map((shop) => (
                <tr key={shop.id}>
                  <td>
                    <p className="font-medium">{shop.name}</p>
                    <p className="text-xs text-muted font-mono">{shop.slug}</p>
                  </td>
                  <td className="text-secondary">{shop._count.customers}</td>
                  <td className="text-secondary">{shop._count.jobs}</td>
                  <td className="text-secondary">{shop._count.users}</td>
                  <td>
                    <span className={shop.isActive ? "badge badge-completed" : "badge badge-cancelled"}>
                      {shop.isActive ? "Active" : "Suspended"}
                    </span>
                  </td>
                  <td className="text-muted text-xs">{new Date(shop.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Quick links */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { href: "/admin/shops", label: "Manage Shops", desc: "View, suspend, or activate shops", icon: "🏪" },
          { href: "/admin/users", label: "Manage Users", desc: "View and deactivate platform users", icon: "👤" },
          { href: "/admin/audit", label: "Global Audit Trail", desc: "All actions across all shops", icon: "📋" },
        ].map((a) => (
          <a key={a.href} href={a.href} className="card p-4 hover:border-red-300 dark:hover:border-red-800 transition-colors group">
            <div className="text-2xl mb-2">{a.icon}</div>
            <p className="font-medium group-hover:text-red-600 transition-colors">{a.label} →</p>
            <p className="text-xs text-muted mt-0.5">{a.desc}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
