/**
 * Daily claim-submission quota scoped to the whole agency.
 *
 * Rule (agency-level, shared across agency-side and client-side submissions):
 *   - plan === 'free' AND membership_status !== 'active' → 1 claim / UTC day
 *   - anything else (Pro / Scale / active public-profile membership) → unlimited
 *
 * THIS GATE FAILED OPEN AND NOTHING COULD SEE IT (fixed 2026-08-30).
 * Both reads below dropped `error`. A supabase-js read that fails returns
 * `{ data: null, count: null, error }` — indistinguishable, once `error` is
 * discarded, from "the table is empty". The old code then did
 * `used = count || 0` and `allowed: used < 1`, so ANY failure of the count
 * query — a dead project, a network blip, an RLS change, a paused database —
 * turned the free-tier cap into UNLIMITED, with HTTP 200 and nothing logged.
 * The agency read had the mirror defect: on failure `plan` silently became
 * "free", quietly demoting a paying agency.
 *
 * A quota gate must fail CLOSED, and it must say WHICH state it is in. A
 * failed read is not "you have used your one claim" — it is "we could not
 * check", and the caller is told that (`limit_check_failed`) so it can answer
 * 503 rather than publishing a false 429.
 */

import { getSupabaseAdmin } from "@/lib/supabase/server"

export type LimitReason = "within_limit" | "plan_upgrade_required" | "limit_check_failed"

export interface LimitCheck {
  allowed: boolean
  used: number
  limit: number | null // null = unlimited
  reason: LimitReason
  plan: string
  membership_status: string | null
  unlimited: boolean
  /** Set only when reason === 'limit_check_failed'. The platform's own words. */
  error?: string
}

export async function checkAgencyDailyClaimLimit(agencyId: string): Promise<LimitCheck> {
  const admin = getSupabaseAdmin()

  const denied = (error: string): LimitCheck => ({
    allowed: false,
    used: 0,
    limit: null,
    reason: "limit_check_failed",
    plan: "unknown",
    membership_status: null,
    unlimited: false,
    error,
  })

  const { data: agency, error: agencyErr } = await admin
    .from("vsxo_agencies")
    .select("id, plan, membership_status")
    .eq("id", agencyId)
    .maybeSingle()

  // Not "no such agency" — that is `data: null` with no error, and it is
  // handled below by defaulting to the free plan. This is the read itself
  // failing, where every downstream value would be a guess.
  if (agencyErr) return denied(`agency read failed: ${agencyErr.message}`)

  const plan = agency?.plan || "free"
  const membership = agency?.membership_status || null
  const unlimited = plan !== "free" || membership === "active"

  if (unlimited) {
    return { allowed: true, used: 0, limit: null, reason: "within_limit", plan, membership_status: membership, unlimited: true }
  }

  const start = new Date()
  start.setUTCHours(0, 0, 0, 0)

  const { count, error: countErr } = await admin
    .from("vsxo_claims")
    .select("id", { count: "exact", head: true })
    .eq("agency_id", agencyId)
    .gte("created_at", start.toISOString())

  if (countErr) return denied(`claim count failed: ${countErr.message}`)

  // Only reachable once the read is known to have succeeded, so `count === null`
  // here means the head request returned no count for a reason other than
  // failure — still not a number we may treat as zero.
  if (typeof count !== "number") return denied("claim count returned no count")

  const used = count
  const FREE_DAILY = 1
  return {
    allowed: used < FREE_DAILY,
    used,
    limit: FREE_DAILY,
    reason: used < FREE_DAILY ? "within_limit" : "plan_upgrade_required",
    plan,
    membership_status: membership,
    unlimited: false,
  }
}
