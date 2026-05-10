import Link from "next/link";

const features = [
  { icon: "👥", title: "Customer profiles", desc: "Measurements, style preferences, and order history in one place." },
  { icon: "🧵", title: "Job workflow board", desc: "Kanban and list views to track every job from pending to delivery." },
  { icon: "💳", title: "Invoicing & payments", desc: "Auto-numbered invoices, partial payments, and PDF receipts." },
  { icon: "💬", title: "Client communications", desc: "Log messages across App, Email, WhatsApp, and SMS channels." },
  { icon: "🔐", title: "Role-based access", desc: "Granular permissions per team member role." },
  { icon: "📋", title: "Full audit trail", desc: "Every action logged with user, IP, and timestamp." },
];

const roles = [
  { title: "Shop Owner", sub: "Full access", desc: "Manage customers, jobs, billing, team, settings, and reports." },
  { title: "Employee", sub: "Role-restricted", desc: "Access controlled by assigned permissions per role." },
  //{ title: "Super Admin", sub: "Platform-wide", desc: "Global oversight across all shops and compliance monitoring." },
];

export default function Home() {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg-base)" }}>
      {/* Nav */}
      <header className="border-b" style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}>
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">eT</div>
            <span className="font-semibold">eTailor</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className="btn btn-ghost btn-sm">Sign in</Link>
            <Link href="/register" className="btn btn-primary btn-sm">Get started</Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-16 space-y-20">
        {/* Hero */}
        <section className="text-center space-y-6 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium text-secondary" style={{ borderColor: "var(--border)" }}>
            Tailoring Management Platform
          </div>
          <h1 className="text-5xl font-semibold tracking-tight leading-tight">
            Run your tailoring shop<br />
            <span style={{ color: "var(--brand)" }}>with precision.</span>
          </h1>
          <p className="text-lg text-secondary max-w-xl mx-auto leading-relaxed">
            Manage customer records, job workflows, invoicing, team access,
            and client communications — all in one secure workspace.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/register" className="btn btn-primary" style={{ padding: "0.625rem 1.5rem", fontSize: "0.9375rem" }}>
              Register your shop →
            </Link>
            <Link href="/login" className="btn btn-ghost" style={{ padding: "0.625rem 1.5rem", fontSize: "0.9375rem" }}>
              Sign in
            </Link>
          </div>
        </section>

        {/* Features */}
        <section>
          <h2 className="text-xl font-semibold mb-6 text-center">Everything your shop needs</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="card p-5 space-y-2">
                <div className="text-2xl">{f.icon}</div>
                <h3 className="font-semibold">{f.title}</h3>
                <p className="text-sm text-secondary leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Roles */}
        <section>
          <h2 className="text-xl font-semibold mb-6 text-center">Role & access model</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {roles.map((r) => (
              <div key={r.title} className="card p-5">
                <div className="flex items-baseline gap-2 mb-2">
                  <h3 className="font-semibold">{r.title}</h3>
                  <span className="text-xs text-secondary">{r.sub}</span>
                </div>
                <p className="text-sm text-secondary">{r.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="card p-10 text-center space-y-4">
          <h2 className="text-2xl font-semibold">Ready to get started?</h2>
          <p className="text-secondary">Set up your shop workspace in under a minute.</p>
          <Link href="/register" className="btn btn-primary inline-flex" style={{ padding: "0.625rem 1.5rem" }}>
            Create your shop →
          </Link>
        </section>
      </main>

      <footer className="border-t py-8 text-center text-sm text-muted" style={{ borderColor: "var(--border)" }}>
        © {new Date().getFullYear()} eTailor · Tailoring Management Platform
      </footer>
    </div>
  );
}
