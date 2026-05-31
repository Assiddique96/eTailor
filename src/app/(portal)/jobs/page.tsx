"use client";
import { useState, useEffect } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { useToast } from "@/components/ui/toast";
import { PageHeader } from "@/components/ui/page-header";
import { TableSkeleton } from "@/components/ui/skeleton";
import { JobBoard } from "@/components/jobs/job-board";
import { JobTable } from "@/components/jobs/job-table";
import { CreateJobModal } from "@/components/jobs/create-job-modal";
import { JobPopup } from "@/components/jobs/job-popup";
import type { Job, Customer } from "@/components/jobs/job-types";

export default function JobsPage() {
  const { toast } = useToast();
  const [view, setView]             = useState<"board" | "list">("board");
  const [showCreate, setShowCreate] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const { data: jobsData, isLoading: jobsLoading, mutate: mutateJobs } =
    useSWR<{ jobs: Job[] }>("/api/jobs", fetcher);

  const { data: customersData } =
    useSWR<{ customers: Customer[] }>("/api/customers", fetcher);

  const jobs      = jobsData?.jobs      ?? [];
  const customers = customersData?.customers ?? [];
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Escape key to close popup
  useEffect(() => {
    if (!selectedJob) return;
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") setSelectedJob(null); };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [selectedJob]);

  async function updateStatus(jobId: string, status: string) {
    // Optimistic update
    await mutateJobs(
      (prev) => prev
        ? { ...prev, jobs: prev.jobs.map((j) => j.id === jobId ? { ...j, status } : j) }
        : prev,
      false
    );
    const res = await fetch(`/api/jobs/${jobId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      toast("Failed to update status.", "error");
      mutateJobs(); // revert
    } else {
      // Keep popup in sync
      if (selectedJob?.id === jobId) {
        setSelectedJob((j) => j ? { ...j, status } : j);
      }
    }
  }

  const normalized = (s: string) => s.trim().toLowerCase();

  const filteredJobs = jobs.filter((j) => {
    if (statusFilter !== "ALL" && j.status !== statusFilter) return false;
    if (!search) return true;
    const q = normalized(search);
    const customerName = `${j.customer.firstName} ${j.customer.lastName}`.toLowerCase();
    return (
      j.title.toLowerCase().includes(q) ||
      (j.trackingCode ?? "").toLowerCase().includes(q) ||
      j.status.toLowerCase().includes(q) ||
      customerName.includes(q) ||
      (j.assignedTo?.fullName ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Jobs"
        subtitle={`${jobs.length} total`}
        actions={
          <div className="flex items-center gap-2">
            <input
              aria-label="Search jobs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search jobs, customer, tracking..."
              className="rounded-md border px-3 py-1 text-sm"
              style={{ borderColor: "var(--border)" }}
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border px-2 py-1 text-sm"
              style={{ borderColor: "var(--border)" }}
            >
              <option value="ALL">All statuses</option>
              {(["PENDING","IN_PROGRESS","READY_FOR_FITTING","COMPLETED","DELIVERED","CANCELLED"] as const).map((s) => (
                <option key={s} value={s}>{s.replaceAll("_"," ")}</option>
              ))}
            </select>
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
          </div>
        }
      />

      {jobsLoading ? (
        <div className="p-4"><TableSkeleton /></div>
      ) : view === "board" ? (
        <JobBoard
          jobs={filteredJobs}
          onStatusChange={updateStatus}
          onJobClick={(j) => setSelectedJob(j)}
        />
      ) : (
        <JobTable
          jobs={filteredJobs}
          onStatusChange={updateStatus}
          onJobClick={(j) => setSelectedJob(j)}
        />
      )}

      <CreateJobModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        customers={customers}
        onCreated={() => mutateJobs()}
      />

      {/* Job detail popup — replaces the side drawer */}
      <JobPopup
        job={selectedJob}
        onClose={() => setSelectedJob(null)}
        onStatusChange={updateStatus}
        onUpdated={() => { mutateJobs(); }}
      />
    </div>
  );
}
