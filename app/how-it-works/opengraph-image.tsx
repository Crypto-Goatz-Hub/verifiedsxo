import { renderOgCard } from "@/lib/og"

export const runtime = "edge"
export const alt = "How VerifiedSXO works — three-tier AI pipeline, live data, public badge."
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"
export default async function OgImage() {
  return renderOgCard({
    eyebrow: "How it works",
    title: "Score. Verify. Badge. In 15s.",
    subtitle:
      "A three-tier AI pipeline weighs every claim against 25 years of marketing data, then checks it against live analytics.",
    accent: "violet",
    stats: [
      { label: "Step 1", value: "AI score" },
      { label: "Step 2", value: "Live data" },
      { label: "Step 3", value: "Public badge" },
    ],
    rightTagline: "Methodology · verifiedsxo.com",
  })
}
