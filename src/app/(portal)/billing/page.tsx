"use client";
import { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { PageHeader } from "@/components/ui/page-header";
import { TableSkeleton } from "@/components/ui/skeleton";
import { BillingStats } from "@/components/billing/billing-stats";
import { InvoiceTable } from "@/components/billing/invoice-table";
import { CreateInvoiceModal } from "@/components/billing/create-invoice-modal";
import { RecordPaymentModal } from "@/components/billing/record-payment-modal";
import type { Invoice, Customer } from "@/components/billing/billing-types";

export default function BillingPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);

  const { data: invData, isLoading, mutate: mutateInvoices } =
    useSWR<{ invoices: Invoice[]; nextCursor: string | null }>("/api/invoices", fetcher);
  const { data: custData } =
    useSWR<{ customers: Customer[] }>("/api/customers", fetcher);

  const invoices = invData?.invoices ?? [];
  const customers = custData?.customers ?? [];
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const normalized = (s: string) => s.trim().toLowerCase();
  const filteredInvoices = invoices.filter((inv) => {
    if (statusFilter !== "ALL" && inv.paymentStatus !== statusFilter) return false;
    if (!search) return true;
    const q = normalized(search);
    const customerName = `${inv.customer.firstName} ${inv.customer.lastName}`.toLowerCase();
    return (
      inv.invoiceNumber.toLowerCase().includes(q) ||
      inv.total.toLowerCase().includes(q) ||
      customerName.includes(q) ||
      inv.paymentStatus.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Billing"
        subtitle={`${invoices.length} invoice${invoices.length !== 1 ? "s" : ""}`}
        actions={
          <div className="flex items-center gap-2">
            <input
              aria-label="Search invoices"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search invoices, customer, amount..."
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
              <option value="PAID">Paid</option>
              <option value="PARTIAL">Partial</option>
              <option value="PENDING">Pending</option>
            </select>
            <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>
              + New invoice
            </button>
          </div>
        }
      />

      <BillingStats invoices={invoices} loading={isLoading} />

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-4"><TableSkeleton /></div>
        ) : (
          <InvoiceTable invoices={filteredInvoices} onRecordPayment={setPayingInvoice} />
        )}
      </div>

      <CreateInvoiceModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        customers={customers}
        onCreated={() => mutateInvoices()}
      />

      <RecordPaymentModal
        invoice={payingInvoice}
        onClose={() => setPayingInvoice(null)}
        onRecorded={() => { mutateInvoices(); setPayingInvoice(null); }}
      />
    </div>
  );
}
