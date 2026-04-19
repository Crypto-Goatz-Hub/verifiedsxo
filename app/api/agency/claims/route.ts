/**
 * POST /api/agency/claims
 * Agency owner/member submits a claim on behalf of one of their clients.
 *
 * Body: { clientId, claimText, claimType?, target? }
 *
 * Rate limit (agency-scoped):
 *   - Free plan + no active membership  → 1 claim / UTC day
 *   - Any other state                    → unlimited
 *
 * Scores via /api/score (same 3-tier pipeline as the public widget +
 * client dashboard) and persists to vsxo_claims.
 */

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabase/server"
import { checkAgencyDailyClaimLimit } from "@/lib/agency-claim-limit"
import { pingMike } from "@/lib/notify-mike"

export const runtime = "nodejs"
export const maxDuration = 30

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const clientId: string = body?.clientId || ""
  const claimText: string = (body?.claimText || "").trim()
  const claimType: string = body?.claimType || "general"
  const target = body?.target || null

  if (!clientId || claimText.length < 10) {
    return NextResponse.json({ error: "clientId and claimText (≥10 chars) required" }, { status: 400 })
  }

  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "unauthorised" }, { status: 401 })

  const admin = getSupabaseAdmin()

  // Confirm the client belongs to an agency the user is a member/owner of
  const { data: clientRow } = await admin
    .from("vsxo_agency_clients")
    .select("id, agency_id, name, email")
    .eq("id", clientId)
    .maybeSingle()
  if (!clientRow) return NextResponse.json({ error: "client_not_found" }, { status: 404 })

  const agencyId = clientRow.agency_id
  const [{ data: member }, { data: owned }] = await Promise.all([
    admin.from("vsxo_agency_members").select("role").eq("agency_id", agencyId).eq("user_id", user.id).maybeSingle(),
    admin.from("vsxo_agencies").select("id").eq("id", agencyId).eq("owner_user_id", user.id).maybeSingle(),
  ])
  if (!member && !owned) return NextResponse.json({ error: "forbidden" }, { status: 403 })

  // Agency-level daily quota
  const limit = await checkAgencyDailyClaimLimit(agencyId)
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

  // Score via internal /api/score — reuse the existing 3-tier pipeline
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
  } catch {}

  const { data: claim, error } = await admin
    .from("vsxo_claims")
    .insert({
      client_id: clientId,
      agency_id: agencyId,
      submitted_by_user: user.id,
      claim_text: claimText,
      claim_type: claimType,
      plausibility_score: score,
      plausibility_reasoning: reasoning.length ? reasoning : null,
      plausibility_tier: tier === "agent" || tier === "groq" || tier === "fallback" ? tier : "fallback",
      status: "scored",
      target_metric: target,
    })
    .select("id")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  pingMike({
    event: "claim.scored",
    headline: `Agency-submitted claim (${score ?? "—"}%): ${claimText.slice(0, 60)}`,
    fields: {
      "Agency ID": agencyId,
      Client: `${clientRow.name} <${clientRow.email}>`,
      "Claim type": claimType,
      Score: score ?? "—",
      Tier: tier,
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
    limit: { used: limit.used + 1, limit: limit.limit, unlimited: limit.unlimited },
  })
}
