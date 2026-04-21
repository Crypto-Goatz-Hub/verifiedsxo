import { renderOgCard, OG_RUNTIME, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og"

export const runtime = OG_RUNTIME
export const alt = "VerifiedSXO pricing — score free, verify on Pro, own the trust badge for $8/mo."
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default async function OgImage() {
  return renderOgCard({
    eyebrow: "Pricing — built for agencies",
    title: "Start free. Badge for $8/mo.",
    subtitle:
      "Public profile, unlimited claims, LinkedIn-ready verified stamp. No per-seat tax. No setup calls.",
    accent: "emerald",
    stats: [
      { label: "Free tier", value: "1 claim/day" },
      { label: "Public badge", value: "$8/mo" },
      { label: "Scale", value: "Unlimited" },
    ],
    rightTagline: "Cancel anytime · Stripe billing",
  })
}
