/** Public portal layout — no auth, no shell. Inherits root CSS and providers. */
export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
