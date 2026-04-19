/**
 * Claim-verification engine (MVP: 2 claim types via Google Search Console).
 *
 * - "ranking":  claim says the client ranks for a keyword at position ≤ N.
 *               We query Search Console with dimension=query, filter=exact
 *               keyword, last 28 days, check avg position.
 * - "traffic":  claim says client gets ≥ N organic impressions or clicks
 *               per month. We sum last 28 days and compare.
 *
 * Each verification writes a vsxo_verifications row + (on pass) a vsxo_badges
 * row with slug + script_token.
 */

import { randomBytes } from "node:crypto"
import { getSupabaseAdmin } from "@/lib/supabase/server"
import { searchAnalytics } from "@/lib/google/search-console-user"
import { issueCertificateAndTag } from "@/lib/crm-cert"

export type VerifiableClaimType = "ranking" | "traffic"

export interface RankingTarget {
  type: "ranking"
  site: string
  keyword: string
  max_position: number
}

export interface TrafficTarget {
  type: "traffic"
  site: string
  metric: "clicks" | "impressions"
  min_value: number
  window_days?: number
}

export type VerificationTarget = RankingTarget | TrafficTarget

function ymd(d: Date): string { return d.toISOString().slice(0, 10) }

function newSlug(): string {
  return randomBytes(6).toString("base64url").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8) + Date.now().toString(36).slice(-4)
}

function newScriptToken(): string {
  return randomBytes(24).toString("base64url")
}

interface VerifyOutput {
  passed: boolean
  confidence: number
  evidence: Record<string, unknown>
  summary: string
}

async function verifyRanking(clientId: string, t: RankingTarget): Promise<VerifyOutput> {
  const end = new Date()
  const start = new Date(Date.now() - 28 * 86_400_000)
  const rows = await searchAnalytics(clientId, {
    site: t.site,
    startDate: ymd(start),
    endDate: ymd(end),
    dimensions: ["query"],
    rowLimit: 5,
    filter: { dimension: "query", operator: "equals", expression: t.keyword },
  })
  const row = rows[0]
  if (!row) {
    return {
      passed: false,
      confidence: 95,
      evidence: { keyword: t.keyword, site: t.site, window: "last_28_days", rows_found: 0 },
      summary: `No impressions found for "${t.keyword}" in the last 28 days.`,
    }
  }
  const avgPos = Math.round(row.position * 10) / 10
  const passed = avgPos <= t.max_position
  const confidence = Math.max(60, Math.min(99, 100 - Math.abs(avgPos - t.max_position) * 2))
  return {
    passed,
    confidence: Math.round(confidence),
    evidence: {
      keyword: t.keyword,
      site: t.site,
      window: "last_28_days",
      claimed_max_position: t.max_position,
      actual_avg_position: avgPos,
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: Math.round(row.ctr * 10000) / 100,
    },
    summary: passed
      ? `Verified: "${t.keyword}" ranked ${avgPos} on average (≤ claimed ${t.max_position}) over the last 28 days on ${t.site}.`
      : `Not verified: "${t.keyword}" averaged position ${avgPos}, higher than the claimed ${t.max_position}.`,
  }
}

async function verifyTraffic(clientId: string, t: TrafficTarget): Promise<VerifyOutput> {
  const windowDays = t.window_days || 28
  const end = new Date()
  const start = new Date(Date.now() - windowDays * 86_400_000)
  const rows = await searchAnalytics(clientId, {
    site: t.site,
    startDate: ymd(start),
    endDate: ymd(end),
    dimensions: ["date"],
    rowLimit: windowDays,
  })
  const total = rows.reduce((acc, r) => acc + (t.metric === "clicks" ? r.clicks : r.impressions), 0)
  const passed = total >= t.min_value
  const confidence = Math.max(70, Math.min(99, 100 - Math.abs(total - t.min_value) / Math.max(1, t.min_value) * 30))
  return {
    passed,
    confidence: Math.round(confidence),
    evidence: {
      site: t.site,
      metric: t.metric,
      window_days: windowDays,
      claimed_min: t.min_value,
      actual_total: total,
      daily_rows: rows.length,
    },
    summary: passed
      ? `Verified: ${total.toLocaleString()} ${t.metric} on ${t.site} over the last ${windowDays} days (≥ claimed ${t.min_value.toLocaleString()}).`
      : `Not verified: ${total.toLocaleString()} ${t.metric} over the last ${windowDays} days, below the claimed ${t.min_value.toLocaleString()}.`,
  }
}

/**
 * Run a verification attempt for an existing claim. Writes a
 * vsxo_verifications row and (on pass) a vsxo_badges row.
 */
export async function runVerification(claimId: string): Promise<{
  verificationId: string
  passed: boolean
  confidence: number
  summary: string
  badgeSlug?: string
  scriptToken?: string
  evidence: Record<string, unknown>
}> {
  const admin = getSupabaseAdmin()
  const { data: claim, error } = await admin
    .from("vsxo_claims")
    .select("id, client_id, target_metric, claim_type")
    .eq("id", claimId)
    .maybeSingle()

  if (error || !claim) throw new Error("claim_not_found")

  const target = (claim.target_metric as VerificationTarget) || null
  if (!target) throw new Error("target_metric_missing")

  await admin.from("vsxo_claims").update({ status: "verifying" }).eq("id", claim.id)

  let out: VerifyOutput
  if (target.type === "ranking") {
    out = await verifyRanking(claim.client_id, target)
  } else if (target.type === "traffic") {
    out = await verifyTraffic(claim.client_id, target)
  } else {
    throw new Error("unsupported_claim_type")
  }

  const { data: verification, error: vErr } = await admin
    .from("vsxo_verifications")
    .insert({
      claim_id: claim.id,
      provider: "gsc",
      evidence: { ...out.evidence, summary: out.summary },
      passed: out.passed,
      confidence: out.confidence,
    })
    .select("id")
    .single()
  if (vErr || !verification) throw new Error(`verification_store_failed: ${vErr?.message}`)

  const now = new Date().toISOString()
  await admin
    .from("vsxo_claims")
    .update({
      status: out.passed ? "verified" : "rejected",
      ...(out.passed ? { verified_at: now } : { rejected_at: now }),
    })
    .eq("id", claim.id)

  let badgeSlug: string | undefined
  let scriptToken: string | undefined
  if (out.passed) {
    const slug = newSlug()
    const token = newScriptToken()
    const { error: bErr } = await admin
      .from("vsxo_badges")
      .insert({
        verification_id: verification.id,
        claim_id: claim.id,
        client_id: claim.client_id,
        slug,
        script_token: token,
        public_visible: true,
        last_verified_at: new Date().toISOString(),
      })
    if (!bErr) {
      badgeSlug = slug
      scriptToken = token
      // Fire-and-forget CRM tag + custom field write
      issueCertificateAndTag({ claimId: claim.id, elevated: false }).catch(() => {})
    }
  }

  return {
    verificationId: verification.id,
    passed: out.passed,
    confidence: out.confidence,
    summary: out.summary,
    badgeSlug,
    scriptToken,
    evidence: out.evidence,
  }
}
