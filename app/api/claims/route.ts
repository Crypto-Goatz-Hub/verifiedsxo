/**
 * POST /api/claims — authenticated client creates a claim.
 * Body: { claimText, claimType: "ranking"|"traffic", target: {...} }
 * Returns: { claimId, score, reasoning, tier }
 *
 * Inline scores the claim via /api/score logic (reused), persists to
 * vsxo_claims so the client and agency see it.
 */

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabase/server"
import { pingMike } from "@/lib/notify-mike"
import { checkAgencyDailyClaimLimit } from "@/lib/agency-claim-limit"

export const runtime = "nodejs"
export const maxDuration = 30

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const claimText: string = (body?.claimText || "").trim()
  const claimType: string = body?.claimType || "general"
  const target = body?.target || null

  if (claimText.length < 10) return NextResponse.json({ error: "claimText too short" }, { status: 400 })
  if (!["ranking", "traffic", "general"].includes(claimType))
    return NextResponse.json({ error: "invalid claimType" }, { status: 400 })

  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "unauthorised" }, { status: 401 })

  const admin = getSupabaseAdmin()
  const { data: client } = await admin
    .from("vsxo_agency_clients")
    .select("id, agency_id")
    .eq("user_id", user.id)
    .maybeSingle()
  if (!client) return NextResponse.json({ error: "no client record" }, { status: 403 })

  // Agency-scoped daily limit: free tier → 1/day; paid plan OR active
  // public-profile membership → unlimited.
  const limit = await checkAgencyDailyClaimLimit(client.agency_id)
  if (!limit.allowed) {
    return NextResponse.json(
      {
        error: "daily_limit_reached",
        message: `Free tier is limited to ${limit.limit} claim per day. Upgrade to Pro or activate the $8/mo public profile membership for unlimited.`,
        limit: { used: limit.used, limit: limit.limit, plan: limit.plan, membership_status: limit.membership_status },
      },
      { status: 429 }
    )
  }

  // Score inline via local /api/score
  const origin = new URL(req.url).origin
  let score: number | null = null
  let reasoning: string[] = []
  let tier: string = "fallback"
  try {
    const scoreRes = await fetch(`${origin}/api/score`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ claim: claimText }),
    })
    if (scoreRes.ok) {
      const data = await scoreRes.json()
      score = data.score
      reasoning = data.reasoning || []
      tier = data.tier || "fallback"
    }
  } catch {}

  const { data: claim, error } = await admin
    .from("vsxo_claims")
    .insert({
      client_id: client.id,
      agency_id: client.agency_id,
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
    headline: `Claim scored (${score ?? "—"}%): ${claimText.slice(0, 60)}`,
    fields: {
      "Claim type": claimType,
      Score: score ?? "—",
      Tier: tier,
      "Client ID": client.id,
      "Agency ID": client.agency_id,
      "By user": user.email || user.id,
    },
    link: `https://verifiedsxo.com/dashboard`,
  })

  return NextResponse.json({
    claimId: claim.id,
    score,
    reasoning,
    tier,
  })
}
