import { renderOgCard } from "@/lib/og"

export const runtime = "edge"
export const alt = "Independently verified marketing claim — VerifiedSXO"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"
interface Props { params: { slug: string } }

async function loadBadgeBundle(slug: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  try {
    const r = await fetch(
      `${url}/rest/v1/vsxo_badges?slug=eq.${encodeURIComponent(slug)}&select=claim_id,verification_id,self_claim,public_visible&limit=1`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: "no-store" },
    )
    const rows = await r.json()
    const b = Array.isArray(rows) && rows[0]
    if (!b || !b.public_visible) return null

    const [claimRes, verRes] = await Promise.all([
      fetch(
        `${url}/rest/v1/vsxo_claims?id=eq.${b.claim_id}&select=claim_text,claim_type,plausibility_score,status,self_claim,agency:vsxo_agencies(name,slug,domain_verified)&limit=1`,
        { headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: "no-store" },
      ),
      b.verification_id
        ? fetch(
            `${url}/rest/v1/vsxo_verifications?id=eq.${b.verification_id}&select=confidence,evidence,passed&limit=1`,
            { headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: "no-store" },
          )
        : Promise.resolve(null),
    ])
    const claimJson = await claimRes.json()
    const claim = Array.isArray(claimJson) && claimJson[0]
    if (!claim) return null
    const verification = verRes ? (await verRes.json())?.[0] : null
    return { badge: b, claim, verification }
  } catch { return null }
}

export default async function OgImage({ params }: Props) {
  const bundle = await loadBadgeBundle(params.slug)

  if (!bundle) {
    return renderOgCard({
      eyebrow: "Verification",
      title: "Proof page",
      subtitle: "Open to see the claim, the evidence, and the methodology.",
      accent: "violet",
      rightTagline: `verifiedsxo.com/verified/${params.slug}`,
    })
  }

  const { claim, verification, badge } = bundle
  const isSelf = !!claim.self_claim || !!badge.self_claim
  const elevated = claim.status === "elevated"
  const agency = claim.agency

  const accent = isSelf ? "amber" : elevated ? "emerald" : "emerald"
  const eyebrow = isSelf
    ? "Self-attested · Unverified"
    : elevated
      ? "Elevated 100% · AI-reviewed"
      : "Independently verified"

  const headline = claim.claim_text.length > 120
    ? claim.claim_text.slice(0, 117) + "…"
    : claim.claim_text

  const stats = isSelf
    ? [
        { label: "Plausibility", value: `${claim.plausibility_score ?? "—"}%` },
        { label: "Status", value: "Unverified" },
      ]
    : [
        { label: "Plausibility", value: `${claim.plausibility_score ?? "—"}%` },
        { label: "Evidence confidence", value: `${verification?.confidence ?? "—"}%` },
        { label: "Status", value: elevated ? "Elevated 100%" : "Verified" },
      ]

  return renderOgCard({
    eyebrow,
    title: `“${headline}”`,
    subtitle: `${claim.claim_type} claim · audited by ${agency?.name || "a VerifiedSXO agency"}.`,
    accent,
    verifiedBadge: !isSelf && !!agency?.domain_verified,
    agencyName: agency?.name,
    stats,
    rightTagline: `verifiedsxo.com/verified/${params.slug}`,
  })
}
