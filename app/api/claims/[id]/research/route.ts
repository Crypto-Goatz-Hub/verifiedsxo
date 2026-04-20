/**
 * POST /api/claims/[id]/research — run the Verify engine pipeline for one claim.
 *
 * Access:
 *  - Claim's owning agency user (owner/member), or
 *  - The invited client on that claim, or
 *  - Platform admin.
 *
 * Depth:
 *  - default "basic" — 3 queries / 3 sources / Groq synthesis (or CRM Agent tier 1)
 *  - "deep" — 6 queries / 8 sources, only for Pro/Scale agencies or active memberships
 */

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabase/server"
import { researchClaim, type ResearchDepth, type ResearchResult } from "@/lib/research"
import { isAdmin } from "@/lib/admin"
import { pingMike } from "@/lib/notify-mike"

export const runtime = "nodejs"
export const maxDuration = 60

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "unauthorised" }, { status: 401 })

  const admin = getSupabaseAdmin()

  // Load claim + agency + client for permission + context
  const { data: claim } = await admin
    .from("vsxo_claims")
    .select(`
      id, claim_text, claim_type, agency_id, client_id, status,
      plausibility_score, research_ran_at,
      agency:vsxo_agencies(id, name, owner_user_id, plan, membership_status, website, domain_verified),
      client:vsxo_agency_clients(id, name, email, user_id, company)
    `)
    .eq("id", id)
    .maybeSingle()

  if (!claim) return NextResponse.json({ error: "not_found" }, { status: 404 })

  // @ts-expect-error join shape
  const agency = claim.agency as { id: string; name: string; owner_user_id: string; plan: string; membership_status: string; website: string | null; domain_verified: boolean }
  // @ts-expect-error join shape
  const client = claim.client as { id: string; name: string; email: string; user_id: string | null; company: string | null }

  // --- Access check ------------------------------------------------------
  const userId = user.id
  const siteAdmin = await isAdmin(userId, user.email)
  const isOwner = agency.owner_user_id === userId
  let isMember = false
  if (!isOwner) {
    const { data: m } = await admin
      .from("vsxo_agency_members")
      .select("id")
      .eq("agency_id", agency.id)
      .eq("user_id", userId)
      .maybeSingle()
    isMember = Boolean(m)
  }
  const isTheClient = client.user_id === userId
  if (!(siteAdmin || isOwner || isMember || isTheClient)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  // --- Depth gate --------------------------------------------------------
  const body = await req.json().catch(() => ({}))
  const requestedDepth: ResearchDepth = body?.depth === "deep" ? "deep" : "basic"
  const canDeep = siteAdmin || agency.plan !== "free" || agency.membership_status === "active"
  const depth: ResearchDepth = requestedDepth === "deep" && canDeep ? "deep" : "basic"

  // --- Rate limit: 1 run per claim per 10 minutes for non-admins ---------
  if (!siteAdmin && claim.research_ran_at) {
    const last = new Date(claim.research_ran_at).getTime()
    const cooldownMs = 10 * 60 * 1000
    if (Date.now() - last < cooldownMs && !body?.force) {
      const waitSec = Math.ceil((cooldownMs - (Date.now() - last)) / 1000)
      return NextResponse.json({
        error: "cooldown",
        message: `Research recently ran for this claim. Retry in ${waitSec}s or set force=true (deep plan only).`,
        retry_after_s: waitSec,
      }, { status: 429 })
    }
  }

  // --- Run pipeline ------------------------------------------------------
  let result: ResearchResult
  try {
    result = await researchClaim(claim.claim_text, {
      clientDomain: extractDomainFromEmail(client.email) || (agency.website || null),
      clientName: client.company || client.name || agency.name,
      depth,
    })
  } catch (e) {
    return NextResponse.json({ error: "research_failed", message: String(e) }, { status: 500 })
  }

  // --- Persist -----------------------------------------------------------
  await admin
    .from("vsxo_claims")
    .update({
      research: result,
      research_verdict: result.verdict,
      research_confidence: result.confidence,
      research_tier: result.tier,
      research_ran_at: new Date().toISOString(),
    })
    .eq("id", claim.id)

  // Wipe + re-insert citations
  await admin.from("vsxo_claim_citations").delete().eq("claim_id", claim.id)
  if (result.citations.length > 0) {
    await admin.from("vsxo_claim_citations").insert(result.citations.map((c) => ({
      claim_id: claim.id,
      url: c.url,
      title: c.title || null,
      snippet: c.snippet || null,
      source: c.source || null,
      relevance: c.relevance,
      stance: c.stance,
      fetched_ok: c.fetched_ok,
    })))
  }

  // --- Fire notification --------------------------------------------------
  pingMike({
    event: "claim.researched",
    headline: `Research (${depth}) · ${result.verdict} · ${result.confidence}% · ${claim.claim_text.slice(0, 60)}`,
    fields: {
      "Claim ID": claim.id,
      Agency: agency.name,
      Client: `${client.name} <${client.email}>`,
      Verdict: result.verdict,
      Confidence: `${result.confidence}%`,
      "Synth tier": result.tier,
      Depth: depth,
      Queries: result.queries.length,
      Citations: result.citations.length,
      Duration: `${result.duration_ms}ms`,
    },
    link: `https://verifiedsxo.com/dashboard/claims/${claim.id}`,
  })

  return NextResponse.json({ ok: true, depth, result })
}

function extractDomainFromEmail(email?: string | null): string | null {
  if (!email) return null
  const at = email.split("@")
  return at.length === 2 ? at[1].toLowerCase().trim() : null
}
