"use client";

import { FormEvent, useEffect, useState } from "react";

type CustomerDetails = {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string;
  preferredStyle?: string;
  measurements: Array<{ id: string; recordedAt: string; chestCm?: string; waistCm?: string; sleeveCm?: string }>;
  jobs: Array<{ id: string; title: string; status: string; dueDate: string }>;
  invoices: Array<{ id: string; invoiceNumber: string; total: string; paymentStatus: string }>;
  messages: Array<{ id: string; message: string; channel: string; sentAt: string }>;
};

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [customer, setCustomer] = useState<CustomerDetails | null>(null);
  const [customerId, setCustomerId] = useState<string>("");

  async function load(id: string) {
    const res = await fetch(`/api/customers/${id}`);
    const data = await res.json();
    setCustomer(data.customer ?? null);
  }

  useEffect(() => {
    params.then(({ id }) => {
      setCustomerId(id);
      return load(id);
    });
  }, [params]);

  async function onAddMeasurement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!customerId) return;
    const formData = new FormData(event.currentTarget);
    await fetch("/api/measurements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId,
        chestCm: Number(formData.get("chestCm") || 0) || undefined,
        waistCm: Number(formData.get("waistCm") || 0) || undefined,
        sleeveCm: Number(formData.get("sleeveCm") || 0) || undefined,
      }),
    });
    event.currentTarget.reset();
    await load(customerId);
  }

  if (!customer) return <p className="text-sm text-zinc-500">Loading customer details...</p>;

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-semibold">
        {customer.firstName} {customer.lastName}
      </h2>
      <p className="text-sm text-zinc-600 dark:text-zinc-300">
        {customer.phone || "No phone"} | Preferred style: {customer.preferredStyle || "Not set"}
      </p>

      <form onSubmit={onAddMeasurement} className="grid gap-2 rounded-xl border border-zinc-200 bg-white p-4 md:grid-cols-3 dark:border-zinc-800 dark:bg-zinc-900">
        <input name="chestCm" type="number" step="0.01" placeholder="Chest (cm)" className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950" />
        <input name="waistCm" type="number" step="0.01" placeholder="Waist (cm)" className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950" />
        <input name="sleeveCm" type="number" step="0.01" placeholder="Sleeve (cm)" className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950" />
        <button className="rounded-md bg-zinc-900 px-3 py-2 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900">Add Measurement</button>
      </form>

      <section className="space-y-2">
        <h3 className="text-lg font-semibold">Measurements</h3>
        {customer.measurements.map((m) => (
          <div key={m.id} className="rounded-lg border border-zinc-200 bg-white p-3 text-sm dark:border-zinc-800 dark:bg-zinc-900">
            {new Date(m.recordedAt).toLocaleString()} | Chest: {m.chestCm || "-"} | Waist: {m.waistCm || "-"} | Sleeve: {m.sleeveCm || "-"}
          </div>
        ))}
      </section>

      <section className="space-y-2">
        <h3 className="text-lg font-semibold">Jobs</h3>
        {customer.jobs.map((j) => (
          <div key={j.id} className="rounded-lg border border-zinc-200 bg-white p-3 text-sm dark:border-zinc-800 dark:bg-zinc-900">
            {j.title} | {j.status} | Due {new Date(j.dueDate).toLocaleDateString()}
          </div>
        ))}
      </section>
    </div>
  );
}
