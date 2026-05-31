export default function TermsPage() {
  const sections = [
    {
      title: "Introduction",
      content: [
        "These Terms of Use govern your access to and use of the e-Tailor website and platform.",
        "By using the service, you agree to these Terms and confirm that you are authorized to use the platform on behalf of yourself or your business.",
      ],
    },
    {
      title: "Service description",
      content: [
        "e-Tailor is a tailoring management platform designed for tailoring businesses, boutiques, stitching shops, and similar operations.",
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
        "This may include charges for additional clients beyond the free allowance, extra photos, or any other premium features described on the pricing page.",
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
        "The website, platform, branding, layout, software, and original content belong to e-Tailor or its licensors.",
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
        "The service is provided on an \"as is\" and \"as available\" basis to the fullest extent permitted by law.",
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
        "If you have questions about these Terms of Use, please contact e-Tailor using the support details listed on the website.",
        "You may also include your legal company name, address, and support email in this section.",
      ],
    },
  ];

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">Terms of Use</h1>
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
