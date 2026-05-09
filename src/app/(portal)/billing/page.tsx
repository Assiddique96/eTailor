"use client";

import { FormEvent, useEffect, useState } from "react";

type Invoice = { id: string; invoiceNumber: string; total: string; paymentStatus: string; customer: { firstName: string; lastName: string } };
type Customer = { id: string; firstName: string; lastName: string };

export default function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  async function load() {
    const [iRes, cRes] = await Promise.all([fetch("/api/invoices"), fetch("/api/customers")]);
    const iData = await iRes.json();
    const cData = await cRes.json();
    setInvoices(iData.invoices ?? []);
    setCustomers(cData.customers ?? []);
  }

  useEffect(() => {
    Promise.all([fetch("/api/invoices"), fetch("/api/customers")])
      .then(async ([iRes, cRes]) => {
        const iData = await iRes.json();
        const cData = await cRes.json();
        setInvoices(iData.invoices ?? []);
        setCustomers(cData.customers ?? []);
      });
  }, []);

  async function onCreateInvoice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const subtotal = Number(formData.get("subtotal") || 0);
    const discount = Number(formData.get("discount") || 0);
    const tax = Number(formData.get("tax") || 0);
    await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId: formData.get("customerId"),
        invoiceNumber: formData.get("invoiceNumber"),
        subtotal,
        discount,
        tax,
      }),
    });
    event.currentTarget.reset();
    await load();
  }

  async function onRecordPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        invoiceId: formData.get("invoiceId"),
        amount: Number(formData.get("amount")),
        method: formData.get("method"),
        reference: formData.get("reference"),
      }),
    });
    event.currentTarget.reset();
    await load();
  }

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-semibold">Billing</h2>

      <form onSubmit={onCreateInvoice} className="grid gap-2 rounded-xl border border-zinc-200 bg-white p-4 md:grid-cols-2 dark:border-zinc-800 dark:bg-zinc-900">
        <select name="customerId" required className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950">
          <option value="">Select Customer</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.firstName} {c.lastName}
            </option>
          ))}
        </select>
        <input name="invoiceNumber" placeholder="Invoice Number" required className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950" />
        <input name="subtotal" type="number" step="0.01" placeholder="Subtotal" required className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950" />
        <input name="discount" type="number" step="0.01" placeholder="Discount" className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950" />
        <input name="tax" type="number" step="0.01" placeholder="Tax" className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950" />
        <button className="rounded-md bg-zinc-900 px-3 py-2 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900">Create Invoice</button>
      </form>

      <form onSubmit={onRecordPayment} className="grid gap-2 rounded-xl border border-zinc-200 bg-white p-4 md:grid-cols-2 dark:border-zinc-800 dark:bg-zinc-900">
        <select name="invoiceId" required className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950">
          <option value="">Select Invoice</option>
          {invoices.map((i) => (
            <option key={i.id} value={i.id}>
              {i.invoiceNumber} ({i.paymentStatus})
            </option>
          ))}
        </select>
        <input name="amount" type="number" step="0.01" placeholder="Amount" required className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950" />
        <input name="method" placeholder="Method (cash, transfer)" required className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950" />
        <input name="reference" placeholder="Reference" className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950" />
        <button className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700">Record Payment</button>
      </form>

      <div className="space-y-2">
        {invoices.map((i) => (
          <div key={i.id} className="rounded-lg border border-zinc-200 bg-white p-3 text-sm dark:border-zinc-800 dark:bg-zinc-900">
            <p className="font-medium">{i.invoiceNumber} - ${Number(i.total).toFixed(2)}</p>
            <p className="text-zinc-600 dark:text-zinc-300">
              {i.customer.firstName} {i.customer.lastName} | {i.paymentStatus}
            </p>
            <a href={`/api/invoices/${i.id}/pdf`} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs underline">
              Open PDF invoice / receipt
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
