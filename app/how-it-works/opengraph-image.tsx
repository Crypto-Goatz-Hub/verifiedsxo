import { renderOgCard, OG_RUNTIME, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og"

export const runtime = OG_RUNTIME
export const alt = "How VerifiedSXO works — three-tier AI pipeline, live data, public badge."
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

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
