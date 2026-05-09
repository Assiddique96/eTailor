"use client";
import { useEffect, useState } from "react";
import { TableSkeleton } from "@/components/ui/skeleton";

type Log = {
  id: string; action: string; entity: string; entityId?: string;
  createdAt: string; ipAddress?: string;
  user?: { fullName: string; email: string };
  shop?: { name: string };
};

const ACTION_COLOR: Record<string, { bg: string; text: string }> = {
  CREATED:  { bg: "var(--success-light)", text: "var(--success)" },
  UPDATED:  { bg: "var(--info-light)",    text: "var(--info)" },
  DELETED:  { bg: "var(--danger-light)",  text: "var(--danger)" },
  PAYMENT:  { bg: "var(--warning-light)", text: "var(--warning)" },
};

function actionColor(action: string) {
  for (const [key, val] of Object.entries(ACTION_COLOR)) {
    if (action.includes(key)) return val;
  }
  return { bg: "var(--bg-base)", text: "var(--text-muted)" };
}

export default function AuditPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    fetch("/api/audit")
      .then((r) => r.json())
      .then((d) => setLogs(d.logs ?? []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = logs.filter((l) => {
    if (!filter) return true;
    const q = filter.toLowerCase();
    return `${l.action} ${l.entity} ${l.user?.fullName} ${l.user?.email}`.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Audit Trail</h1>
        <p className="text-sm text-secondary mt-0.5">
          {logs.length} events recorded.
        </p>
      </div>

      <div className="relative">
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

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-4"><TableSkeleton rows={6} /></div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-4xl mb-3">📋</p>
            <p className="font-medium">{filter ? "No matching events" : "No audit logs yet"}</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>Action</th><th>Entity</th><th>Performed by</th><th>IP</th><th>When</th></tr>
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
                        <span className="text-xs text-muted ml-1.5 font-mono">{log.entityId.slice(0, 8)}…</span>
                      )}
                    </td>
                    <td className="text-sm">
                      <p className="font-medium">{log.user?.fullName ?? "System"}</p>
                      {log.user?.email && <p className="text-xs text-muted">{log.user.email}</p>}
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
