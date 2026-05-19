/**
 * The /measure/* routes are public (no auth).
 * They inherit the root layout's CSS and SWR provider but do NOT render
 * the portal shell, so customers see only the measurement form.
 */
export default function MeasureLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
