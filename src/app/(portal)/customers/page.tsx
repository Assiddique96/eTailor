"use client";
import { FormEvent, useEffect, useState, useRef } from "react";
import Link from "next/link";
import { TableSkeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";

type Customer = {
  id: string; firstName: string; lastName: string;
  phone?: string; email?: string; preferredStyle?: string; createdAt: string;
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const { toast } = useToast();

  async function load(q = "") {
    try {
      const res = await fetch(`/api/customers${q ? `?q=${encodeURIComponent(q)}` : ""}`);
      if (!res.ok) return;
      const data = await res.json();
      setCustomers(data.customers ?? []);
    } catch (e) {
      console.error("Failed to load customers:", e);
    }
  }

  useEffect(() => { load().finally(() => setLoading(false)); }, []);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => load(query), 350);
    return () => clearTimeout(t);
  }, [query]);

  async function onCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const formData = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(formData)),
      });
      if (!res.ok) {
        const err = await res.json();
        toast(err.error || "Failed to create customer.", "error");
        return;
      }
      toast("Customer created successfully.");
      formRef.current?.reset();
      setShowForm(false);
      await load(query);
    } catch {
      toast("Network error.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  const filtered = customers.filter((c) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return `${c.firstName} ${c.lastName} ${c.phone} ${c.email}`.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
          <p className="text-sm text-secondary mt-0.5">{customers.length} total customers</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm((v) => !v)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add customer
        </button>
      </div>

      {/* Add customer form */}
      {showForm && (
        <div className="card p-5">
          <h2 className="font-medium mb-4">New customer</h2>
          <form ref={formRef} onSubmit={onCreate} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-secondary">First name *</label>
              <input name="firstName" required className="field" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-secondary">Last name *</label>
              <input name="lastName" required className="field" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-secondary">Phone</label>
              <input name="phone" type="tel" className="field" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-secondary">Email</label>
              <input name="email" type="email" className="field" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-secondary">Preferred style</label>
              <input name="preferredStyle" placeholder="e.g. Classic, Modern" className="field" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-secondary">Notes</label>
              <input name="notes" className="field" />
            </div>
            <div className="sm:col-span-2 lg:col-span-3 flex gap-2 justify-end pt-1">
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
                {submitting ? "Saving…" : "Create customer"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, phone, email…"
          className="field pl-9"
        />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-4"><TableSkeleton /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-4xl mb-3">👥</div>
            <p className="font-medium">{query ? "No customers match your search" : "No customers yet"}</p>
            <p className="text-sm text-secondary mt-1">{query ? "Try a different search term." : "Add your first customer above."}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Contact</th>
                  <th>Style preference</th>
                  <th>Added</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 flex items-center justify-center text-xs font-medium flex-shrink-0">
                          {c.firstName[0]}{c.lastName[0]}
                        </div>
                        <span className="font-medium">{c.firstName} {c.lastName}</span>
                      </div>
                    </td>
                    <td className="text-secondary text-sm">
                      <div>{c.phone || "—"}</div>
                      {c.email && <div className="text-xs text-muted">{c.email}</div>}
                    </td>
                    <td className="text-secondary text-sm">{c.preferredStyle || "—"}</td>
                    <td className="text-muted text-xs">{new Date(c.createdAt).toLocaleDateString()}</td>
                    <td>
                      <Link href={`/customers/${c.id}`} className="btn btn-ghost btn-sm">
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
