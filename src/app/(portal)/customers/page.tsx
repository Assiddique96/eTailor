"use client";
import { useState, useCallback, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { Modal } from "@/components/ui/modal";

type Customer = {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  gender?: "MALE" | "FEMALE" | "OTHER" | null;
  createdAt: string;
  _count: { jobs: number; invoices: number };
  jobs: Array<{ createdAt: string }>;
};

const GENDER_LABEL: Record<string, string> = {
  MALE: "Male", FEMALE: "Female", OTHER: "Other",
};
const GENDER_ICON: Record<string, string> = {
  MALE: "♂", FEMALE: "♀", OTHER: "⚧",
};

const DEFAULT_FIELDS = {
  firstName: "", lastName: "",
  gender: "" as "" | "MALE" | "FEMALE" | "OTHER",
  phone: "", email: "", notes: "",
};

export default function CustomersPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [query, setQuery]         = useState("");
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fields, setFields]       = useState(DEFAULT_FIELDS);
  const [errors, setErrors]       = useState<Record<string, string>>({});
  const url = `/api/customers${query ? `?q=${encodeURIComponent(query)}` : ""}`;
  const { data, isLoading, mutate } = useSWR<{ customers: Customer[]; total: number }>(url, fetcher);
  const customers = data?.customers ?? [];

  function field<K extends keyof typeof DEFAULT_FIELDS>(name: K) {
    return {
      value: fields[name],
      onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setFields((f) => ({ ...f, [name]: e.target.value })),
    };
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!fields.firstName.trim()) e.firstName = "First name is required.";
    if (!fields.lastName.trim())  e.lastName  = "Last name is required.";
    if (!fields.gender)           e.gender    = "Gender is required for accurate measurements.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  const closeModal = useCallback(() => {
    setShowModal(false);
    setFields(DEFAULT_FIELDS);
    setErrors({});
  }, []);

  async function handleCreate() {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const body = Object.fromEntries(
        Object.entries(fields).filter(([, v]) => v !== "")
      );
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        toast(err.error ?? "Failed to create customer.", "error");
        return;
      }
      const { customer } = await res.json();
      toast("Customer created.");
      mutate();
      closeModal();
    } catch {
      toast("Network error.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Customers"
        subtitle={data ? `${data.total} total` : undefined}
        actions={
          <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
            + Add customer
          </button>
        }
      />

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" width="15" height="15"
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, phone, email…"
          className="field pl-9"
          aria-label="Search customers"
        />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-4"><TableSkeleton /></div>
        ) : customers.length === 0 ? (
          <EmptyState
            icon="👥"
            title={query ? "No customers match your search" : "No customers yet"}
            description={query ? "Try a different search term." : "Add your first customer above."}
          />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Gender</th>
                <th>Phone</th>
                <th style={{ textAlign: "center" }}>Jobs</th>
                <th>Added on</th>
                <th>Last job</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => {
                const lastJobDate = c.jobs[0]?.createdAt
                  ? new Date(c.jobs[0].createdAt).toLocaleDateString()
                  : "—";
                return (
                  <tr
                    key={c.id}
                    onClick={() => router.push(`/customers/${c.id}`)}
                    className="group cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium shrink-0"
                          style={{ background: "var(--brand-light)", color: "var(--brand)" }}
                          aria-hidden
                        >
                          {c.firstName[0]}{c.lastName[0]}
                        </div>
                        <div>
                          <div className="font-medium">{c.firstName} {c.lastName}</div>
                          {c.email && (
                            <div className="text-xs" style={{ color: "var(--text-muted)" }}>{c.email}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      {c.gender ? (
                        <span
                          className="badge text-xs"
                          style={{
                            background: c.gender === "MALE"   ? "var(--info-light)"   :
                                        c.gender === "FEMALE" ? "var(--purple-light)"  : "var(--bg-base)",
                            color:      c.gender === "MALE"   ? "var(--info)"          :
                                        c.gender === "FEMALE" ? "var(--purple)"        : "var(--text-muted)",
                          }}
                        >
                          {GENDER_ICON[c.gender]} {GENDER_LABEL[c.gender]}
                        </span>
                      ) : <span className="text-muted text-xs">—</span>}
                    </td>
                    <td className="text-sm" style={{ color: "var(--text-secondary)" }}>
                      {c.phone || "—"}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span
                        className="badge text-xs"
                        style={{ background: "var(--bg-base)", color: "var(--text-secondary)" }}
                      >
                        {c._count.jobs}
                      </span>
                    </td>
                    <td className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                    <td className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {lastJobDate}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add customer modal */}
      <Modal
        open={showModal}
        onClose={closeModal}
        title="New customer"
        footer={
          <>
            <button className="btn btn-ghost btn-sm" onClick={closeModal} disabled={submitting}>
              Cancel
            </button>
            <button className="btn btn-primary btn-sm" onClick={handleCreate} disabled={submitting}>
              {submitting ? "Saving…" : "Create customer"}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-medium text-secondary">First name *</label>
            <input className="field" {...field("firstName")} />
            {errors.firstName && <p className="text-xs text-danger">{errors.firstName}</p>}
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-secondary">Last name *</label>
            <input className="field" {...field("lastName")} />
            {errors.lastName && <p className="text-xs text-danger">{errors.lastName}</p>}
          </div>

          <div className="space-y-1 sm:col-span-2">
            <label className="text-xs font-medium text-secondary">
              Gender * <span className="text-muted font-normal">(determines measurement fields)</span>
            </label>
            <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Gender">
              {(["MALE", "FEMALE", "OTHER"] as const).map((g) => (
                <button
                  key={g} type="button" role="radio"
                  aria-checked={fields.gender === g}
                  onClick={() => setFields((f) => ({ ...f, gender: g }))}
                  className="py-2.5 px-3 rounded-lg border text-sm font-medium transition-colors"
                  style={{
                    borderColor: fields.gender === g ? "var(--brand)" : "var(--border)",
                    background:  fields.gender === g ? "var(--brand-light)" : "var(--bg-card)",
                    color:       fields.gender === g ? "var(--brand)" : "var(--text-secondary)",
                  }}
                >
                  {GENDER_ICON[g]} {GENDER_LABEL[g]}
                </button>
              ))}
            </div>
            {errors.gender && <p className="text-xs text-danger mt-1">{errors.gender}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-secondary">Phone</label>
            <input type="tel" className="field" {...field("phone")} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-secondary">Email</label>
            <input type="email" className="field" {...field("email")} />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <label className="text-xs font-medium text-secondary">Notes</label>
            <input className="field" placeholder="Fit preferences, fabric sensitivities…" {...field("notes")} />
          </div>
        </div>
      </Modal>
    </div>
  );
}




