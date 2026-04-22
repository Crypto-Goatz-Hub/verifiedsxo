import { renderOgCard } from "@/lib/og"

export const runtime = "edge"
export const alt = "VerifiedSXO — The proof layer for marketing claims"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"
export default async function OgImage() {
  return renderOgCard({
    eyebrow: "The proof layer for marketing claims",
    title: "Every stat. Weighed. Proven. Public.",
    subtitle:
      "Weigh any marketing claim against 25 years of data. Prove it with live analytics. Badge the truth.",
    accent: "violet",
    stats: [
      { label: "Pipeline tiers", value: "3" },
      { label: "Trust surfaces", value: "Wall · Profile · Badge" },
      { label: "Latency", value: "<15s" },
    ],
    rightTagline: "Verified or self-attested · never guessed",
  })
}
