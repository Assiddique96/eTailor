import Link from "next/link";
import { MarketingNav } from "@/components/marketing/nav";
import { MarketingFooter } from "@/components/marketing/footer";

const VALUES = [
  { icon: "🎯", title: "Built for purpose", desc: "Every feature in eTailo was meticulously designed specifically for tailoring businesses—from measurement tracking to job workflow management. Unlike generic CRM or inventory software adapted for tailors, eTailo understands the unique nuances of your craft, including fitting appointments, fabric catalog management, and multi-stage production workflows." },
  { icon: "🤝", title: "Tailor-first", desc: "We maintain weekly conversations with real tailors across Nigeria, Ghana, the UK, and beyond. Their direct feedback shapes every product decision, feature roadmap, and design iteration. Our product team includes former tailors who understand the daily challenges of running a stitching business, ensuring eTailo solves real problems rather than imagined ones." },
  { icon: "🔒", title: "Privacy by design", desc: "Your customer measurements, order history, and business intelligence belong entirely to you. We operate on a strict no-data-selling policy, display zero advertisements, and never share customer information with third parties for marketing or analytics. All data is encrypted in transit and at rest, with full export capabilities so you retain complete ownership and control." },
  { icon: "⚡", title: "Simple by default", desc: "eTailo works out of the box with zero configuration—register your shop and start adding customers within minutes. Power users can access advanced features like custom role permissions, CSV bulk imports, audit logs, and API integrations. But for day-to-day operations, the interface remains clean, intuitive, and requiring minimal training for staff with varying technical skills." },
];

const TEAM = [
  { name: "Umar Abubakar Sadiq", role: "CEO & Co-founder", avatar: "UA", bio: "Former master tailor with 10 years of experience running a boutique in Lagos before transitioning to software entrepreneurship. After witnessing countless skilled tailors lose lucrative clients due to disorganized paper registers and lost measurements, Emeka founded eTailo to digitize the tailoring workflow. He personally onboarded the first 100 shops and still joins customer support calls weekly to understand pain points firsthand." },
  { name: "Agamevufu Vincent Uzochi", role: "MD and co-founder", avatar: "VU", bio: "Senior UX designer with 8 years of experience simplifying complex workflows for fintech and SaaS platforms. Previously led product design at Flutterwave, where she optimized checkout flows for millions of African merchants. Chioma's obsession with making intricate processes feel effortless drives eTailo's minimalist interface. She holds a Master's in Human-Computer Interaction and conducts monthly usability testing sessions with actual tailors." },
  { name: "Esther Chioma", role: "Head of Legal Team", avatar: "EC", bio: "Full-stack software engineer with 12 years of experience building scalable SaaS platforms across Africa, Europe, and the Middle East. Previously architected payment systems for Paystack and inventory management tools for Jumia. Tunde leads eTailo's engineering team of 8 developers, focusing on performance, security, and reliability. He ensures the platform handles 180,000+ tracked jobs with 99.9% uptime and implements industry-standard JWT authentication with strict cookie security." },
];

export default function AboutPage() {
  return (
    <div style={{ background: "var(--bg-base)" }}>
      <MarketingNav />

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-5 pt-16 pb-12 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand mb-3">About eTailo</p>
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight mb-5">
          We exist to help tailors thrive in the digital age
        </h1>
        <p className="text-lg text-secondary leading-relaxed max-w-2xl mx-auto">
          eTailo was founded in 2026 by a team of experienced engineers, designers, and former tailors who grew up watching family members run tailoring shops using handwritten notebooks, chaotic WhatsApp groups, and fragile paper receipts. We witnessed firsthand how brilliant craftsmen lost valuable clients and revenue due to poor administrative systems. We knew there had to be a better, more professional way to run a modern tailoring business.
        </p>
      </section>

      {/* Story */}
      <section className="border-y" style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}>
        <div className="mx-auto max-w-6xl px-5 py-16 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-4">Our story</h2>
            <div className="space-y-4 text-secondary leading-relaxed">
              <p>
                The catalyst for eTailo came when our CEO, Umar Abubakar Sadiq, watched his uncle—a brilliant master tailor in Gombe with 25 years of experience—lose a prestigious long-time client because he'd confused measurements from a worn, water-damaged notebook. The client's wedding suit was delivered with incorrect dimensions, resulting in a devastating reputational blow and thousands of naira in lost revenue. That moment revealed a systemic problem affecting tailors across Africa and the diaspora.
              </p>
              <p>
                Abubakar spent the next six months conducting in-person interviews with over 200 tailors across Nigeria, Ghana, and the UK. The challenges were universal and heartbreaking: measurements lost when notebooks disappeared, orders forgotten amidst busy seasons, payments missed due to poor tracking, no visibility into team productivity, and no professional way to showcase fabric catalogs to clients.
              </p>
              <p>
                eTailo was built to solve every single one of these problems—with a clean, affordable digital system designed around the tailor's actual workflow. We didn't adapt generic software; we built from scratch what tailors wished existed. Today, over 2,400 shops trust eTailo to manage their customers, jobs, invoices, and measurements with confidence.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { val: "2026", label: "Founded" },
              { val: "2,400+", label: "Shops onboarded" },
              { val: "12+", label: "Countries served" },
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
          <p className="text-secondary">The core principles that guide every product decision, feature release, and customer interaction.</p>
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
            <p className="text-secondary">A passionate team united by a big visionary mission to transform tailoring businesses worldwide.</p>
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
        <h2 className="text-2xl font-semibold mb-3">Ready to join the eTailo family?</h2>
        <p className="text-secondary mb-6">Start your free trial today. No credit card required. Upgrade anytime as your business grows.</p>
        <div className="flex gap-3 justify-center">
          <Link href="/register" className="btn btn-primary" style={{ padding: "0.75rem 1.5rem" }}>Get started free →</Link>
          <Link href="/contact" className="btn btn-ghost" style={{ padding: "0.75rem 1.5rem" }}>Contact us</Link>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
