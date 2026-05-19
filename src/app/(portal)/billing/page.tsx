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

  return (
    <div className="space-y-5">
      <PageHeader
        title="Billing"
        subtitle={`${invoices.length} invoice${invoices.length !== 1 ? "s" : ""}`}
        actions={
          <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>
            + New invoice
          </button>
        }
      />

      <BillingStats invoices={invoices} loading={isLoading} />

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-4"><TableSkeleton /></div>
        ) : (
          <InvoiceTable invoices={invoices} onRecordPayment={setPayingInvoice} />
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
