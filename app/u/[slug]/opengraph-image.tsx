import { renderOgCard, OG_RUNTIME, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og"

export const runtime = OG_RUNTIME
export const alt = "Verified agency profile on VerifiedSXO"
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

interface Props { params: { slug: string } }

async function loadAgency(slug: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  try {
    const r = await fetch(
      `${url}/rest/v1/vsxo_agencies?slug=eq.${encodeURIComponent(slug)}&select=name,tagline,description,domain_verified,membership_status,public_profile_enabled&limit=1`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: "no-store" },
    )
    if (!r.ok) return null
    const rows = await r.json()
    return Array.isArray(rows) && rows[0] ? rows[0] : null
  } catch { return null }
}

async function loadClaimCount(slug: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return 0
  try {
    // Resolve agency id, then count verified claims
    const ar = await fetch(
      `${url}/rest/v1/vsxo_agencies?slug=eq.${encodeURIComponent(slug)}&select=id&limit=1`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: "no-store" },
    )
    const aj = await ar.json()
    const aid = Array.isArray(aj) && aj[0]?.id
    if (!aid) return 0
    const cr = await fetch(
      `${url}/rest/v1/vsxo_claims?agency_id=eq.${aid}&status=in.(verified,elevated)&select=id`,
      { headers: { apikey: key, Authorization: `Bearer ${key}`, Prefer: "count=exact" }, cache: "no-store" },
    )
    const range = cr.headers.get("content-range") || ""
    const m = range.match(/\/(\d+)$/)
    return m ? Number(m[1]) : 0
  } catch { return 0 }
}

export default async function OgImage({ params }: Props) {
  const agency = await loadAgency(params.slug)
  const verifiedCount = await loadClaimCount(params.slug)

  const name = agency?.name || "Agency"
  const tagline = agency?.tagline || agency?.description?.slice(0, 140) || "Verified agency on VerifiedSXO."
  const isDomainVerified = !!agency?.domain_verified
  const isPublic = agency?.membership_status === "active" && !!agency?.public_profile_enabled

  return renderOgCard({
    eyebrow: isPublic ? "Verified agency · public profile" : "Agency profile",
    title: name,
    subtitle: tagline,
    accent: isDomainVerified ? "emerald" : "violet",
    verifiedBadge: isDomainVerified,
    stats: [
      { label: "Verified claims", value: String(verifiedCount) },
      { label: "Domain match", value: isDomainVerified ? "Yes" : "Unverified" },
      { label: "Status", value: isPublic ? "Public" : "Private" },
    ],
    rightTagline: `verifiedsxo.com/u/${params.slug}`,
  })
}
