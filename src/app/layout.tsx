import type { Metadata } from "next";
import { DM_Sans, DM_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";
import { SWRProvider } from "@/components/swr-provider";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next"

// Self-hosted via next/font — no render-blocking external request, no layout shift.
const dmSans = DM_Sans({
  subsets: ["latin"],
  axes: ["opsz"],
  variable: "--font-sans",
  display: "swap",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

import type { Viewport } from 'next';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  themeColor: '#4f46e5',
};

export const metadata: Metadata = {
  title: {
    default: "eTailor — Tailoring Management Platform",
    template: "%s · eTailor",
  },
  description: "Manage customers, jobs, billing, and team operations for your tailoring shop.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
    ],
    apple: [
      { url: "/favicon.svg" },
    ],
  },
  manifest: "/manifest.json",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f6f3" },
    { media: "(prefers-color-scheme: dark)",  color: "#0f0e0c" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${dmMono.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <SWRProvider>
          <ToastProvider>{children}</ToastProvider>
        </SWRProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
