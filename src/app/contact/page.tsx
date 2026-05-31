"use client";
import { FormEvent, useState } from "react";
import Link from "next/link";
import { MarketingNav } from "@/components/marketing/nav";
import { MarketingFooter } from "@/components/marketing/footer";

const TOPICS = [
  "General enquiry",
  "Sales & pricing",
  "Technical support",
  "Feature request",
  "Bug report",
  "Partnership",
  "Other",
];

const CONTACT_INFO = [
  {
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`,
    label: "Email",
    value: "hello@etailor.com",
    href: "mailto:hello@etailor.com",
  },
  {
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
    label: "Live chat",
    value: "Available Mon–Fri, 9am–6pm WAT",
    href: "#",
  },
  {
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
    label: "Headquarters",
    value: "Lagos, Nigeria 🇳🇬",
    href: "#",
  },
];

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const fd = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(fd.entries())),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Something went wrong. Please try again.");
        return;
      }
      setSubmitted(true);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ background: "var(--bg-base)" }}>
      <MarketingNav />

      {/* Hero */}
      <section className="mx-auto max-w-3xl px-5 pt-16 pb-10 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand mb-3">Contact</p>
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight mb-4">Get in touch</h1>
        <p className="text-lg text-secondary">We'd love to hear from you. Our team usually responds within a few hours.</p>
      </section>

      <div className="mx-auto max-w-6xl px-5 pb-20">
        <div className="grid md:grid-cols-5 gap-8">

          {/* Contact info sidebar */}
          <aside className="md:col-span-2 space-y-4">
            {CONTACT_INFO.map((c) => (
              <div key={c.label} className="card p-5 flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--brand-light)", color: "var(--brand)" }}>
                  <span dangerouslySetInnerHTML={{ __html: c.icon }} />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted mb-0.5">{c.label}</p>
                  {c.href !== "#" ? (
                    <a href={c.href} className="text-sm font-medium hover:text-brand transition-colors">{c.value}</a>
                  ) : (
                    <p className="text-sm font-medium">{c.value}</p>
                  )}
                </div>
              </div>
            ))}

            <div className="card p-5">
              <h3 className="font-medium mb-2 text-sm">Looking for help docs?</h3>
              <p className="text-xs text-secondary mb-3">Check our FAQ for quick answers to common questions.</p>
              <Link href="/faq" className="btn btn-ghost btn-sm w-full">Browse FAQ →</Link>
            </div>

            <div className="card p-5" style={{ background: "var(--brand-light)", borderColor: "color-mix(in srgb, var(--brand) 20%, transparent)" }}>
              <p className="text-xs font-semibold text-brand mb-1">Response time</p>
              <p className="text-sm text-secondary">We aim to respond to all enquiries within <strong>4 business hours</strong>.</p>
            </div>
          </aside>

          {/* Contact form */}
          <div className="md:col-span-3">
            {submitted ? (
              <div className="card p-10 text-center h-full flex flex-col items-center justify-center gap-4">
                <div className="h-16 w-16 rounded-full flex items-center justify-center text-3xl" style={{ background: "var(--success-light)" }}>
                  ✅
                </div>
                <h2 className="text-xl font-semibold">Message sent!</h2>
                <p className="text-secondary max-w-sm text-center">
                  Thanks for reaching out. We've received your message and will get back to you within a few hours.
                </p>
                <button onClick={() => setSubmitted(false)} className="btn btn-ghost btn-sm mt-2">
                  Send another message
                </button>
              </div>
            ) : (
              <div className="card p-6">
                <h2 className="font-semibold mb-5">Send us a message</h2>
                <form onSubmit={onSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-secondary">First name *</label>
                      <input name="firstName" required className="field" placeholder="Jane" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-secondary">Last name *</label>
                      <input name="lastName" required className="field" placeholder="Doe" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-secondary">Email address *</label>
                    <input name="email" type="email" required className="field" placeholder="jane@example.com" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-secondary">Shop name</label>
                    <input name="shopName" className="field" placeholder="Your tailoring shop (optional)" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-secondary">Topic *</label>
                    <select name="topic" required className="field">
                      <option value="">Select a topic</option>
                      {TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-secondary">Message *</label>
                    <textarea
                      name="message"
                      required
                      rows={5}
                      className="field resize-none"
                      placeholder="Tell us how we can help…"
                    />
                  </div>

                  {error && (
                    <div className="rounded-lg border px-3 py-2.5 text-sm" style={{ background: "var(--danger-light)", borderColor: "color-mix(in srgb, var(--danger) 25%, transparent)", color: "var(--danger)" }}>
                      {error}
                    </div>
                  )}

                  <button type="submit" className="btn btn-primary w-full" disabled={submitting}>
                    {submitting ? "Sending…" : "Send message →"}
                  </button>

                  <p className="text-xs text-center text-muted">
                    By submitting this form you agree to our{" "}
                    <Link href="/privacy" className="hover:underline">Privacy Policy</Link>.
                  </p>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      <MarketingFooter />
    </div>
  );
}




