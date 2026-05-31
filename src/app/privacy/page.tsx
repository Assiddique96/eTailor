export default function PrivacyPage() {
  const sections = [
    {
      title: "Introduction",
      content: [
        "eTailo (“we,” “our,” or “us”) provides a digital tailoring management platform that helps businesses manage customers, measurements, orders, invoices, payments, and catalog photos.",
        "This Privacy Policy explains how we collect, use, store, share, and protect information when you use our website and services.",
        "By using eTailo, you agree to the practices described in this policy.",
      ],
    },
    {
      title: "Information we collect",
      content: [
        "We collect information you provide directly when you create an account, add customers or staff, record measurements, create orders or invoices, upload catalog photos, or contact support.",
        "This may include your name, business name, email address, phone number, login credentials, account settings, customer details, order information, payment records, photos, and other business data you choose to store in the platform.",
        "We may also collect technical and usage data such as IP address, browser type, device type, operating system, pages viewed, time spent on pages, session activity, click behavior, error logs, crash reports, and performance or security data.",
      ],
    },
    {
      title: "How we use information",
      content: [
        "We use the information we collect to provide and operate the core eTailo service, including customer management, measurement storage, order tracking, invoicing, payment recording, catalog management, and reporting.",
        "We also use data to authenticate users, manage permissions, secure the platform, prevent abuse, troubleshoot errors, improve performance, develop new features, and communicate important updates or support notices.",
        "We do not use your customer measurement data for unrelated marketing purposes.",
      ],
    },
    {
      title: "Data sharing",
      content: [
        "We may share information with trusted service providers that help us host, store, analyze, or secure the platform, subject to contractual obligations designed to protect your data.",
        "We may also disclose information when required by law, regulation, court order, or when necessary to protect our rights, users, or systems.",
        "We do not sell personal data as a business model.",
      ],
    },
    {
      title: "Data retention",
      content: [
        "We keep personal and business data only for as long as necessary to provide the service, comply with legal obligations, resolve disputes, and maintain legitimate business records.",
        "If your account is deleted or a valid deletion request is approved, we will remove or anonymize data within a reasonable period, unless we are required to keep it for legal reasons.",
      ],
    },
    {
      title: "Security",
      content: [
        "We use reasonable administrative, technical, and organizational safeguards to protect information against unauthorized access, loss, misuse, or alteration.",
        "However, no internet-based service can guarantee absolute security.",
        "You are responsible for protecting your login credentials and limiting access to authorized staff members.",
      ],
    },
    {
      title: "Your rights",
      content: [
        "Depending on your location, you may have the right to access your data, correct inaccurate information, request deletion, restrict or object to certain processing, and withdraw consent where applicable.",
        "To exercise these rights, contact us using the details in the Contact section below.",
      ],
    },
    {
      title: "Children’s privacy",
      content: [
        "eTailo is intended for business users and is not directed to children.",
        "We do not knowingly collect personal information from children.",
        "If we become aware that a child’s information has been submitted, we will take reasonable steps to delete it.",
      ],
    },
    {
      title: "International transfers",
      content: [
        "Your information may be stored and processed in countries other than your own.",
        "Where required, we apply appropriate safeguards to protect information during international transfers.",
      ],
    },
    {
      title: "Cookies and tracking",
      content: [
        "We use cookies and similar technologies to keep the service working properly, understand usage, improve performance, and support security.",
        "For more details, please review our Cookie Policy.",
      ],
    },
    {
      title: "Policy changes",
      content: [
        "We may update this Privacy Policy from time to time to reflect changes in our practices, services, or legal obligations.",
        "When we do, we will update the effective date and publish the revised version on our website.",
        "Continued use of the platform after any update means you accept the revised policy.",
      ],
    },
    {
      title: "Compliance",
      content: [
        "We aim to comply with applicable privacy and data protection laws, including laws that may apply in your region.",
        "If you have questions about GDPR, privacy rights, or how your data is handled, contact us through the support channel.",
      ],
    },
    {
      title: "Contact",
      content: [
        "If you have questions about this Privacy Policy, please contact us at support.",
        "You can also use the contact details listed on our website for privacy-related requests.",
      ],
    },
  ];

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">Privacy Policy</h1>
      <p className="text-sm text-secondary">Last updated: May 31, 2026</p>

      <div className="prose max-w-none space-y-6">
        {sections.map((section) => (
          <div key={section.title}>
            <h2>{section.title}</h2>
            {section.content.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
