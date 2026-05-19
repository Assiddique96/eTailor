import type { NextConfig } from "next";

// ─── Environment variable validation ──────────────────────────────────────────
// Validated at startup so missing vars throw at build time, not at runtime.
const requiredEnvVars = [
  "DATABASE_URL",
  "JWT_SECRET",
  "RESEND_API_KEY",
  "EMAIL_FROM",
  "CRON_SECRET",
] as const;

for (const key of requiredEnvVars) {
  if (!process.env[key]) {
    throw new Error(
      `Missing required environment variable: ${key}\n` +
        `Copy .env.example to .env.local and fill in the values.`
    );
  }
}

// ─── Security headers ─────────────────────────────────────────────────────────
const securityHeaders = [
  // Prevent the page from being embedded in iframes (clickjacking)
  { key: "X-Frame-Options", value: "DENY" },
  // Don't sniff MIME types from content
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Only send Referer for same-origin requests
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Restrict powerful browser features
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  // Force HTTPS for 1 year, include subdomains
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
  // Content Security Policy
  // 'unsafe-inline' for styles is required for Tailwind's runtime; tighten once
  // CSS-in-JS is removed. Google Fonts is allowed for the font import.
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://va.vercel-scripts.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Apply to all routes
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },

  // Image optimisation: lock down allowed domains to prevent SSRF via next/image
  images: {
    remotePatterns: [],
  },

  // Recommended: fail the build on TypeScript errors
  typescript: {
    ignoreBuildErrors: false,
  },

  // Recommended: fail the build on ESLint errors

};

export default nextConfig;
