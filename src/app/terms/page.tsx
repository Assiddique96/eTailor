"use client";

import { useState } from "react";
import Link from "next/link";
import { MarketingNav } from "@/components/marketing/nav";
import { MarketingFooter } from "@/components/marketing/footer";

export default function TermsPage() {
  // If this file is .tsx in the app router, avoiding the generic keeps it simple
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const sections = [
    {
      title: "Introduction",
      content: [
        "These Terms of Use govern your access to and use of the e-Tailo website and platform.",
        "By using the service, you agree to these Terms and confirm that you are authorized to use the platform on behalf of yourself or your business.",
      ],
    },
    {
      title: "Service description",
      content: [
        "e-Tailo is a tailoring management platform designed for tailoring businesses, boutiques, stitching shops, and similar operations.",
        "The platform helps users manage customers, measurements, orders, payments and invoices, catalog photos, workers or tailors, reports, and business analytics.",
      ],
    },
    {
      title: "Account registration and responsibility",
      content: [
        "You must provide accurate, complete, and current information when creating an account.",
        "You are responsible for maintaining the confidentiality of your login details and for all activity that occurs under your account.",
        "If staff or workers use your account, you must ensure that they are authorized to do so and that they follow these Terms.",
      ],
    },
    {
      title: "Acceptable use",
      content: [
        "You agree not to misuse the platform, interfere with system security, upload harmful or malicious content, or attempt unauthorized access to the system or other accounts.",
        "You must not use the service in a way that violates applicable law or infringes the rights of any third party.",
        "You must not upload customer data without proper consent or in a manner that violates privacy laws.",
      ],
    },
    {
      title: "Your data",
      content: [
        "You retain ownership of the business content and customer records that you enter into the platform.",
        "You grant us a limited license to process that data only as necessary to provide the service.",
        "You are responsible for the accuracy, legality, and proper consent relating to any customer information you upload, including names, contact details, measurements, and photos.",
      ],
    },
    {
      title: "Payments and subscriptions",
      content: [
        "If the platform offers paid plans, you agree to pay the applicable subscription and usage charges shown on the website.",
        "This may include charges for additional clients beyond any free allowance, extra photos, or other premium features described on the pricing page.",
        "Failure to pay may result in suspension or restriction of access to the service.",
      ],
    },
    {
      title: "Service availability",
      content: [
        "We aim to keep the platform available and reliable, but we do not guarantee uninterrupted access.",
        "Maintenance, updates, outages, or technical issues may temporarily affect service performance.",
      ],
    },
    {
      title: "Intellectual property",
      content: [
        "The website, platform, branding, layout, software, and original content belong to e-Tailo or its licensors.",
        "They are protected by applicable intellectual property laws.",
        "You may not copy, modify, distribute, or reverse engineer the service except where permitted by law or with written permission.",
      ],
    },
    {
      title: "Termination",
      content: [
        "We may suspend or terminate your access to the service if you violate these Terms, misuse the platform, or create a risk to the service or other users.",
        "You may stop using the service at any time and request account deletion through the available support process.",
      ],
    },
    {
      title: "Disclaimer and liability",
      content: [
        'The service is provided on an "as is" and "as available" basis to the fullest extent permitted by law.',
        "We are not liable for indirect, incidental, or consequential damages, loss of data, lost profits, or service interruption, except where liability cannot legally be limited.",
      ],
    },
    {
      title: "Changes to these terms",
      content: [
        "We may update these Terms of Use from time to time.",
        "Continued use of the platform after changes are posted means you accept the revised Terms.",
      ],
    },
    {
      title: "Governing law",
      content: [
        "These Terms shall be governed by and interpreted in accordance with the laws of your applicable jurisdiction, except where mandatory local law applies.",
      ],
    },
    {
      title: "Contact us",
      content: [
        "If you have questions about these Terms of Use, please contact e-Tailo using the support details listed on the website.",
        "You may also include your legal company name, address, and support email in this section.",
      ],
    },
  ];

  const outline = sections.map((section, index) => ({
    title: section.title,
    href: `#${section.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${index}`,
  }));

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MarketingNav />

      <main className="flex-1">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 md:flex-row md:py-16">
          {/* Left column: title + outline */}
          <aside className="md:w-64 md:flex-none">
            <div className="mb-6">
              <p className="text-xs font-medium uppercase tracking-wide text-primary/70">
                Legal
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight">
                Terms of Use
              </h1>
              <p className="mt-1 text-xs text-muted-foreground">
                Last updated: May 31, 2026
              </p>
            </div>

            <div className="hidden rounded-lg border bg-card/50 p-3 text-sm shadow-sm md:block">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                On this page
              </p>
              <nav className="space-y-1">
                {outline.map((item) => (
                  <button
                    key={item.href}
                    type="button"
                    onClick={() => {
                      setActiveSection(item.href);
                      const el = document.querySelector(item.href);
                      if (el) {
                        el.scrollIntoView({ behavior: "smooth", block: "start" });
                      }
                    }}
                    className={`block w-full rounded px-2 py-1 text-left text-xs transition ${
                      activeSection === item.href
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-accent/70 hover:text-accent-foreground"
                    }`}
                  >
                    {item.title}
                  </button>
                ))}
              </nav>
            </div>

            <div className="mt-4 hidden text-xs text-muted-foreground md:block">
              <span>Need help with the product? </span>
              <Link
                href="/faq"
                className="font-medium text-primary underline-offset-2 hover:underline"
              >
                Visit FAQs
              </Link>
            </div>
          </aside>

          {/* Right column: content */}
          <section className="flex-1 rounded-xl border bg-card/70 p-5 shadow-sm md:p-8">
            <div className="prose prose-sm max-w-none dark:prose-invert">
              {sections.map((section, sectionIndex) => {
                const id = `${section.title
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, "-")}-${sectionIndex}`;

                return (
                  <article key={id} id={id} className="scroll-m-24">
                    <h2 className="mb-2 text-base font-semibold tracking-tight">
                      {section.title}
                    </h2>
                    {section.content.map((paragraph, index) => (
                      <p
                        key={index}
                        className="mb-2 text-xs leading-relaxed text-muted-foreground"
                      >
                        {paragraph}
                      </p>
                    ))}
                    {sectionIndex !== sections.length - 1 && (
                      <hr className="my-4 border-dashed border-border" />
                    )}
                  </article>
                );
              })}
            </div>

            <div className="mt-6 rounded-md bg-muted/60 px-3 py-2 text-[11px] text-muted-foreground">
              These Terms of Use may be updated as our services or legal requirements
              change. Please review them periodically.
            </div>
          </section>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
