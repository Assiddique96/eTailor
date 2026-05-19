import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "eTailor — Tailoring Management Platform";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #1c1917 0%, #292524 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 96,
            height: 96,
            borderRadius: 24,
            background: "#4f46e5",
            fontSize: 48,
            fontWeight: 700,
            color: "#fff",
            marginBottom: 32,
          }}
        >
          eT
        </div>
        <div style={{ fontSize: 64, fontWeight: 700, color: "#fafaf9", letterSpacing: -2 }}>
          eTailor
        </div>
        <div style={{ fontSize: 28, color: "#a8a29e", marginTop: 16 }}>
          Tailoring Management Platform
        </div>
      </div>
    ),
    { ...size }
  );
}
