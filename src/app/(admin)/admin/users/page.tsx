"use client";
import { useEffect, useState } from "react";
import { TableSkeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";

type PlatformUser = {
  id: string; fullName: string; email: string; platformRole: string;
  isActive: boolean; lastLoginAt?: string; createdAt: string;
  shop?: { id: string; name: string; slug: string } | null;
};

const ROLE_CLASS: Record<string, string> = {
  SUPER_ADMIN: "badge",
  SHOP_ADMIN: "badge badge-progress",
  EMPLOYEE: "badge badge-completed",
};

const ROLE_STYLE: Record<string, { background: string; color: string }> = {
  SUPER_ADMIN: { background: "#450a0a", color: "#fca5a5" },
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { toast } = useToast();

  async function load(q = "") {
    const res = await fetch(`/api/admin/users${q ? `?q=${encodeURIComponent(q)}` : ""}`);
    const data = await res.json();
    setUsers(data.users ?? []);
  }

  useEffect(() => { load().finally(() => setLoading(false)); }, []);

  useEffect(() => {
    const t = setTimeout(() => load(query), 350);
    return () => clearTimeout(t);
  }, [query]);

  async function toggleUser(userId: string, isActive: boolean) {
    setActionLoading(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, isActive }),
      });
      const data = await res.json();
      if (!res.ok) { toast(data.error || "Failed.", "error"); return; }
      toast(`User ${isActive ? "activated" : "deactivated"}.`);
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, isActive } : u));
    } catch { toast("Network error.", "error"); }
    finally { setActionLoading(null); }
  }

  const filtered = users.filter((u) => roleFilter === "ALL" || u.platformRole === roleFilter);

  function initials(name: string) {
    return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">All Users</h1>
        <p className="text-sm text-secondary mt-0.5">{users.length} users across the platform.</p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or email…" className="field pl-9" />
        </div>
        <div className="flex rounded-lg border overflow-hidden text-xs font-medium" style={{ borderColor: "var(--border)" }}>
          {["ALL", "SUPER_ADMIN", "SHOP_ADMIN", "EMPLOYEE"].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 transition-colors ${roleFilter === r ? "text-white bg-red-600" : "text-secondary hover:text-primary"}`}
            >
              {r === "ALL" ? "All" : r.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-4"><TableSkeleton /></div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-4xl mb-3">👤</p>
            <p className="font-medium">No users found</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>User</th><th>Role</th><th>Shop</th><th>Last login</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-full bg-stone-200 dark:bg-stone-700 text-xs font-medium text-stone-600 dark:text-stone-300 flex items-center justify-center shrink-0">
                        {initials(u.fullName)}
                      </div>
                      <div>
                        <p className="font-medium">{u.fullName}</p>
                        <p className="text-xs text-muted">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span
                      className={ROLE_CLASS[u.platformRole] ?? "badge"}
                      style={ROLE_STYLE[u.platformRole]}
                    >
                      {u.platformRole.replace("_", " ")}
                    </span>
                  </td>
                  <td className="text-sm">
                    {u.shop ? (
                      <div>
                        <p className="font-medium">{u.shop.name}</p>
                        <p className="text-xs text-muted font-mono">{u.shop.slug}</p>
                      </div>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="text-muted text-xs">
                    {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : "Never"}
                  </td>
                  <td>
                    <span className={u.isActive ? "badge badge-completed" : "badge badge-cancelled"}>
                      {u.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    {u.platformRole !== "SUPER_ADMIN" && (
                      <button
                        onClick={() => toggleUser(u.id, !u.isActive)}
                        disabled={actionLoading === u.id}
                        className={u.isActive ? "btn btn-danger btn-sm" : "btn btn-primary btn-sm"}
                      >
                        {actionLoading === u.id ? "…" : u.isActive ? "Deactivate" : "Activate"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}



