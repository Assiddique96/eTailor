"use client";
import { use, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { TableSkeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { MeasurementPanel } from "@/components/customers/measurement-panel";
import { StylePanel } from "@/components/customers/style-panel";
import { RemoteLinkPanel } from "@/components/customers/remote-link-panel";
import { CreateJobModal } from "@/components/jobs/create-job-modal";
import InvoiceForm from "@/components/invoices/invoice-form";
import type { Gender } from "@/lib/measurement-fields";

type MeasurementLink = {
  id: string; token: string; url: string;
  gender: Gender; expiresAt: string; usedAt: string | null;
  active: boolean; expired: boolean;
};

type CustomerDetails = {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  gender?: Gender | null;
  preferredStyle?: string;
  notes?: string;
  measurements: Array<{ id: string; recordedAt: string; recordedBy?: string | null; [key: string]: unknown }>;
  jobs: Array<{ id: string; title: string; status: string; dueDate: string; trackingCode?: string | null; priority?: string | null }>;
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    total: string;
    paymentStatus: string;
    issuedAt?: string | null;
    dueAt?: string | null;
    jobId?: string | null;
    lines?: Array<{ id: string; description: string; quantity: number; unitPrice: number; amount: number }>;
  }>;
  measurementLinks: MeasurementLink[];
  shopId?: string;
  styleProfile?: { selectionMode: string | null } | null;
};

const GENDER_LABEL: Record<string, string> = { MALE: "Male", FEMALE: "Female", OTHER: "Other" };

export default function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const { data, isLoading, mutate } = useSWR<{ customer: CustomerDetails }>(
    `/api/customers/${id}`,
    fetcher
  );

  const customer = data?.customer;

  if (isLoading) return <div className="space-y-4"><TableSkeleton rows={4} /></div>;
  if (!customer) return <p className="text-secondary">Customer not found.</p>;

  const TABS = [
    { id: "measurements", label: "Measurements", count: customer.measurements.length },
    { id: "styles",       label: "Style",        count: customer.styleProfile ? 1 : 0 },
    { id: "jobs",         label: "Jobs",         count: customer.jobs.length },
    { id: "invoices",     label: "Invoices",     count: customer.invoices.length },
  ] as const;

  

  return (
    <CustomerDetailView
      customer={customer}
      tabs={TABS}
      onMutate={() => mutate()}
    />
  );
}

// ─── Inner view component keeps hooks at the top level ───────────────────────
function CustomerDetailView({
  customer,
  tabs,
  onMutate,
}: {
  customer: CustomerDetails;
  tabs: readonly { id: string; label: string; count: number }[];
  onMutate: () => void;
}) {
  const [activeTab, setActiveTab] = useState<string>("measurements");
  const [jobSearch, setJobSearch] = useState("");
  const [showCreateJob, setShowCreateJob] = useState(false);
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);
  

  const activeLinks = customer.measurementLinks.filter((l) => l.active);

  const PRIORITY_LABELS: Record<string, string> = {
    URGENT: "Urgent",
    HIGH: "High",
    NORMAL: "Normal",
    LOW: "Low",
    MINIMAL: "Minimal",
  };

  const jobById: Record<string, string> = customer.jobs.reduce((acc, j) => {
    acc[j.id] = j.title;
    return acc;
  }, {} as Record<string, string>);

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <Link href="/customers" className="text-sm text-muted hover:text-secondary inline-flex items-center gap-1">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M19 12H5m7-7-7 7 7 7"/>
        </svg>
        Customers
      </Link>

      {/* Profile card */}
      <div className="card p-5">
        <div className="flex items-start gap-4">
          <div
            className="h-14 w-14 rounded-2xl flex items-center justify-center text-xl font-semibold shrink-0"
            style={{ background: "var(--brand-light)", color: "var(--brand)" }}
            aria-hidden
          >
            {customer.firstName[0]}{customer.lastName[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-semibold">
                {customer.firstName} {customer.lastName}
              </h1>
              {customer.gender && (
                <span
                  className="badge text-xs"
                  style={{
                    background: customer.gender === "MALE"   ? "var(--info-light)"   :
                                customer.gender === "FEMALE" ? "var(--purple-light)" : "var(--bg-base)",
                    color:      customer.gender === "MALE"   ? "var(--info)"         :
                                customer.gender === "FEMALE" ? "var(--purple)"       : "var(--text-muted)",
                  }}
                >
                  {GENDER_LABEL[customer.gender]}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-sm text-secondary">
              {customer.phone && (
                <span className="flex items-center gap-1">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  {customer.phone}
                </span>
              )}
              {customer.email && (
                <span className="flex items-center gap-1">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  {customer.email}
                </span>
              )}
              {customer.preferredStyle && (
                <span className="flex items-center gap-1">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                  {customer.preferredStyle}
                </span>
              )}
            </div>
            {customer.notes && (
              <p
                className="mt-2 text-sm text-muted rounded-lg px-3 py-2"
                style={{ background: "var(--bg-base)" }}
              >
                {customer.notes}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div
        className="flex gap-1 border-b"
        style={{ borderColor: "var(--border)" }}
        role="tablist"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === tab.id
                ? "border-indigo-500 text-brand"
                : "border-transparent text-secondary hover:text-primary"
            }`}
          >
            {tab.label}
            <span
              className="ml-1.5 text-xs rounded-full px-1.5 py-0.5"
              style={{ background: "var(--bg-base)", color: "var(--text-muted)" }}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── Measurements tab ── */}
      {activeTab === "measurements" && (
        <div className="space-y-4">
          <RemoteLinkPanel
            customerId={customer.id}
            customerName={`${customer.firstName} ${customer.lastName}`}
            customerEmail={customer.email}
            gender={customer.gender ?? null}
            activeLinks={activeLinks}
            onCreated={onMutate}
          />
          <MeasurementPanel
            customerId={customer.id}
            gender={customer.gender ?? null}
            records={customer.measurements}
            onSaved={onMutate}
          />
        </div>
      )}


      {/* ── Styles tab ── */}
      {activeTab === "styles" && (
        <StylePanel customerId={customer.id} shopId={customer.shopId ?? ""} />
      )}

      {/* ── Jobs tab ── */}
      {activeTab === "jobs" && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <input
              value={jobSearch}
              onChange={(e) => setJobSearch(e.target.value)}
              placeholder="Search jobs by title or status…"
              className="field max-w-md"
              aria-label="Search jobs"
            />
            <button className="btn btn-primary btn-sm" onClick={() => setShowCreateJob(true)}>
              + Add job
            </button>
          </div>

          <div className="card overflow-hidden">
            {customer.jobs.filter((job) =>
              job.title.toLowerCase().includes(jobSearch.toLowerCase()) ||
              job.status.toLowerCase().includes(jobSearch.toLowerCase())
            ).length === 0 ? (
              <p className="text-center text-secondary py-10 text-sm">
                {jobSearch ? "No matching jobs found." : "No jobs for this customer."}
              </p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr><th>Title</th><th>Tracking ID</th><th>Status</th><th>Priority</th><th>Due date</th></tr>
                </thead>
                <tbody>
                  {customer.jobs
                    .filter((job) =>
                      job.title.toLowerCase().includes(jobSearch.toLowerCase()) ||
                      job.status.toLowerCase().includes(jobSearch.toLowerCase()) ||
                      (job.trackingCode ?? "").toLowerCase().includes(jobSearch.toLowerCase()) ||
                      String(job.priority ?? "").toLowerCase().includes(jobSearch.toLowerCase())
                    )
                    .map((j) => (
                      <tr key={j.id}>
                        <td className="font-medium">{j.title}</td>
                        <td className="text-xs text-secondary">{j.trackingCode ?? "Not set"}</td>
                        <td><StatusBadge status={j.status} /></td>
                        <td className="text-sm text-secondary">{j.priority ? (PRIORITY_LABELS[String(j.priority).toUpperCase()] ?? j.priority) : "—"}</td>
                        <td className="text-secondary text-sm">{j.dueDate ? new Date(j.dueDate).toLocaleDateString() : "—"}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── Invoices tab ── */}
      {activeTab === "invoices" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button className="btn btn-primary btn-sm" onClick={() => setShowCreateInvoice(true)}>
              + New invoice
            </button>
          </div>

          <div className="card overflow-hidden">
            {customer.invoices.length === 0 ? (
              <p className="text-center text-secondary py-10 text-sm">No invoices for this customer.</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Issued</th>
                    <th>Due</th>
                    <th>Job</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {customer.invoices.map((i) => (
                    <tr key={i.id}>
                      <td className="font-medium font-mono text-sm">{i.invoiceNumber}</td>
                      <td>${Number(i.total).toFixed(2)}</td>
                      <td><StatusBadge status={i.paymentStatus} /></td>
                      <td className="text-secondary text-sm">{i.issuedAt ? new Date(i.issuedAt).toLocaleDateString() : "—"}</td>
                      <td className="text-secondary text-sm">{i.dueAt ? new Date(i.dueAt).toLocaleDateString() : "—"}</td>
                      <td className="text-secondary text-sm">{i.jobId ? jobById[i.jobId] ?? i.jobId : "—"}</td>
                      <td>
                        <div className="flex gap-1">
                          <a
                            href={`/api/invoices/${i.id}/pdf`}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-ghost btn-sm"
                          >
                            PDF
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      <CreateJobModal
        open={showCreateJob}
        onClose={() => setShowCreateJob(false)}
        customers={[{ id: customer.id, firstName: customer.firstName, lastName: customer.lastName }]}
        onCreated={() => {
          onMutate();
          setShowCreateJob(false);
        }}
        defaultCustomerId={customer.id}
      />

      <CreateCustomerInvoiceModal
        open={showCreateInvoice}
        onClose={() => setShowCreateInvoice(false)}
        customerId={customer.id}
        onCreated={() => {
          onMutate();
          setShowCreateInvoice(false);
        }}
      />
    </div>
  );
}

function CreateCustomerInvoiceModal({
  open,
  onClose,
  customerId,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  customerId: string;
  onCreated: () => void;
}) {
  const { toast } = useToast();
  const [creating, setCreating] = useState(false);

  async function handleSubmit(invoiceData: unknown) {
    setCreating(true);
    try {
      const data = invoiceData as {
        jobId?: string;
        lineItems: Array<{ description: string; quantity: number; unitPrice: number }>;
        discount?: number;
        tax?: number;
        dueAt?: Date | null;
        notes?: string;
        subtotal?: number;
        total?: number;
      };

      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          jobId: data.jobId || undefined,
          lines: data.lineItems.map((line) => ({
            description: line.description,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
          })),
          discount: data.discount,
          tax: data.tax,
          dueAt: data.dueAt ? data.dueAt.toISOString() : undefined,
          notes: data.notes,
          subtotal: data.subtotal,
          total: data.total,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast(err.error ?? "Failed to create invoice.", "error");
        return;
      }
      toast("Invoice created.");
      onCreated();
      onClose();
    } catch {
      toast("Network error.", "error");
    } finally {
      setCreating(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create invoice"
      footer={null}
    >
      <InvoiceForm
        customerId={customerId}
        onCancel={onClose}
        onSubmit={handleSubmit}
        isLoading={creating}
      />
    </Modal>
  );
}




