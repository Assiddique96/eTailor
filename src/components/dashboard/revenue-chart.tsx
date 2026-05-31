"use client";
/**
 * RevenueBarChart
 *
 * Replaces the inline SVG chart in dashboard/page.tsx.
 * Extracted here so the page file stays slim and the chart can be unit-tested.
 * Uses SVG (no external dependency) with proper ARIA roles for accessibility.
 *
 * Nice-to-have upgrade: swap for Recharts <BarChart> for tooltips + animation:
 *   npm install recharts
 *   import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
 */

type RevenuePoint = { month: string; revenue: number };

function fmtMoney(v: number, currency: string) {
  if (v >= 1_000_000) return `${currency}${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `${currency}${(v / 1_000).toFixed(0)}k`;
  return `${currency}${v.toFixed(0)}`;
}

export function RevenueBarChart({
  data,
  currency = "₦",
}: {
  data: RevenuePoint[];
  currency?: string;
}) {
  if (!data.length) return null;
  const max   = Math.max(...data.map((d) => d.revenue), 1);
  const W     = 600; const H = 180;
  const PAD   = { t: 16, r: 16, b: 40, l: 56 };
  const chartW = W - PAD.l - PAD.r;
  const chartH = H - PAD.t - PAD.b;
  const barW   = (chartW / data.length) * 0.55;
  const gap    = chartW / data.length;

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => ({
    val: max * t,
    y:   PAD.t + chartH * (1 - t),
  }));

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      style={{ height: 200 }}
      role="img"
      aria-label="Revenue bar chart for the last 6 months"
    >
      <title>Revenue — last 6 months</title>

      {/* Grid lines */}
      {yTicks.map((t) => (
        <g key={t.val}>
          <line
            x1={PAD.l} x2={W - PAD.r} y1={t.y} y2={t.y}
            stroke="var(--border)" strokeWidth="1"
          />
          <text x={PAD.l - 6} y={t.y + 4} textAnchor="end" fontSize="10" fill="var(--text-muted)">
            {fmtMoney(t.val, currency)}
          </text>
        </g>
      ))}

      {/* Bars */}
      {data.map((d, i) => {
        const barH = Math.max((d.revenue / max) * chartH, d.revenue > 0 ? 4 : 0);
        const x    = PAD.l + i * gap + (gap - barW) / 2;
        const y    = PAD.t + chartH - barH;
        return (
          <g key={d.month} role="graphics-symbol" aria-label={`${d.month}: ${fmtMoney(d.revenue, currency)}`}>
            <rect x={x} y={y} width={barW} height={barH} rx="4" fill="var(--brand)" opacity="0.85">
              <title>{d.month}: {fmtMoney(d.revenue, currency)}</title>
            </rect>
            {d.revenue > 0 && (
              <text x={x + barW / 2} y={y - 4} textAnchor="middle" fontSize="9" fill="var(--text-secondary)">
                {fmtMoney(d.revenue, currency)}
              </text>
            )}
            <text x={x + barW / 2} y={H - PAD.b + 14} textAnchor="middle" fontSize="10" fill="var(--text-muted)">
              {d.month}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
