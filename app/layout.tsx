import React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import { BsChatWidget } from "@/components/bs-chat-widget"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

export const metadata: Metadata = {
  metadataBase: new URL("https://verifiedsxo.com"),
  title: "VerifiedSXO — The proof layer for marketing claims",
  description:
    "Every marketing stat, weighed against 25 years of data. Prove it with your own analytics. Earn a verified badge that lives next to your claim.",
  keywords: [
    "verified stats",
    "marketing claim verification",
    "SXO",
    "stat verification",
    "proof of performance",
    "agency reputation",
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  openGraph: {
    type: "website",
    url: "https://verifiedsxo.com",
    siteName: "VerifiedSXO",
    title: "VerifiedSXO — The proof layer for marketing claims",
    description: "Weigh any claim against 25 years of data. Prove it with your own analytics. Badge the truth.",
  },
  twitter: {
    card: "summary_large_image",
    title: "VerifiedSXO",
    description: "Verify every marketing claim.",
  },
  alternates: { canonical: "https://verifiedsxo.com" },
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
