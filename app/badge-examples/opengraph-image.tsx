import { renderOgCard, OG_RUNTIME, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og"

export const runtime = OG_RUNTIME
export const alt = "VerifiedSXO badge examples — one script, three variants, drop-in anywhere."
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

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
