import { renderOgCard } from "@/lib/og"

export const runtime = "edge"
export const alt = "The Claims Wall — every marketing claim, public the second it's submitted."
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"
export default async function OgImage() {
  return renderOgCard({
    eyebrow: "The Claims Wall · live feed",
    title: "Every claim, the moment it lands.",
    subtitle:
      "Score. Status. Agency. On the record. Copy any claim with one click — or filter to verified agencies only.",
    accent: "cyan",
    stats: [
      { label: "Updates", value: "Live" },
      { label: "Filter", value: "Verified" },
      { label: "Cost to you", value: "$0" },
    ],
    rightTagline: "verifiedsxo.com/wall",
  })
}
