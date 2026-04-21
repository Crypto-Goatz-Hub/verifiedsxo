/**
 * POST /api/agency/claims
 * Agency owner/member submits a claim.
 *
 * Two modes:
 *   A. Client claim   — body includes clientId; will follow normal verification flow
 *   B. Self-claim     — body omits clientId (or passes selfClaim=true);
 *                       scored only, cannot be verified/elevated, gets an
 *                       "Unverified" embeddable badge instead of a verified one.
 *
 * Rate limit (agency-scoped, shared across modes):
 *   - Free plan + no active membership  → 1 claim / UTC day
 *   - Anything else                      → unlimited
 */

import { NextRequest, NextResponse } from "next/server"
import { randomBytes } from "node:crypto"
import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabase/server"
import { checkAgencyDailyClaimLimit } from "@/lib/agency-claim-limit"
import { pingMike } from "@/lib/notify-mike"

export const runtime = "nodejs"
export const maxDuration = 30

function newSlug(): string {
  return randomBytes(6).toString("base64url").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8) + Date.now().toString(36).slice(-4)
}
function newToken(): string {
  return randomBytes(24).toString("base64url")
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const clientId: string = body?.clientId || ""
  const claimText: string = (body?.claimText || "").trim()
  const claimType: string = body?.claimType || "general"
  const target = body?.target || null
  const selfClaimRequested = Boolean(body?.selfClaim)

  if (claimText.length < 10) {
    return NextResponse.json({ error: "claimText (≥10 chars) required" }, { status: 400 })
  }

  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "unauthorised" }, { status: 401 })

  const admin = getSupabaseAdmin()

  // -------- Resolve agency + self-claim flag -----------------------------
  let agencyId: string | null = null
  let clientRow: { id: string; agency_id: string; name: string; email: string } | null = null
  const isSelfClaim = selfClaimRequested || !clientId

  if (!isSelfClaim) {
    const { data: c } = await admin
      .from("vsxo_agency_clients")
      .select("id, agency_id, name, email")
      .eq("id", clientId)
      .maybeSingle()
    if (!c) return NextResponse.json({ error: "client_not_found" }, { status: 404 })
    clientRow = c
    agencyId = c.agency_id
  } else {
    // Resolve the agency from the logged-in user
    const { data: owned } = await admin
      .from("vsxo_agencies")
      .select("id")
      .eq("owner_user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle()
    if (owned) {
      agencyId = owned.id
    } else {
      const { data: member } = await admin
        .from("vsxo_agency_members")
        .select("agency_id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle()
      agencyId = member?.agency_id || null
    }
    if (!agencyId) return NextResponse.json({ error: "no_agency" }, { status: 404 })
  }

  // -------- Access check -------------------------------------------------
  const [{ data: member }, { data: owned }] = await Promise.all([
    admin.from("vsxo_agency_members").select("role").eq("agency_id", agencyId).eq("user_id", user.id).maybeSingle(),
    admin.from("vsxo_agencies").select("id").eq("id", agencyId).eq("owner_user_id", user.id).maybeSingle(),
  ])
  if (!member && !owned) return NextResponse.json({ error: "forbidden" }, { status: 403 })

  // -------- Rate limit ---------------------------------------------------
  const limit = await checkAgencyDailyClaimLimit(agencyId!)
  if (!limit.allowed) {
    return NextResponse.json(
      {
        error: "daily_limit_reached",
        message: `Free agencies are capped at ${limit.limit} claim per day. Upgrade to Pro or activate the $8/mo public profile membership for unlimited.`,
        limit,
      },
      { status: 429 }
    )
  }

  // -------- Score via internal /api/score --------------------------------
  const origin = new URL(req.url).origin
  let score: number | null = null
  let reasoning: string[] = []
  let tier: string = "fallback"
  try {
    const r = await fetch(`${origin}/api/score`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ claim: claimText }),
    })
    if (r.ok) {
      const data = await r.json()
      score = data.score
      reasoning = Array.isArray(data.reasoning) ? data.reasoning : []
      tier = data.tier || "fallback"
    }
  } catch { /* keep fallback values */ }

  // -------- Insert claim -------------------------------------------------
  const { data: claim, error } = await admin
    .from("vsxo_claims")
    .insert({
      client_id: isSelfClaim ? null : clientRow!.id,
      agency_id: agencyId,
      submitted_by_user: user.id,
      claim_text: claimText,
      claim_type: claimType,
      plausibility_score: score,
      plausibility_reasoning: reasoning.length ? reasoning : null,
      plausibility_tier: tier === "agent" || tier === "groq" || tier === "fallback" ? tier : "fallback",
      status: "scored",
      target_metric: target,
      self_claim: isSelfClaim,
    })
    .select("id")
    .single()

  if (error || !claim) return NextResponse.json({ error: error?.message || "insert_failed" }, { status: 500 })

  // -------- Auto-issue embeddable badge for self-claims ------------------
  // Client claims only get a badge after verification/elevation fires (unchanged).
  let badgeSlug: string | null = null
  if (isSelfClaim) {
    const slug = newSlug()
    const token = newToken()
    const { error: badgeErr } = await admin.from("vsxo_badges").insert({
      verification_id: null,
      claim_id: claim.id,
      client_id: null,
      slug,
      script_token: token,
      public_visible: true,
      self_claim: true,
      last_verified_at: null,
    })
    if (!badgeErr) badgeSlug = slug
  }

  pingMike({
    event: "claim.scored",
    headline: `${isSelfClaim ? "Self-claim" : "Agency claim"} (${score ?? "—"}%): ${claimText.slice(0, 60)}`,
    fields: {
      Mode: isSelfClaim ? "self-claim (no client)" : "client claim",
      "Agency ID": agencyId,
      Client: clientRow ? `${clientRow.name} <${clientRow.email}>` : "—",
      "Claim type": claimType,
      Score: score ?? "—",
      Tier: tier,
      Badge: badgeSlug ? `/v/${badgeSlug}` : "none",
      "Daily used": `${limit.used + 1}/${limit.limit ?? "∞"}`,
      "Submitted by": user.email || user.id,
    },
    link: `https://verifiedsxo.com/dashboard/claims/${claim.id}`,
  })

  return NextResponse.json({
    ok: true,
    claimId: claim.id,
    score,
    reasoning,
    tier,
    selfClaim: isSelfClaim,
    badgeSlug,
    limit: { used: limit.used + 1, limit: limit.limit, unlimited: limit.unlimited },
  })
}
