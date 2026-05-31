"use client";
/**
 * JobsDonutChart
 *
 * Extracted from dashboard/page.tsx. SVG-based with ARIA roles.
 * Nice-to-have upgrade: swap for Recharts <PieChart> for tooltips + animation.
 */
import { useState } from "react";

type JobStatusPoint = { status: string; count: number };

const JOB_COLORS = ["#4f46e5","#0284c7","#7c3aed","#059669","#d97706","#dc2626"];

export function JobsDonutChart({ data }: { data: JobStatusPoint[] }) {
  const [hovered, setHovered] = useState<string | null>(null);
  if (!data.length) return null;

  const total = data.reduce((s, d) => s + d.count, 0);
  if (total === 0) return <p className="text-sm text-muted text-center py-8">No jobs yet.</p>;

  const R = 60; const CX = 80; const CY = 80;
  let cumAngle = -Math.PI / 2;

  const slices = data.map((d, i) => {
    const angle = (d.count / total) * 2 * Math.PI;
    const x1 = CX + R * Math.cos(cumAngle);
    const y1 = CY + R * Math.sin(cumAngle);
    cumAngle += angle;
    const x2 = CX + R * Math.cos(cumAngle);
    const y2 = CY + R * Math.sin(cumAngle);
    const largeArc = angle > Math.PI ? 1 : 0;
    const path = `M ${CX} ${CY} L ${x1} ${y1} A ${R} ${R} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    return { ...d, path, color: JOB_COLORS[i % JOB_COLORS.length] };
  });

  const hov = slices.find((s) => s.status === hovered);

  return (
    <div className="flex items-center gap-6 flex-wrap">
      <svg
        viewBox="0 0 160 160"
        style={{ width: 140, height: 140, flexShrink: 0 }}
        role="img"
        aria-label="Jobs by status donut chart"
      >
        <title>Jobs by status</title>
        {slices.map((s) => (
          <path
            key={s.status}
            d={s.path}
            fill={s.color}
            opacity={hovered && hovered !== s.status ? 0.4 : 1}
            onMouseEnter={() => setHovered(s.status)}
            onMouseLeave={() => setHovered(null)}
            style={{ cursor: "pointer", transition: "opacity 150ms" }}
            role="graphics-symbol"
            aria-label={`${s.status}: ${s.count}`}
          >
            <title>{s.status}: {s.count}</title>
          </path>
        ))}
        {/* Donut hole */}
        <circle cx={CX} cy={CY} r={R * 0.55} fill="var(--bg-card)" />
        <text x={CX} y={CY - 6} textAnchor="middle" fontSize="18" fontWeight="600" fill="var(--text-primary)">
          {hov ? hov.count : total}
        </text>
        <text x={CX} y={CY + 10} textAnchor="middle" fontSize="9" fill="var(--text-muted)">
          {hov ? hov.status : "total"}
        </text>
      </svg>

      <div className="flex flex-col gap-1.5 flex-1 min-w-0" role="list" aria-label="Job status legend">
        {slices.map((s) => (
          <div
            key={s.status}
            className="flex items-center justify-between gap-2 cursor-pointer"
            onMouseEnter={() => setHovered(s.status)}
            onMouseLeave={() => setHovered(null)}
            role="listitem"
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: s.color }} aria-hidden />
              <span className="text-xs text-secondary truncate">{s.status}</span>
            </div>
            <span className="text-xs font-medium shrink-0">{s.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}



