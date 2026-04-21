import { renderOgCard, OG_RUNTIME, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og"

export const runtime = OG_RUNTIME
export const alt = "VerifiedSXO — The proof layer for marketing claims"
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

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
