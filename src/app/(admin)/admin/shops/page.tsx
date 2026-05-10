"use client";
import { useEffect, useState } from "react";
import { TableSkeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";

type Shop = {
  id: string; name: string; slug: string; isActive: boolean;
  email?: string; phone?: string; createdAt: string;
  _count: { customers: number; jobs: number; users: number; invoices: number };
};

export default function AdminShopsPage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { toast } = useToast();

  async function load(q = "") {
    const res = await fetch(`/api/admin/shops${q ? `?q=${encodeURIComponent(q)}` : ""}`);
    const data = await res.json();
    setShops(data.shops ?? []);
  }

  useEffect(() => { load().finally(() => setLoading(false)); }, []);

  useEffect(() => {
    const t = setTimeout(() => load(query), 350);
    return () => clearTimeout(t);
  }, [query]);

  async function toggleShop(shopId: string, isActive: boolean) {
    setActionLoading(shopId);
    try {
      const res = await fetch("/api/admin/shops", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId, isActive }),
      });
      if (!res.ok) { toast("Failed to update shop.", "error"); return; }
      toast(`Shop ${isActive ? "activated" : "suspended"}.`);
      setShops((prev) => prev.map((s) => s.id === shopId ? { ...s, isActive } : s));
    } catch { toast("Network error.", "error"); }
    finally { setActionLoading(null); }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Shops</h1>
        <p className="text-sm text-secondary mt-0.5">{shops.length} shops registered on the platform.</p>
      </div>

      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by shop name or slug…" className="field pl-9" />
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-4"><TableSkeleton /></div>
        ) : shops.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-4xl mb-3">🏪</p>
            <p className="font-medium">No shops found</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>Shop</th><th>Customers</th><th>Jobs</th><th>Users</th><th>Invoices</th><th>Status</th><th>Registered</th><th></th></tr>
            </thead>
            <tbody>
              {shops.map((shop) => (
                <tr key={shop.id}>
                  <td>
                    <p className="font-medium">{shop.name}</p>
                    <p className="text-xs text-muted font-mono">{shop.slug}</p>
                    {shop.email && <p className="text-xs text-muted">{shop.email}</p>}
                  </td>
                  <td className="text-secondary">{shop._count.customers}</td>
                  <td className="text-secondary">{shop._count.jobs}</td>
                  <td className="text-secondary">{shop._count.users}</td>
                  <td className="text-secondary">{shop._count.invoices}</td>
                  <td>
                    <span className={shop.isActive ? "badge badge-completed" : "badge badge-cancelled"}>
                      {shop.isActive ? "Active" : "Suspended"}
                    </span>
                  </td>
                  <td className="text-muted text-xs">{new Date(shop.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button
                      onClick={() => toggleShop(shop.id, !shop.isActive)}
                      disabled={actionLoading === shop.id}
                      className={shop.isActive ? "btn btn-danger btn-sm" : "btn btn-primary btn-sm"}
                    >
                      {actionLoading === shop.id ? "…" : shop.isActive ? "Suspend" : "Activate"}
                    </button>
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
