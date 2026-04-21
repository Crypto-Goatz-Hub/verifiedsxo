import React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import { BsChatWidget } from "@/components/bs-chat-widget"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

export const metadata: Metadata = {
  metadataBase: new URL("https://verifiedsxo.com"),
  title: {
    default: "VerifiedSXO — Every marketing claim, on the record.",
    template: "%s | VerifiedSXO",
  },
  description:
    "The BS meter for marketing claims. Score any stat in 15 seconds, verify with live analytics, and earn a badge that spreads proof — not hype.",
  keywords: [
    "verified marketing stats",
    "marketing claim verification",
    "SXO",
    "search experience optimization",
    "proof of performance",
    "agency reputation",
    "verify SEO claims",
    "verify ARR claims",
    "BS meter",
    "trust badge",
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-video-preview": -1, "max-snippet": -1 },
  },
  openGraph: {
    type: "website",
    url: "https://verifiedsxo.com",
    siteName: "VerifiedSXO",
    locale: "en_US",
    title: "VerifiedSXO — Every marketing claim, on the record.",
    description:
      "Score any marketing stat in 15 seconds. Verify with live analytics. Badge the truth — or flag the BS.",
  },
  twitter: {
    card: "summary_large_image",
    site: "@verifiedsxo",
    creator: "@verifiedsxo",
    title: "VerifiedSXO — Every marketing claim, on the record.",
    description:
      "Score any marketing stat in 15 seconds. Verify with live analytics. Badge the truth.",
  },
  alternates: { canonical: "https://verifiedsxo.com" },
  applicationName: "VerifiedSXO",
  category: "technology",
  creator: "VerifiedSXO",
  publisher: "VerifiedSXO",
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased bg-background text-foreground">
        {children}
        <BsChatWidget />
      </body>
    </html>
  )
}
