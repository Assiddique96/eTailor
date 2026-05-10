"use client";
import { useEffect, useState } from "react";
import { TableSkeleton } from "@/components/ui/skeleton";

type Log = {
  id: string; action: string; entity: string; entityId?: string;
  createdAt: string; ipAddress?: string; metadata?: Record<string, unknown>;
  user?: { fullName: string; email: string } | null;
  shop?: { name: string } | null;
};

const ACTION_COLOR: Record<string, { bg: string; text: string }> = {
  CREATED:   { bg: "var(--success-light)", text: "var(--success)" },
  UPDATED:   { bg: "var(--info-light)",    text: "var(--info)" },
  DELETED:   { bg: "var(--danger-light)",  text: "var(--danger)" },
  PAYMENT:   { bg: "var(--warning-light)", text: "var(--warning)" },
  LOGIN:     { bg: "var(--brand-light)",   text: "var(--brand)" },
  SUSPENDED: { bg: "var(--danger-light)",  text: "var(--danger)" },
  ACTIVATED: { bg: "var(--success-light)", text: "var(--success)" },
};

function actionColor(action: string) {
  for (const [key, val] of Object.entries(ACTION_COLOR)) {
    if (action.includes(key)) return val;
  }
  return { bg: "var(--bg-base)", text: "var(--text-muted)" };
}

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [shopFilter, setShopFilter] = useState("");

  useEffect(() => {
    // Use global audit endpoint — no shopId filter = all shops
    fetch("/api/audit?global=true")
      .then((r) => r.json())
      .then((d) => setLogs(d.logs ?? []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = logs.filter((l) => {
    const q = filter.toLowerCase();
    const matchesQ = !q || `${l.action} ${l.entity} ${l.user?.fullName} ${l.user?.email}`.toLowerCase().includes(q);
    const matchesShop = !shopFilter || l.shop?.name?.toLowerCase().includes(shopFilter.toLowerCase());
    return matchesQ && matchesShop;
  });

  // Unique shop names for the shop filter suggestions
  const shopNames = [...new Set(logs.map((l) => l.shop?.name).filter(Boolean))] as string[];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Global Audit Trail</h1>
        <p className="text-sm text-secondary mt-0.5">
          {logs.length} events logged across all shops.
        </p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter by action, entity, or user…"
            className="field pl-9"
          />
        </div>
        <select
          value={shopFilter}
          onChange={(e) => setShopFilter(e.target.value)}
          className="field"
          style={{ width: "auto", minWidth: "180px" }}
        >
          <option value="">All shops</option>
          {shopNames.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-4"><TableSkeleton rows={8} /></div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-4xl mb-3">📋</p>
            <p className="font-medium">{filter || shopFilter ? "No matching events" : "No audit logs yet"}</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Action</th>
                <th>Entity</th>
                <th>Shop</th>
                <th>Performed by</th>
                <th>IP</th>
                <th>When</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log) => {
                const { bg, text } = actionColor(log.action);
                return (
                  <tr key={log.id}>
                    <td>
                      <span className="badge text-xs font-mono" style={{ background: bg, color: text }}>
                        {log.action}
                      </span>
                    </td>
                    <td className="text-sm">
                      <span className="font-medium">{log.entity}</span>
                      {log.entityId && (
                        <span className="text-xs text-muted ml-1.5 font-mono">
                          {log.entityId.slice(0, 8)}…
                        </span>
                      )}
                    </td>
                    <td className="text-sm text-secondary">
                      {log.shop?.name ?? <span className="text-muted">Platform</span>}
                    </td>
                    <td className="text-sm">
                      <p className="font-medium">{log.user?.fullName ?? "System"}</p>
                      {log.user?.email && (
                        <p className="text-xs text-muted">{log.user.email}</p>
                      )}
                    </td>
                    <td className="text-muted text-xs font-mono">{log.ipAddress ?? "—"}</td>
                    <td className="text-muted text-xs whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
