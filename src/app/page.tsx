import Link from "next/link";

const features = [
  "Customer profiles with measurements, style preferences, and order history",
  "Job workflow tracking from pending to delivery with due-date reminders",
  "Invoicing, partial/full payment records, and printable PDF receipts",
  "Client communication history for updates, notes, and feedback",
  "Team sub-accounts with granular role-based permissions",
  "Audit trail, global search, and data export for reporting and backup",
];

const roleCards = [
  {
    title: "Shop Owner (Main Admin)",
    details: "Full store access: customers, jobs, billing, team, settings, reports, and reminder controls.",
  },
  {
    title: "Employees (Sub-Accounts)",
    details: "Restricted access based on assigned roles (for example sales associate, manager, production staff).",
  },
  {
    title: "Platform Super Admin",
    details: "Global oversight across stores, system management, security, and compliance monitoring.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/70 to-transparent px-6 py-10 text-zinc-900 dark:from-zinc-950 dark:to-zinc-950 dark:text-zinc-50">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <section className="surface-card rounded-2xl p-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">Tailoring Management Platform</p>
          <h1 className="max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl">
            Keep customer measurements accurate and tailoring jobs on time.
          </h1>
          <p className="mt-4 max-w-3xl text-zinc-600 dark:text-zinc-300">
            eTailor helps fashion designers and tailoring shops manage customer records, job progress, payments,
            team access, and communication in one secure workspace.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/register" className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500">
              Register Shop
            </Link>
            <Link href="/login" className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800">
              Sign In
            </Link>
            <Link href="/dashboard" className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800">
              Open Dashboard
            </Link>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">Everything your shop needs</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {features.map((item) => (
              <div key={item} className="surface-card p-4 text-sm">
                {item}
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">Role and access model</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {roleCards.map((role) => (
              <div key={role.title} className="surface-card p-5">
                <h3 className="text-base font-semibold">{role.title}</h3>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">{role.details}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          

          <div className="surface-card p-5">
            <h2 className="mb-3 text-lg font-semibold">Useful Links</h2>
            <div className="flex flex-col gap-2 text-sm">
              <Link href="/customers" className="underline">
                Customer Management
              </Link>
              <Link href="/jobs" className="underline">
                Job Workflow Board
              </Link>
              <Link href="/billing" className="underline">
                Billing and Invoices
              </Link>
              <Link href="/team" className="underline">
                Team and Permissions
              </Link>
              <Link href="/audit" className="underline">
                Audit Trail
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
