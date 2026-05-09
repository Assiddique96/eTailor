"use client";

import { useEffect, useState } from "react";

type Log = {
  id: string;
  action: string;
  entity: string;
  createdAt: string;
  user?: { fullName: string; email: string };
  shop?: { name: string };
};

export default function AuditPage() {
  const [logs, setLogs] = useState<Log[]>([]);

  useEffect(() => {
    fetch("/api/audit")
      .then((res) => res.json())
      .then((data) => setLogs(data.logs ?? []));
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Audit Trail</h2>
      <div className="space-y-2">
        {logs.map((log) => (
          <div key={log.id} className="rounded-lg border border-zinc-200 bg-white p-3 text-sm dark:border-zinc-800 dark:bg-zinc-900">
            <p className="font-medium">{log.action} on {log.entity}</p>
            <p className="text-zinc-600 dark:text-zinc-300">
              {log.user?.fullName || "System"} | {log.shop?.name || "Platform"} | {new Date(log.createdAt).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
