/**
 * Daily claim-submission quota scoped to the whole agency.
 *
 * Rule (agency-level, shared across agency-side and client-side submissions):
 *   - plan === 'free' AND membership_status !== 'active' → 1 claim / UTC day
 *   - anything else (Pro / Scale / active public-profile membership) → unlimited
 */

import { getSupabaseAdmin } from "@/lib/supabase/server"

export type LimitReason = "within_limit" | "plan_upgrade_required"

export interface LimitCheck {
  allowed: boolean
  used: number
  limit: number | null // null = unlimited
  reason: LimitReason
  plan: string
  membership_status: string | null
  unlimited: boolean
}

export async function checkAgencyDailyClaimLimit(agencyId: string): Promise<LimitCheck> {
  const admin = getSupabaseAdmin()

  const { data: agency } = await admin
    .from("vsxo_agencies")
    .select("id, plan, membership_status")
    .eq("id", agencyId)
    .maybeSingle()

  const plan = agency?.plan || "free"
  const membership = agency?.membership_status || null
  const unlimited = plan !== "free" || membership === "active"

  const start = new Date()
  start.setUTCHours(0, 0, 0, 0)

  const { count } = await admin
    .from("vsxo_claims")
    .select("id", { count: "exact", head: true })
    .eq("agency_id", agencyId)
    .gte("created_at", start.toISOString())

  const used = count || 0

  if (unlimited) {
    return { allowed: true, used, limit: null, reason: "within_limit", plan, membership_status: membership, unlimited: true }
  }

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
