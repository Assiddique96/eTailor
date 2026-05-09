"use client";

import { FormEvent, useEffect, useState } from "react";

type Job = {
  id: string;
  title: string;
  status: string;
  dueDate: string;
  customer: { firstName: string; lastName: string };
};

type Customer = { id: string; firstName: string; lastName: string };

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  async function load() {
    const [jobsRes, customersRes] = await Promise.all([fetch("/api/jobs"), fetch("/api/customers")]);
    const jobsData = await jobsRes.json();
    const customersData = await customersRes.json();
    setJobs(jobsData.jobs ?? []);
    setCustomers(customersData.customers ?? []);
  }

  useEffect(() => {
    Promise.all([fetch("/api/jobs"), fetch("/api/customers")])
      .then(async ([jobsRes, customersRes]) => {
        const jobsData = await jobsRes.json();
        const customersData = await customersRes.json();
        setJobs(jobsData.jobs ?? []);
        setCustomers(customersData.customers ?? []);
      });
  }, []);

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId: formData.get("customerId"),
        title: formData.get("title"),
        dueDate: formData.get("dueDate"),
        description: formData.get("description"),
      }),
    });
    event.currentTarget.reset();
    await load();
  }

  async function updateStatus(jobId: string, status: string) {
    await fetch(`/api/jobs/${jobId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await load();
  }

  const workflowColumns = [
    "PENDING",
    "IN_PROGRESS",
    "READY_FOR_FITTING",
    "COMPLETED",
    "DELIVERED",
  ];

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-semibold">Jobs</h2>
      <form onSubmit={onCreate} className="grid gap-2 rounded-xl border border-zinc-200 bg-white p-4 md:grid-cols-2 dark:border-zinc-800 dark:bg-zinc-900">
        <select name="customerId" required className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950">
          <option value="">Select Customer</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.firstName} {c.lastName}
            </option>
          ))}
        </select>
        <input name="title" placeholder="Job title" required className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950" />
        <input type="date" name="dueDate" required className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950" />
        <input name="description" placeholder="Description" className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950" />
        <button className="rounded-md bg-zinc-900 px-3 py-2 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900">Create Job</button>
      </form>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {workflowColumns.map((status) => (
          <div key={status} className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="mb-2 text-sm font-semibold">{status.replaceAll("_", " ")}</h3>
            <div className="space-y-2">
              {jobs
                .filter((job) => job.status === status)
                .map((job) => (
                  <div key={job.id} className="rounded-md border border-zinc-200 p-2 text-xs dark:border-zinc-700">
                    <p className="font-medium">{job.title}</p>
                    <p className="text-zinc-500 dark:text-zinc-400">
                      {job.customer.firstName} {job.customer.lastName}
                    </p>
                    <p className="mb-2 text-zinc-500 dark:text-zinc-400">
                      Due {new Date(job.dueDate).toLocaleDateString()}
                    </p>
                    <select
                      defaultValue={job.status}
                      onChange={(e) => updateStatus(job.id, e.target.value)}
                      className="w-full rounded-md border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-950"
                    >
                      {["PENDING", "IN_PROGRESS", "READY_FOR_FITTING", "COMPLETED", "DELIVERED", "CANCELLED"].map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
