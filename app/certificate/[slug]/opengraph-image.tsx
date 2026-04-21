import { renderOgCard, OG_RUNTIME, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og"

export const runtime = OG_RUNTIME
export const alt = "Official VerifiedSXO verification certificate"
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

interface Props { params: { slug: string } }

export default async function OgImage({ params }: Props) {
  return renderOgCard({
    eyebrow: "Official certificate",
    title: "Sealed. Signed. Public.",
    subtitle:
      "A permanent record of an independently verified marketing claim — open the page for the full methodology and evidence chain.",
    accent: "emerald",
    verifiedBadge: true,
    stats: [
      { label: "Verification", value: "Live data" },
      { label: "Signer", value: "VerifiedSXO" },
      { label: "Status", value: "Public" },
    ],
    rightTagline: `verifiedsxo.com/certificate/${params.slug}`,
  })
}
