import Link from "next/link";
import { MarketingNav } from "@/components/marketing/nav";
import { MarketingFooter } from "@/components/marketing/footer";

const VALUES = [
  { icon: "🎯", title: "Built for purpose", desc: "Every feature in eTailor was designed specifically for tailoring businesses — not adapted from generic software." },
  { icon: "🤝", title: "Tailor-first", desc: "We talk to real tailors every week. Their feedback shapes every product decision we make." },
  { icon: "🔒", title: "Privacy by design", desc: "Your customer data belongs to you. We never sell data, never show ads, and never share information with third parties." },
  { icon: "⚡", title: "Simple by default", desc: "Power users can go deep. But for everyone else, eTailor works out of the box with zero configuration." },
];

const TEAM = [
  { name: "Emeka Obi", role: "CEO & Co-founder", avatar: "EO", bio: "Former master tailor turned software founder. Built eTailor after spending 10 years watching great tailors lose business to poor admin." },
  { name: "Chioma Adeyemi", role: "Head of Product", avatar: "CA", bio: "UX designer obsessed with making complex workflows feel effortless. Previously at Flutterwave." },
  { name: "Tunde Bashir", role: "Lead Engineer", avatar: "TB", bio: "Full-stack engineer with a decade of experience building SaaS platforms across Africa and Europe." },
];

export default function AboutPage() {
  return (
    <div style={{ background: "var(--bg-base)" }}>
      <MarketingNav />

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-5 pt-16 pb-12 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand mb-3">About eTailor</p>
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight mb-5">
          We exist to help tailors thrive
        </h1>
        <p className="text-lg text-secondary leading-relaxed max-w-2xl mx-auto">
          eTailor was founded in 2023 by a team of engineers and designers who grew up watching family members run tailoring shops with notebooks, 
          WhatsApp groups, and handwritten receipts. We knew there had to be a better way.
        </p>
      </section>

      {/* Story */}
      <section className="border-y" style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}>
        <div className="mx-auto max-w-6xl px-5 py-16 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-4">Our story</h2>
            <div className="space-y-4 text-secondary leading-relaxed">
              <p>
                It started when our CEO, Emeka, watched his aunt — a brilliant tailor in Lagos — lose a long-time client because she'd mixed up measurements from a worn notebook. That client's wedding suit came out wrong. It was a devastating moment for her business.
              </p>
              <p>
                He spent the next six months talking to over 200 tailors across Nigeria, Ghana, and the UK. The problems were universal: lost measurements, forgotten orders, missed payments, no way to track team productivity.
              </p>
              <p>
                eTailor was built to solve every single one of those problems — cleanly, affordably, and with the tailor's actual workflow in mind.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { val: "2023", label: "Founded" },
              { val: "2,400+", label: "Shops onboarded" },
              { val: "12+", label: "Countries" },
              { val: "180k+", label: "Jobs tracked" },
            ].map((s) => (
              <div key={s.label} className="card p-5 text-center">
                <p className="text-3xl font-bold text-brand">{s.val}</p>
                <p className="text-sm text-secondary mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-3">What we stand for</h2>
          <p className="text-secondary">The principles that guide every decision we make.</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map((v) => (
            <div key={v.title} className="card p-5">
              <div className="text-2xl mb-3">{v.icon}</div>
              <h3 className="font-semibold mb-2">{v.title}</h3>
              <p className="text-sm text-secondary leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Team */}
      <section className="border-t" style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}>
        <div className="mx-auto max-w-6xl px-5 py-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-3">Meet the team</h2>
            <p className="text-secondary">Small team. Big mission.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {TEAM.map((t) => (
              <div key={t.name} className="card p-6 text-center">
                <div className="h-16 w-16 rounded-2xl mx-auto mb-4 bg-indigo-100 text-indigo-700 flex items-center justify-center text-xl font-semibold">
                  {t.avatar}
                </div>
                <h3 className="font-semibold">{t.name}</h3>
                <p className="text-xs text-brand mb-3">{t.role}</p>
                <p className="text-sm text-secondary leading-relaxed">{t.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-3xl px-5 py-16 text-center">
        <h2 className="text-2xl font-semibold mb-3">Ready to join the eTailor family?</h2>
        <p className="text-secondary mb-6">Start for free. No credit card required.</p>
        <div className="flex gap-3 justify-center">
          <Link href="/register" className="btn btn-primary" style={{ padding: "0.75rem 1.5rem" }}>Get started free →</Link>
          <Link href="/contact" className="btn btn-ghost" style={{ padding: "0.75rem 1.5rem" }}>Contact us</Link>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
