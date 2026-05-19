import { Skeleton } from "@/components/ui/skeleton";
import type { Invoice } from "./billing-types";

type Props = { invoices: Invoice[]; loading: boolean };

export function BillingStats({ invoices, loading }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
      </div>
    );
  }

  const totalRevenue = invoices.reduce((s, i) => s + Number(i.total), 0);
  const paidCount = invoices.filter((i) => i.paymentStatus === "PAID").length;
  const outstanding = invoices
    .filter((i) => i.paymentStatus !== "PAID")
    .reduce((s, i) => s + Number(i.total), 0);

  const fmt = (n: number) =>
    `₦${n.toLocaleString("en", { minimumFractionDigits: 2 })}`;

  const stats = [
    { label: "Total invoiced", value: fmt(totalRevenue), warn: false },
    { label: "Paid", value: `${paidCount} of ${invoices.length}`, warn: false },
    { label: "Outstanding", value: fmt(outstanding), warn: outstanding > 0 },
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {stats.map((s) => (
        <div key={s.label} className="card p-4">
          <p className="text-xs text-muted mb-1">{s.label}</p>
          <p
            className="text-xl font-semibold"
            style={{ color: s.warn ? "var(--warn)" : undefined }}
          >
            {s.value}
          </p>
        </div>
      ))}
    </div>
  );
}
