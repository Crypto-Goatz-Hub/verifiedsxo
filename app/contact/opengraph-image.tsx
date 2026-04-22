import { renderOgCard } from "@/lib/og"

export const runtime = "edge"
export const alt = "Talk to VerifiedSXO — direct line to the team."
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"
export default async function OgImage() {
  return renderOgCard({
    eyebrow: "Get in touch",
    title: "Talk to the people behind the badge.",
    subtitle:
      "Questions, integrations, partnerships — we read every message and answer within one business day.",
    accent: "emerald",
    rightTagline: "verifiedsxo.com/contact",
  })
}
