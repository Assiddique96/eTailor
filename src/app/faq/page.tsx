"use client";
import { useState } from "react";
import Link from "next/link";
import { MarketingNav } from "@/components/marketing/nav";
import { MarketingFooter } from "@/components/marketing/footer";

const FAQS = [
  {
    category: "Introduction",
    items: [
      {
        q: "What is eTailo?",
        a: "eTailo is a digital tailoring management system designed for local tailors, boutiques, and stitching centers. It helps you replace paper registers with a secure, organized digital system to manage customers, measurements, orders, payments, and catalog photos efficiently.",
      },
      {
        q: "Who is eTailo for?",
        a: "Local tailors and individual seamstresses",
        a: "Boutique tailoring shops",
        a: "Multi-tailor workshops",
        a: "Stichting centers with multiple workers",
        a: "Anyone looking to digitize their tailoring business.",
      },
  },
  {
    category: "Getting Started",
    items: [
      {
        q: "How do I get started with eTailo?",
        a: "Simply click 'Get started free' and register your shop in under a minute. No credit card required. You'll be taken straight to your dashboard where you can start adding customers and jobs immediately.",
      },
      {
        q: "Do I need any technical knowledge to use eTailo?",
        a: "No. e-Tailo is designed for users with minimal technical knowledge. The interface is intuitive, and the system guides you through customer entry, measurement recording, order tracking, and catalog uploads.",
      },
      {
        q: "Can I import my existing customer data?",
        a: "Yes. You can import customers from a CSV file or add them manually one at a time. Our import tool supports common spreadsheet formats from Excel and Google Sheets.",
      },
      {
        q: "Is there a mobile app?",
        a: "A mobile app is currently in development and will be available soon for both iOS and Android. In the meantime, eTailo is fully responsive and works beautifully on any mobile browser.",
      },
    ],
  },
  {
    category: "Features & Functionality",
    items: [
      {
        q: "How does the job tracking work?",
        a: "Each job moves through a workflow: Pending → In Progress → Ready for Fitting → Completed → Delivered. You can view this as a Kanban board or a list. You can update the status with one click from either view.",
      },
      {
        q: "Can I send real emails to customers?",
        a: "Yes. eTailo integrates with Resend to send real emails. When you log a message with the Email channel, the customer receives a professionally formatted email instantly. You can also send job reminders automatically.",
      },
      {
        q: "How do invoice numbers work?",
        a: "Invoice numbers are automatically generated in sequential order (INV-0001, INV-0002, etc.) so there are no duplicates and no manual entry required.",
      },
      {
        q: "Can I record partial payments?",
        a: "Yes. You can record multiple payments against a single invoice. The invoice status automatically updates to Partial or Paid based on the total amount collected.",
      },
      {
        q: "What measurement units does eTailo support?",
        a: "Currently eTailo stores measurements in centimetres. Imperial (inches) support is on our roadmap and will be added in a future update.",
      },
    ],
  },
  {
    category: "Team & Permissions",
    items: [
      {
        q: "How many team members can I add?",
        a: "The Starter plan includes 1 user (shop owner). The Professional plan includes up to 5 team members. Enterprise plans have no limit.",
      },
      {
        q: "Can I control what each staff member can see?",
        a: "Yes. You can create custom roles with granular permissions — for example, a role that can view and create jobs but cannot access billing or audit logs.",
      },
      {
        q: "Is there a Super Admin role?",
        a: "Yes. Super Admins have platform-wide access across all shops. This role is only available to the platform operator and is assigned directly at the database level for security.",
      },
    ],
  },
  {
    category: "Billing & Plans",
    items: [
      {
        q: "Is eTailo really free to start?",
        a: "Yes. The Starter plan is completely free with no credit card required. It includes up to 50 customers, unlimited jobs, and basic invoicing.",
      },
      {
        q: "Can I upgrade or downgrade my plan at any time?",
        a: "Yes. You can upgrade or downgrade your plan at any time from your account settings. Changes take effect immediately.",
      },
      {
        q: "Do you offer refunds?",
        a: "Yes. We offer a 30-day money-back guarantee on all paid plans, no questions asked.",
      },
      {
        q: "Do you offer discounts for annual billing?",
        a: "Yes. Choosing annual billing gives you 2 months free compared to monthly billing.",
      },
    ],
  },
  {
    category: "Data & Privacy",
    items: [
      {
        q: "Who owns my data?",
        a: "You do. Your customer data, job records, and business information belong entirely to you. We never sell, share, or use your data for any purpose other than running your account.",
      },
      {
        q: "Can I export my data?",
        a: "Yes. You can export all your shop data — customers, jobs, invoices, and payments — as a JSON file at any time from your settings page.",
      },
      {
        q: "How is my data secured?",
        a: "All data is encrypted in transit (TLS) and at rest. Authentication uses industry-standard JWT tokens with strict cookie security. Every action is logged in a full audit trail.",
      },
      {
        q: "What happens to my data if I cancel?",
        a: "We retain your data for 90 days after cancellation so you can export it. After 90 days, all data is permanently deleted from our servers.",
      },
    ],
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b last:border-b-0" style={{ borderColor: "var(--border)" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-start justify-between gap-4 py-4 text-left"
      >
        <span className="font-medium text-sm leading-relaxed">{q}</span>
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          className="flex-shrink-0 mt-0.5 transition-transform"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", color: "var(--text-muted)" }}
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {open && (
        <p className="text-sm text-secondary leading-relaxed pb-4">{a}</p>
      )}
    </div>
  );
}

export default function FaqPage() {
  const [activeCategory, setActiveCategory] = useState(FAQS[0].category);

  return (
    <div style={{ background: "var(--bg-base)" }}>
      <MarketingNav />

      {/* Hero */}
      <section className="mx-auto max-w-3xl px-5 pt-16 pb-10 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand mb-3">FAQ</p>
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight mb-4">Frequently asked questions</h1>
        <p className="text-secondary text-lg">Everything you need to know about eTailo. Can't find the answer? <Link href="/contact" className="text-brand hover:underline">Contact us.</Link></p>
      </section>

      <div className="mx-auto max-w-6xl px-5 pb-16">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Category sidebar */}
          <aside className="md:w-52 flex-shrink-0">
            <div className="md:sticky md:top-24 space-y-1">
              {FAQS.map((cat) => (
                <button
                  key={cat.category}
                  onClick={() => setActiveCategory(cat.category)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeCategory === cat.category
                      ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                      : "text-secondary hover:text-primary hover:bg-stone-100 dark:hover:bg-stone-800"
                  }`}
                >
                  {cat.category}
                </button>
              ))}
            </div>
          </aside>

          {/* Questions */}
          <div className="flex-1">
            {FAQS.filter((cat) => cat.category === activeCategory).map((cat) => (
              <div key={cat.category}>
                <h2 className="font-semibold text-lg mb-4">{cat.category}</h2>
                <div className="card px-5 divide-y" style={{ borderColor: "var(--border)" }}>
                  {cat.items.map((item) => (
                    <FaqItem key={item.q} q={item.q} a={item.a} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <section className="border-t" style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}>
        <div className="mx-auto max-w-3xl px-5 py-16 text-center">
          <h2 className="text-2xl font-semibold mb-3">Still have questions?</h2>
          <p className="text-secondary mb-6">Our team is happy to help. We usually respond within a few hours.</p>
          <Link href="/contact" className="btn btn-primary" style={{ padding: "0.75rem 1.5rem" }}>
            Contact us →
          </Link>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
