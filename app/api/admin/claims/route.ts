/**
 * POST /api/admin/claims — platform admin manually authors a claim,
 * attaches a verification, and optionally issues a badge / elevates.
 */

import { NextRequest, NextResponse } from "next/server"
import { randomBytes } from "node:crypto"
import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabase/server"
import { isAdmin } from "@/lib/admin"
import { pingMike } from "@/lib/notify-mike"
import { issueCertificateAndTag } from "@/lib/crm-cert"

export const runtime = "nodejs"

function newSlug(): string {
  return randomBytes(6).toString("base64url").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8) + Date.now().toString(36).slice(-4)
}
function newToken(): string {
  return randomBytes(24).toString("base64url")
}

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "unauthorised" }, { status: 401 })
  if (!(await isAdmin(user.id, user.email))) return NextResponse.json({ error: "forbidden" }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const agencyId: string = body?.agencyId || ""
  const clientId: string = body?.clientId || ""
  const claimText: string = (body?.claimText || "").trim()
  const claimType: string = body?.claimType || "general"
  const plausibilityScore: number | null = typeof body?.plausibilityScore === "number" ? body.plausibilityScore : null
  const reasoning: string[] = Array.isArray(body?.reasoning) ? body.reasoning.slice(0, 10).map(String) : []
  const evidenceSummary: string | null = body?.evidenceSummary || null
  const confidence: number = typeof body?.confidence === "number" ? body.confidence : 90
  const provider: string = body?.provider || "manual"
  const publishBadge: boolean = Boolean(body?.publishBadge)
  const autoElevate: boolean = Boolean(body?.autoElevate)

  if (!agencyId || !clientId || claimText.length < 10) {
    return NextResponse.json({ error: "agencyId, clientId, claimText required" }, { status: 400 })
  }

  const admin = getSupabaseAdmin()

  // Sanity check: client belongs to agency
  const { data: client } = await admin
    .from("vsxo_agency_clients")
    .select("id, agency_id, name, email")
    .eq("id", clientId)
    .maybeSingle()
  if (!client || client.agency_id !== agencyId) {
    return NextResponse.json({ error: "client_does_not_belong_to_agency" }, { status: 400 })
  }

  const now = new Date().toISOString()

  // Insert the claim
  const { data: claim, error: claimErr } = await admin
    .from("vsxo_claims")
    .insert({
      client_id: clientId,
      agency_id: agencyId,
      submitted_by_user: user.id,
      claim_text: claimText,
      claim_type: claimType,
      plausibility_score: plausibilityScore,
      plausibility_reasoning: reasoning.length ? reasoning : null,
      plausibility_tier: "fallback",
      status: publishBadge ? (autoElevate ? "elevated" : "verified") : "scored",
      verified_at: publishBadge ? now : null,
      elevated_at: publishBadge && autoElevate ? now : null,
    })
    .select("id")
    .single()
  if (claimErr || !claim) return NextResponse.json({ error: `claim_insert: ${claimErr?.message}` }, { status: 500 })

  // Verification record
  const { data: verification } = await admin
    .from("vsxo_verifications")
    .insert({
      claim_id: claim.id,
      provider,
      evidence: {
        summary: evidenceSummary || `Manually reviewed by platform admin (${user.email}).`,
        manual: true,
        reviewer_email: user.email,
      },
      passed: publishBadge,
      confidence,
    })
    .select("id")
    .single()

  // Badge
  let badgeSlug: string | null = null
  if (publishBadge && verification) {
    const slug = newSlug()
    const token = newToken()
    const { error: badgeErr } = await admin
      .from("vsxo_badges")
      .insert({
        verification_id: verification.id,
        claim_id: claim.id,
        client_id: clientId,
        slug,
        script_token: token,
        public_visible: true,
        last_verified_at: now,
      })
    if (!badgeErr) badgeSlug = slug
    issueCertificateAndTag({ claimId: claim.id, elevated: autoElevate }).catch(() => {})
  }

  pingMike({
    event: autoElevate ? "claim.verified" : publishBadge ? "claim.verified" : "claim.scored",
    headline: `Admin manual claim ${autoElevate ? "(elevated 100%)" : publishBadge ? "(verified)" : ""}: ${claimText.slice(0, 60)}`,
    fields: {
      "Claim ID": claim.id,
      "Agency ID": agencyId,
      Client: `${client.name} <${client.email}>`,
      Type: claimType,
      "Plausibility": plausibilityScore ?? "—",
      "Evidence source": provider,
      Confidence: `${confidence}%`,
      Badge: badgeSlug || "none",
      "Reviewer": user.email || "—",
    },
    link: badgeSlug ? `https://verifiedsxo.com/verified/${badgeSlug}` : `https://verifiedsxo.com/admin/claims/${claim.id}`,
  })

  return NextResponse.json({
    ok: true,
    claimId: claim.id,
    verificationId: verification?.id,
    badgeSlug,
  })
}
