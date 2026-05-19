"use client";

/**
 * Body measurement diagram.
 * Annotated front-view SVG silhouette (male or female) with measurement
 * hotspots that highlight when the corresponding input is focused or filled.
 * No WebGL, no dependencies — works in every browser.
 */

type Gender = "MALE" | "FEMALE" | "OTHER";

type Props = {
  gender: Gender;
  activeField?: string | null;
  values: Record<string, string>;
};

type Hotspot = {
  fieldName: string;
  label: string;
  lx: number; ly: number; // label position
  tx: number; ty: number; // tip on body
  side: "left" | "right";
};

const MALE_HOTSPOTS: Hotspot[] = [
  { fieldName: "neckCm",     label: "Neck",     lx: 158, ly: 110, tx: 130, ty: 118, side: "right" },
  { fieldName: "shoulderCm", label: "Shoulder",  lx:  30, ly: 145, tx:  78, ty: 148, side: "left"  },
  { fieldName: "chestCm",    label: "Chest",     lx:  30, ly: 178, tx:  75, ty: 172, side: "left"  },
  { fieldName: "sleeveCm",   label: "Sleeve",    lx: 162, ly: 200, tx: 148, ty: 208, side: "right" },
  { fieldName: "waistCm",    label: "Waist",     lx:  30, ly: 220, tx:  80, ty: 215, side: "left"  },
  { fieldName: "inseamCm",   label: "Inseam",   lx: 158, ly: 310, tx: 118, ty: 305, side: "right" },
  { fieldName: "outseamCm",  label: "Outseam",  lx:  30, ly: 280, tx:  76, ty: 275, side: "left"  },
];

const FEMALE_HOTSPOTS: Hotspot[] = [
  { fieldName: "neckCm",     label: "Neck",        lx: 158, ly: 108, tx: 128, ty: 116, side: "right" },
  { fieldName: "shoulderCm", label: "Shoulder",     lx:  30, ly: 140, tx:  76, ty: 144, side: "left"  },
  { fieldName: "chestCm",    label: "Chest / Bust", lx:  30, ly: 172, tx:  74, ty: 170, side: "left"  },
  { fieldName: "sleeveCm",   label: "Sleeve",       lx: 162, ly: 198, tx: 148, ty: 206, side: "right" },
  { fieldName: "waistCm",    label: "Waist",        lx:  30, ly: 210, tx:  76, ty: 208, side: "left"  },
  { fieldName: "hipCm",      label: "Hip",          lx:  30, ly: 248, tx:  78, ty: 245, side: "left"  },
];

function MaleBody() {
  return (
    <g>
      <ellipse cx="110" cy="60" rx="28" ry="34" fill="#e7e5e4" stroke="#a8a29e" strokeWidth="1.5" />
      <rect x="98" y="90" width="24" height="22" rx="4" fill="#e7e5e4" stroke="#a8a29e" strokeWidth="1.5" />
      <path d="M68 110 Q55 115 52 135 L48 260 Q48 270 58 272 L162 272 Q172 270 172 260 L168 135 Q165 115 152 110 Z" fill="#e7e5e4" stroke="#a8a29e" strokeWidth="1.5" />
      <path d="M68 112 Q50 118 44 145 L36 225 Q34 238 40 240 L52 240 Q58 238 60 225 L68 155 Z" fill="#e7e5e4" stroke="#a8a29e" strokeWidth="1.5" />
      <path d="M152 112 Q170 118 176 145 L184 225 Q186 238 180 240 L168 240 Q162 238 160 225 L152 155 Z" fill="#e7e5e4" stroke="#a8a29e" strokeWidth="1.5" />
      <ellipse cx="44" cy="244" rx="10" ry="14" fill="#e7e5e4" stroke="#a8a29e" strokeWidth="1.5" />
      <ellipse cx="176" cy="244" rx="10" ry="14" fill="#e7e5e4" stroke="#a8a29e" strokeWidth="1.5" />
      <path d="M78 270 L68 390 Q67 398 78 398 L100 398 Q110 398 110 390 L110 270 Z" fill="#e7e5e4" stroke="#a8a29e" strokeWidth="1.5" />
      <path d="M142 270 L152 390 Q153 398 142 398 L120 398 Q110 398 110 390 L110 270 Z" fill="#e7e5e4" stroke="#a8a29e" strokeWidth="1.5" />
      <line x1="68" y1="130" x2="152" y2="130" stroke="#c7c3bf" strokeWidth="1" strokeDasharray="3 3" />
      <line x1="62" y1="168" x2="158" y2="168" stroke="#c7c3bf" strokeWidth="1" strokeDasharray="3 3" />
      <line x1="60" y1="212" x2="160" y2="212" stroke="#c7c3bf" strokeWidth="1" strokeDasharray="3 3" />
    </g>
  );
}

function FemaleBody() {
  return (
    <g>
      <ellipse cx="110" cy="58" rx="26" ry="32" fill="#e7e5e4" stroke="#a8a29e" strokeWidth="1.5" />
      <path d="M84 46 Q82 30 110 26 Q138 30 136 46" fill="none" stroke="#c7c3bf" strokeWidth="3" strokeLinecap="round" />
      <rect x="100" y="86" width="20" height="20" rx="4" fill="#e7e5e4" stroke="#a8a29e" strokeWidth="1.5" />
      <path d="M72 104 Q56 110 52 132 L50 162 Q50 168 55 170 L55 200 Q52 215 50 230 Q50 244 56 248 L80 264 Q95 270 110 270 Q125 270 140 264 L164 248 Q170 244 170 230 Q168 215 165 200 L165 170 Q170 168 170 162 L168 132 Q164 110 148 104 Z" fill="#e7e5e4" stroke="#a8a29e" strokeWidth="1.5" />
      <path d="M55 165 Q82 175 110 175 Q138 175 165 165" fill="none" stroke="#c7c3bf" strokeWidth="1" strokeDasharray="3 3" />
      <line x1="57" y1="206" x2="163" y2="206" stroke="#c7c3bf" strokeWidth="1" strokeDasharray="3 3" />
      <line x1="55" y1="242" x2="165" y2="242" stroke="#c7c3bf" strokeWidth="1" strokeDasharray="3 3" />
      <path d="M72 106 Q54 114 46 140 L38 220 Q36 232 42 234 L54 234 Q60 232 62 220 L70 148 Z" fill="#e7e5e4" stroke="#a8a29e" strokeWidth="1.5" />
      <path d="M148 106 Q166 114 174 140 L182 220 Q184 232 178 234 L166 234 Q160 232 158 220 L150 148 Z" fill="#e7e5e4" stroke="#a8a29e" strokeWidth="1.5" />
      <ellipse cx="40" cy="238" rx="9" ry="12" fill="#e7e5e4" stroke="#a8a29e" strokeWidth="1.5" />
      <ellipse cx="180" cy="238" rx="9" ry="12" fill="#e7e5e4" stroke="#a8a29e" strokeWidth="1.5" />
      <path d="M80 268 L65 390 Q63 398 76 398 L100 398 Q110 398 110 390 L110 268 Z" fill="#e7e5e4" stroke="#a8a29e" strokeWidth="1.5" />
      <path d="M140 268 L155 390 Q157 398 144 398 L120 398 Q110 398 110 390 L110 268 Z" fill="#e7e5e4" stroke="#a8a29e" strokeWidth="1.5" />
    </g>
  );
}

function HotspotAnnotation({
  spot, active, filled,
}: {
  spot: Hotspot; active: boolean; filled: boolean;
}) {
  const color      = active ? "#4f46e5" : filled ? "#059669" : "#a8a29e";
  const dotR       = active ? 5 : 4;
  const strokeW    = active ? 1.5 : 1;
  const textAnchor = spot.side === "right" ? "start" : "end";

  return (
    <g>
      <line x1={spot.lx} y1={spot.ly} x2={spot.tx} y2={spot.ty}
        stroke={color} strokeWidth={strokeW} strokeDasharray={active ? "0" : "3 2"} />
      <circle cx={spot.tx} cy={spot.ty} r={dotR} fill={color} opacity={active ? 1 : 0.75} />
      {active && (
        <circle cx={spot.tx} cy={spot.ty} r={dotR + 4}
          fill="none" stroke="#4f46e5" strokeWidth="1.5" opacity="0.35" />
      )}
      <text x={spot.lx} y={spot.ly + 4} textAnchor={textAnchor}
        fontSize="10" fontFamily="system-ui, sans-serif"
        fontWeight={active ? "600" : "400"} fill={color}>
        {spot.label}
      </text>
    </g>
  );
}

export function BodyDiagram({ gender, activeField, values }: Props) {
  const hotspots = gender === "FEMALE" ? FEMALE_HOTSPOTS : MALE_HOTSPOTS;

  const filledFields = new Set(
    Object.entries(values)
      .filter(([, v]) => v && Number(v) > 0)
      .map(([k]) => k)
  );

  const genderLabel =
    gender === "FEMALE" ? "Women's" :
    gender === "MALE"   ? "Men's"   : "General";

  return (
    <div aria-hidden="true" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase",
        letterSpacing: "0.06em", color: "var(--text-muted)", marginBottom: 8 }}>
        {genderLabel} measurements
      </p>

      <svg viewBox="0 0 220 410" width="100%" style={{ maxWidth: 210, overflow: "visible" }}>
        {gender === "FEMALE" ? <FemaleBody /> : <MaleBody />}
        {hotspots.map((spot) => (
          <HotspotAnnotation
            key={spot.fieldName}
            spot={spot}
            active={activeField === spot.fieldName}
            filled={filledFields.has(spot.fieldName)}
          />
        ))}
      </svg>

      <div style={{ display: "flex", gap: 14, marginTop: 6 }}>
        {[
          { color: "#059669", label: "Filled" },
          { color: "#4f46e5", label: "Active" },
          { color: "#a8a29e", label: "Empty"  },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 4,
            fontSize: 10, color: "var(--text-muted)" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%",
              background: color, display: "inline-block" }} />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
