"use client";
import { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { PageHeader } from "@/components/ui/page-header";
import { TableSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

type Log = {
  id: string; action: string; entity: string; entityId?: string;
  createdAt: string; ipAddress?: string;
  user?: { fullName: string; email: string };
  shop?: { name: string };
};

const ACTION_STYLE: Record<string, { bg: string; text: string }> = {
  CREATED:  { bg: "var(--success-light)", text: "var(--success)" },
  UPDATED:  { bg: "var(--info-light)",    text: "var(--info)" },
  DELETED:  { bg: "var(--danger-light)",  text: "var(--danger)" },
  PAYMENT:  { bg: "var(--warn-light)",    text: "var(--warn)" },
  LOGIN:    { bg: "var(--brand-light)",   text: "var(--brand)" },
};

function actionStyle(action: string) {
  for (const [key, val] of Object.entries(ACTION_STYLE)) {
    if (action.includes(key)) return val;
  }
  return { bg: "var(--bg-base)", text: "var(--text-muted)" };
}

export default function AuditPage() {
  const [filter, setFilter] = useState("");

  const { data, isLoading } = useSWR<{ logs: Log[] }>("/api/audit", fetcher);
  const logs = data?.logs ?? [];

  const filtered = filter
    ? logs.filter((l) => {
        const q = filter.toLowerCase();
        return `${l.action} ${l.entity} ${l.user?.fullName ?? ""} ${l.user?.email ?? ""}`.toLowerCase().includes(q);
      })
    : logs;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Audit Trail"
        subtitle={`${logs.length} events recorded`}
      />

      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" width="15" height="15"
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter by action, entity, or user…"
          className="field pl-9"
          aria-label="Filter audit logs"
        />
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-4"><TableSkeleton rows={6} /></div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="📋"
            title={filter ? "No matching events" : "No audit logs yet"}
          />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Action</th><th>Entity</th><th>Performed by</th>
                <th>IP</th><th>When</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log) => {
                const { bg, text } = actionStyle(log.action);
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
