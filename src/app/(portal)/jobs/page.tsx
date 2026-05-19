"use client";
import { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { useToast } from "@/components/ui/toast";
import { PageHeader } from "@/components/ui/page-header";
import { TableSkeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/badge";
import { JobBoard } from "@/components/jobs/job-board";
import { JobTable } from "@/components/jobs/job-table";
import { CreateJobModal } from "@/components/jobs/create-job-modal";
import { JobComments } from "@/components/jobs/job-comments";
import { JobMaterials } from "@/components/jobs/job-materials";
import { formatCurrency } from "@/lib/currency";
import type { Job, Customer } from "@/components/jobs/job-types";

type DrawerTab = "comments" | "materials";

export default function JobsPage() {
  const { toast } = useToast();
  const [view, setView]           = useState<"board" | "list">("board");
  const [showCreate, setShowCreate] = useState(false);
  const [drawerJob, setDrawerJob] = useState<Job | null>(null);
  const [drawerTab, setDrawerTab] = useState<DrawerTab>("comments");

  const { data: jobsData, isLoading: jobsLoading, mutate: mutateJobs } =
    useSWR<{ jobs: Job[] }>("/api/jobs", fetcher);

  const { data: customersData } =
    useSWR<{ customers: Customer[] }>("/api/customers", fetcher);

  const jobs      = jobsData?.jobs      ?? [];
  const customers = customersData?.customers ?? [];

  async function updateStatus(jobId: string, status: string) {
    await mutateJobs(
      (prev) => prev ? { ...prev, jobs: prev.jobs.map((j) => j.id === jobId ? { ...j, status } : j) } : prev,
      false
    );
    const res = await fetch(`/api/jobs/${jobId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) { toast("Failed to update status.", "error"); mutateJobs(); }
  }

  function openDrawer(job: Job, tab: DrawerTab = "comments") {
    setDrawerJob(job);
    setDrawerTab(tab);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Jobs"
        subtitle={`${jobs.length} total`}
        actions={
          <>
            <div
              className="flex rounded-lg border overflow-hidden text-xs font-medium"
              style={{ borderColor: "var(--border)" }}
              role="group" aria-label="View mode"
            >
              {(["board", "list"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  aria-pressed={view === v}
                  className={`px-3 py-1.5 capitalize transition-colors ${
                    view === v ? "text-white bg-indigo-600" : "text-secondary hover:text-primary"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>
              + New job
            </button>
          </>
        }
      />

      {jobsLoading ? (
        <div className="p-4"><TableSkeleton /></div>
      ) : view === "board" ? (
        <JobBoard jobs={jobs} onStatusChange={updateStatus} onJobClick={(j) => openDrawer(j)} />
      ) : (
        <JobTable jobs={jobs} onStatusChange={updateStatus} onJobClick={(j) => openDrawer(j)} />
      )}

      <CreateJobModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        customers={customers}
        onCreated={() => mutateJobs()}
      />

      {/* ── Job detail drawer ── */}
      {drawerJob && (
        <div className="fixed inset-0 z-40 flex items-stretch justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setDrawerJob(null)}
            aria-hidden
          />
          {/* Drawer */}
          <div
            className="relative w-full max-w-md flex flex-col shadow-2xl"
            style={{ background: "var(--bg-card)", borderLeft: "1px solid var(--border)" }}
            role="dialog"
            aria-label={`Job: ${drawerJob.title}`}
          >
            {/* Header */}
            <div
              className="flex items-start justify-between gap-3 px-5 py-4 border-b"
              style={{ borderColor: "var(--border)" }}
            >
              <div>
                <h2 className="font-semibold">{drawerJob.title}</h2>
                <p className="text-xs text-secondary mt-0.5">
                  {drawerJob.customer.firstName} {drawerJob.customer.lastName}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={drawerJob.status} />
                <button
                  onClick={() => setDrawerJob(null)}
                  className="p-1.5 rounded-lg text-muted hover:text-primary transition-colors"
                  aria-label="Close"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Deposit badge */}
            {(drawerJob as Job & { depositAmount?: number; depositPaidAt?: string }).depositAmount && (
              <div
                className="mx-5 mt-3 px-3 py-2 rounded-lg text-sm flex items-center justify-between"
                style={{ background: "var(--warn-light)", color: "var(--warn)" }}
              >
                <span>Deposit: {formatCurrency((drawerJob as Job & { depositAmount: number }).depositAmount)}</span>
                <span className="text-xs font-medium">
                  {(drawerJob as Job & { depositPaidAt?: string }).depositPaidAt ? "✓ Paid" : "Pending"}
                </span>
              </div>
            )}

            {/* Tabs */}
            <div className="flex border-b" style={{ borderColor: "var(--border)" }} role="tablist">
              {(["comments", "materials"] as const).map((t) => (
                <button
                  key={t}
                  role="tab"
                  aria-selected={drawerTab === t}
                  onClick={() => setDrawerTab(t)}
                  className={`flex-1 py-2.5 text-sm font-medium capitalize border-b-2 transition-colors -mb-px ${
                    drawerTab === t ? "border-indigo-500 text-brand" : "border-transparent text-secondary hover:text-primary"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto p-5">
              {drawerTab === "comments" && <JobComments jobId={drawerJob.id} />}
              {drawerTab === "materials" && <JobMaterials jobId={drawerJob.id} />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
