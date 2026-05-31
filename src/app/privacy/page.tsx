export default function PrivacyPage() {
  const sections = [
    {
      title: "Introduction",
      content: [
        "eTailo (“we,” “our,” or “us”) provides a digital tailoring management platform that helps businesses manage customers, measurements, orders, invoices, payments, and catalog photos.",
        "This Privacy Policy explains how we collect, use, store, share, and protect your information when you use our website and services.",
        "By using eTailo, you agree to the practices described in this policy. If you have questions, see our FAQ section or contact support.",
      ],
    },
    {
      title: "Information We Collect",
      content: [
        "Account & business information: When you create an account, we collect your name, business name, email address, phone number, login credentials, and account settings.",
        "Customer & order data: You may add customer details, record body measurements, create orders and invoices, track payments, and upload catalog photos. All this business data is stored in your account.",
        "Technical & usage data: We automatically collect IP address, browser type, device type, operating system, pages viewed, time spent on pages, session activity, click behavior, error logs, crash reports, and performance or security data.",
      ],
    },
    {
      title: "How We Use Your Information",
      content: [
        "Service operations: We use your data to provide core eTailo features including customer management, measurement storage, order tracking, invoicing, payment recording, catalog management, and reporting.",
        "Account & security: We use data to authenticate users, manage staff permissions, secure the platform, prevent abuse, troubleshoot errors, and protect against unauthorized access.",
        "Product improvements & communication: We analyze usage data to improve performance, develop new features, and send important updates or support notices.",
        "No unrelated marketing: We do not use your customer measurement data or business information for unrelated marketing purposes.",
      ],
    },
    {
      title: "Data Sharing & Third Parties",
      content: [
        "Service providers: We share information with trusted vendors who help us host, store, analyze, or secure the platform. These partners are bound by contractual obligations to protect your data.",
        "Legal requirements: We may disclose information when required by law, regulation, court order, or when necessary to protect our rights, users, or systems.",
        "No sale of data: We do not sell personal data as a business model.",
      ],
    },
    {
      title: "Data Retention",
      content: [
        "We keep personal and business data only as long as necessary to provide the service, comply with legal obligations, resolve disputes, and maintain legitimate business records.",
        "Account deletion: If you delete your account or submit a valid deletion request, we will remove or anonymize your data within a reasonable period, unless law requires us to retain it.",
      ],
    },
    {
      title: "Security Measures",
      content: [
        "We use reasonable administrative, technical, and organizational safeguards to protect information against unauthorized access, loss, misuse, or alteration.",
        "No guarantee: However, no internet-based service can guarantee absolute security.",
        "Your responsibility: You are responsible for protecting your login credentials and limiting access to authorized staff members only.",
      ],
    },
    {
      title: "Your Privacy Rights",
      content: [
        "Depending on your location, you may have the right to access your data, correct inaccurate information, request deletion, restrict or object to certain processing, and withdraw consent where applicable.",
        "To exercise these rights, contact us at support or use the contact details listed on our website for privacy-related requests.",
      ],
    },
    {
      title: "Children's Privacy",
      content: [
        "eTailo is intended for business users (tailors, clothing businesses) and is not directed to children under 13.",
        "We do not knowingly collect personal information from children.",
        "If we become aware that a child's information has been submitted, we will take reasonable steps to delete it.",
      ],
    },
    {
      title: "International Data Transfers",
      content: [
        "Your information may be stored and processed in countries other than your own, including cloud hosting servers.",
        "Where required by law, we apply appropriate safeguards (such as standard contractual clauses) to protect information during international transfers.",
      ],
    },
    {
      title: "Cookies & Tracking Technologies",
      content: [
        "We use cookies and similar technologies to keep the service working properly (for example, staying logged in), understand usage patterns, improve performance, and support security.",
        "You can control cookie settings through your browser. For more details, please review our Cookie Policy.",
      ],
    },
    {
      title: "Policy Updates",
      content: [
        "We may update this Privacy Policy from time to time to reflect changes in our practices, services, or legal obligations.",
        "When we update the policy, we will update the effective date and publish the revised version on our website.",
        "Continued use of the platform after any update means you accept the revised policy.",
      ],
    },
    {
      title: "Compliance With Privacy Laws",
      content: [
        "We aim to comply with applicable privacy and data protection laws, including GDPR, CCPA, and laws that may apply in your region.",
        "If you have questions about GDPR, privacy rights, or how your data is handled, contact us through the support channel.",
      ],
    },
    {
      title: "Contact Us",
      content: [
        "If you have questions about this Privacy Policy, please contact us at support.",
        "You can also use the contact details listed on our website for privacy-related requests, data access/deletion requests, or to report privacy concerns.",
      ],
    },
  ];

  const outline = sections.map((section, index) => ({
    title: section.title,
    href: `#${section.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${index}`,
  }));

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 md:flex-row md:py-16">
        {/* Left column: Page title, meta, and outline */}
        <aside className="md:w-64 md:flex-none">
          <div className="mb-6">
            <p className="text-xs font-medium uppercase tracking-wide text-primary/70">
              Legal
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">
              Privacy Policy
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Last updated: May 31, 2026
            </p>
          </div>

          {/* Outline / quick navigation */}
          <div className="hidden rounded-lg border bg-card/50 p-3 text-sm shadow-sm md:block">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              On this page
            </p>
            <nav className="space-y-1">
              {outline.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="block rounded px-2 py-1 text-xs text-muted-foreground transition hover:bg-accent hover:text-accent-foreground"
                >
                  {item.title}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        {/* Right column: Content */}
        <main className="flex-1 rounded-xl border bg-card/70 p-5 shadow-sm md:p-8">
          <div className="prose prose-sm max-w-none dark:prose-invert">
            {sections.map((section, sectionIndex) => {
              const id = `${section.title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")}-${sectionIndex}`;

              return (
                <section key={section.title} id={id} className="scroll-m-24">
                  <h2 className="mb-2 text-base font-semibold tracking-tight">
                    {section.title}
                  </h2>
                  {section.content.map((paragraph, index) => (
                    <p key={index} className="mb-2 text-xs leading-relaxed text-muted-foreground">
                      {paragraph}
                    </p>
                  ))}
                  {sectionIndex !== sections.length - 1 && (
                    <hr className="my-4 border-dashed border-border" />
                  )}
                </section>
              );
            })}
          </div>

          {/* Footer note */}
          <div className="mt-6 rounded-md bg-muted/60 px-3 py-2 text-[11px] text-muted-foreground">
            This Privacy Policy is provided for transparency and may be updated as
            our services or legal requirements change.
          </div>
        </main>
      </div>
    </div>
  );
}
