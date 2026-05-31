import Link from "next/link";

const LINKS = {
  Product: [
    { label: "Features", href: "/#features" },
    { label: "Pricing", href: "/#pricing" },
    { label: "FAQ", href: "/faq" },
  ],
  Company: [
    { label: "About us", href: "/about" },
    { label: "Contact", href: "/contact" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
  ],
};

export function MarketingFooter() {
  return (
    <footer className="border-t mt-20" style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}>
      <div className="mx-auto max-w-6xl px-5 py-12">
        <div className="grid gap-8 grid-cols-2 md:grid-cols-4 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="h-8 w-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">eT</div>
              <span className="font-semibold">eTailo</span>
            </div>
            <p className="text-sm text-secondary leading-relaxed max-w-xs">
              The all-in-one management platform built exclusively for tailoring businesses.
            </p>
          </div>

          {Object.entries(LINKS).map(([group, links]) => (
            <div key={group}>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-3">{group}</p>
              <ul className="space-y-2">
                {links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-sm text-secondary hover:text-primary transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-3" style={{ borderColor: "var(--border)" }}>
          <p className="text-xs text-muted">© {new Date().getFullYear()} eTailo. All rights reserved.</p>
          <p className="text-xs text-muted">Built for tailors, by people who care about craft.</p>
        </div>
      </div>
    </footer>
  );
}
