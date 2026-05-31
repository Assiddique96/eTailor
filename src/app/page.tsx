import Link from "next/link";
import { MarketingNav } from "@/components/marketing/nav";
import { MarketingFooter } from "@/components/marketing/footer";

const FEATURES = [
  {
    icon: "👥",
    title: "Customer Profiles",
    desc: "Store body measurements, style preferences, order history, and contact details all in one place. Never lose a client record again.",
    color: "var(--info)",
    bg: "var(--info-light)",
  },
  {
    icon: "🧵",
    title: "Job Workflow Board",
    desc: "Visualise every job from Pending to Delivered with a beautiful Kanban board. Switch to list view for a quick overview.",
    color: "var(--brand)",
    bg: "var(--brand-light)",
  },
  {
    icon: "💳",
    title: "Invoicing & Payments",
    desc: "Auto-numbered invoices, partial payment support, outstanding balance tracking, and downloadable PDF receipts.",
    color: "var(--success)",
    bg: "var(--success-light)",
  },
  {
    icon: "✉️",
    title: "Client Communication",
    desc: "Log and send messages via App, Email, WhatsApp, or SMS. Keep a full communication history per customer.",
    color: "var(--warning)",
    bg: "var(--warning-light)",
  },
  {
    icon: "🔐",
    title: "Team & Permissions",
    desc: "Invite staff, create custom roles, and assign granular permissions. Control exactly what each team member can see and do.",
    color: "#7c3aed",
    bg: "#f3e8ff",
  },
  {
    icon: "📋",
    title: "Full Audit Trail",
    desc: "Every action is logged with the user, timestamp, and IP address. Stay compliant and accountable at all times.",
    color: "var(--danger)",
    bg: "var(--danger-light)",
  },
];

const STEPS = [
  { step: "01", title: "Register your shop", desc: "Create your shop workspace in under a minute. No credit card required." },
  { step: "02", title: "Add your customers", desc: "Import or manually add customer profiles with measurements and preferences." },
  { step: "03", title: "Track jobs & billing", desc: "Create jobs, move them through your workflow, and invoice customers — all in one place." },
];

const TESTIMONIALS = [
  {
    quote: "eTailor completely transformed how I run my shop. I used to track everything in notebooks. Now everything is digital and I haven't lost a single order.",
    name: "Adaeze Okonkwo",
    role: "Owner, Prestige Couture Lagos",
    avatar: "AO",
  },
  {
    quote: "The invoicing alone is worth it. Auto-numbered, professional PDFs sent straight to my clients. My customers think I've gone corporate.",
    name: "Samuel Mensah",
    role: "Master Tailor, Accra",
    avatar: "SM",
  },
  {
    quote: "Managing my team of 4 seamstresses is so much easier now. I can see what everyone is working on at a glance.",
    name: "Fatima Al-Hassan",
    role: "Studio Owner, Abuja",
    avatar: "FA",
  },
];

const PRICING = [
  {
    name: "Starter",
    price: "Free",
    period: "",
    desc: "Perfect for solo tailors just getting started.",
    features: ["Up to 50 customers", "Unlimited jobs", "Basic invoicing", "Email support"],
    cta: "Get started free",
    href: "/register",
    highlighted: false,
  },
  {
    name: "Professional",
    price: "$19",
    period: "/month",
    desc: "For growing shops that need more power.",
    features: ["Unlimited customers", "Unlimited jobs", "PDF invoices", "Email & WhatsApp messaging", "Team members (up to 5)", "Audit trail", "Priority support"],
    cta: "Start free trial",
    href: "/register",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    desc: "For large shops and tailoring chains.",
    features: ["Everything in Professional", "Unlimited team members", "Custom roles & permissions", "Dedicated account manager", "API access", "Custom integrations"],
    cta: "Contact us",
    href: "/contact",
    highlighted: false,
  },
];

const STATS = [
  { value: "2,400+", label: "Tailors onboarded" },
  { value: "180k+", label: "Jobs tracked" },
  { value: "98%", label: "Customer satisfaction" },
  { value: "12+", label: "Countries" },
];

export default function HomePage() {
  return (
    <div style={{ background: "var(--bg-base)" }}>
      <MarketingNav />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse 80% 60% at 50% -10%, color-mix(in srgb, var(--brand) 12%, transparent), transparent)"
        }} />

        <div className="relative mx-auto max-w-6xl px-5 pt-20 pb-24 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium mb-6" style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}>
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            Now serving 2,400+ tailors worldwide
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.12] mb-6 max-w-3xl mx-auto">
            The smarter way to run your{" "}
            <span style={{
              background: "linear-gradient(135deg, var(--brand) 0%, #7c3aed 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              tailoring business
            </span>
          </h1>

          <p className="text-lg text-secondary max-w-2xl mx-auto leading-relaxed mb-8">
            eTailo gives you everything you need to manage customers, track orders,
            send invoices, and coordinate your team — all in one beautifully simple platform.
          </p>

          <div className="flex flex-wrap gap-3 justify-center mb-12">
            <Link href="/register" className="btn btn-primary" style={{ padding: "0.75rem 1.75rem", fontSize: "0.9375rem" }}>
              Start for free →
            </Link>
            <Link href="/about" className="btn btn-ghost" style={{ padding: "0.75rem 1.75rem", fontSize: "0.9375rem" }}>
              Learn more
            </Link>
          </div>

          {/* Hero mockup */}
          <div className="relative max-w-4xl mx-auto">
            <div className="card overflow-hidden shadow-2xl" style={{ border: "1px solid var(--border)" }}>
              {/* Fake browser chrome */}
              <div className="flex items-center gap-1.5 px-4 py-3 border-b" style={{ background: "var(--bg-base)", borderColor: "var(--border)" }}>
                <div className="h-3 w-3 rounded-full bg-red-400" />
                <div className="h-3 w-3 rounded-full bg-yellow-400" />
                <div className="h-3 w-3 rounded-full bg-green-400" />
                <div className="flex-1 mx-4 h-6 rounded-md text-xs flex items-center px-3 text-muted font-mono" style={{ background: "var(--border)" }}>
                  app.etailor.com/dashboard
                </div>
              </div>
              {/* Dashboard preview */}
              <div className="p-5" style={{ background: "var(--bg-base)" }}>
                <div className="grid grid-cols-4 gap-3 mb-4">
                  {[
                    { label: "Customers", val: "248", color: "var(--info)" },
                    { label: "Active Jobs", val: "34", color: "var(--warning)" },
                    { label: "Due Soon", val: "7", color: "var(--danger)" },
                    { label: "Revenue", val: "$12,840", color: "var(--success)" },
                  ].map((s) => (
                    <div key={s.label} className="card p-3">
                      <p className="text-xs text-muted mb-1">{s.label}</p>
                      <p className="text-lg font-semibold" style={{ color: s.color }}>{s.val}</p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {["Pending","In Progress","Completed"].map((col, i) => (
                    <div key={col} className="rounded-lg p-3" style={{ background: "var(--bg-card)" }}>
                      <p className="text-xs font-medium text-muted mb-2">{col}</p>
                      {[...Array(i === 1 ? 3 : i === 0 ? 4 : 2)].map((_, j) => (
                        <div key={j} className="skeleton h-8 rounded mb-1.5" />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Shadow glow */}
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-3/4 h-12 blur-2xl opacity-20 rounded-full" style={{ background: "var(--brand)" }} />
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="border-y" style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}>
        <div className="mx-auto max-w-6xl px-5 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {STATS.map((s) => (
              <div key={s.label}>
                <p className="text-3xl font-semibold text-brand">{s.value}</p>
                <p className="text-sm text-secondary mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="mx-auto max-w-6xl px-5 py-20">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand mb-3">Features</p>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4">Everything your shop needs</h2>
          <p className="text-secondary max-w-xl mx-auto">
            Purpose-built for tailors. Every feature is designed around how a tailoring business actually works.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="card p-6 hover:shadow-md transition-shadow group">
              <div className="h-11 w-11 rounded-xl flex items-center justify-center text-2xl mb-4" style={{ background: f.bg, color: f.color }}>
                {f.icon}
              </div>
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-secondary leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="border-y" style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}>
        <div className="mx-auto max-w-6xl px-5 py-20">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand mb-3">How it works</p>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4">Up and running in minutes</h2>
            <p className="text-secondary max-w-xl mx-auto">No lengthy setup. No training required. Just sign up and start managing your shop.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-8 left-1/4 right-1/4 h-px" style={{ background: "var(--border)" }} />

            {STEPS.map((s) => (
              <div key={s.step} className="text-center relative">
                <div className="h-16 w-16 rounded-2xl mx-auto mb-4 flex items-center justify-center text-xl font-bold" style={{ background: "var(--brand-light)", color: "var(--brand)" }}>
                  {s.step}
                </div>
                <h3 className="font-semibold mb-2">{s.title}</h3>
                <p className="text-sm text-secondary leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand mb-3">Testimonials</p>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4">Loved by tailors everywhere</h2>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="card p-6 flex flex-col gap-4">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="#f59e0b"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                ))}
              </div>
              <p className="text-sm text-secondary leading-relaxed flex-1">"{t.quote}"</p>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-semibold shrink-0">
                  {t.avatar}
                </div>
                <div>
                  <p className="text-sm font-medium">{t.name}</p>
                  <p className="text-xs text-muted">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="border-y" style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}>
        <div className="mx-auto max-w-6xl px-5 py-20">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand mb-3">Pricing</p>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4">Simple, transparent pricing</h2>
            <p className="text-secondary max-w-xl mx-auto">No hidden fees. No surprise charges. Cancel anytime.</p>
          </div>

          <div className="grid gap-5 md:grid-cols-3 items-start">
            {PRICING.map((p) => (
              <div
                key={p.name}
                className="card p-6 relative"
                style={p.highlighted ? { borderColor: "var(--brand)", borderWidth: "2px", boxShadow: "0 0 0 4px color-mix(in srgb, var(--brand) 8%, transparent)" } : {}}
              >
                {p.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-indigo-600 text-white text-xs font-semibold px-3 py-1 rounded-full">Most popular</span>
                  </div>
                )}
                <div className="mb-5">
                  <p className="font-semibold text-sm text-secondary mb-1">{p.name}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">{p.price}</span>
                    {p.period && <span className="text-secondary text-sm">{p.period}</span>}
                  </div>
                  <p className="text-xs text-muted mt-1.5">{p.desc}</p>
                </div>

                <ul className="space-y-2.5 mb-6">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <svg className="shrink-0 mt-0.5" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      <span className="text-secondary">{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={p.href}
                  className={`btn w-full ${p.highlighted ? "btn-primary" : "btn-ghost"}`}
                >
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="rounded-2xl p-10 md:p-16 text-center relative overflow-hidden" style={{ background: "var(--brand)" }}>
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 70% 80% at 50% 120%, rgba(255,255,255,0.08), transparent)" }} />
          <div className="relative">
            <h2 className="text-3xl sm:text-4xl font-semibold text-white mb-4 tracking-tight">
              Ready to transform your tailoring business?
            </h2>
            <p className="text-indigo-200 max-w-xl mx-auto mb-8">
              Join thousands of tailors already using eTailo to save time, reduce errors, and delight their customers.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href="/register" className="btn" style={{ background: "white", color: "var(--brand)", padding: "0.75rem 1.75rem", fontSize: "0.9375rem", fontWeight: 600 }}>
                Get started free →
              </Link>
              <Link href="/contact" className="btn" style={{ background: "rgba(255,255,255,0.15)", color: "white", border: "1px solid rgba(255,255,255,0.25)", padding: "0.75rem 1.75rem", fontSize: "0.9375rem" }}>
                Talk to us
              </Link>
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}



