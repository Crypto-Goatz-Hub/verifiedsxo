import { renderOgCard, OG_RUNTIME, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og"

export const runtime = OG_RUNTIME
export const alt = "VerifiedSXO for agencies — turn every client win into a public, verifiable proof."
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default async function OgImage() {
  return renderOgCard({
    eyebrow: "For agencies",
    title: "Your case studies, on the record.",
    subtitle:
      "Invite a client. Verify their stat with their analytics. Earn a badge tied to a public agency profile — shareable, embeddable, unforgeable.",
    accent: "violet",
    stats: [
      { label: "Onboard time", value: "< 5 min" },
      { label: "Public profile", value: "yes" },
      { label: "Badge on your site", value: "1 script" },
    ],
    rightTagline: "verifiedsxo.com/for-agencies",
  })
}
