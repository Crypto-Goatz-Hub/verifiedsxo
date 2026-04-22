import { renderOgCard } from "@/lib/og"

export const runtime = "edge"
export const alt = "VerifiedSXO badge examples — one script, three variants, drop-in anywhere."
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"
export default async function OgImage() {
  return renderOgCard({
    eyebrow: "Trust in one tag",
    title: "One script. Three variants.",
    subtitle:
      "Inline pill, circular stamp, or full banner. Shadow-DOM scoped, tamper-evident, click-through to methodology.",
    accent: "cyan",
    stats: [
      { label: "Variants", value: "3" },
      { label: "Dependencies", value: "0" },
      { label: "Integrates in", value: "1 line" },
    ],
    rightTagline: "verifiedsxo.com/badge-examples",
  })
}
