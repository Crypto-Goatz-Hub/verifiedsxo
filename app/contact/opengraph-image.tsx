import { renderOgCard, OG_RUNTIME, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og"

export const runtime = OG_RUNTIME
export const alt = "Talk to VerifiedSXO — direct line to the team."
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

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
