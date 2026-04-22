import { renderOgCard } from "@/lib/og"

export const runtime = "edge"
export const alt = "VerifiedSXO for agencies — turn every client win into a public, verifiable proof."
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"
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
