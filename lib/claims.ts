/**
 * Claim helpers — shared status metadata, badge styling, timeline
 * construction, and permission checks.
 */

export type ClaimStatus =
  | "scored"
  | "connecting"
  | "verifying"
  | "needs_docs"
  | "pending_review"
  | "verified"
  | "elevated"
  | "rejected"
  | "expired"

export const STATUS_META: Record<ClaimStatus, { label: string; hint: string; cls: string; order: number }> = {
  scored:         { label: "Scored",          hint: "Plausibility scored, waiting on data connection", cls: "bg-zinc-500/10 text-zinc-500 border-zinc-500/30", order: 0 },
  connecting:     { label: "Connecting",      hint: "Linking a data source", cls: "bg-violet-500/10 text-violet-500 border-violet-500/30", order: 1 },
  verifying:      { label: "Verifying",       hint: "Running automated checks", cls: "bg-cyan-500/10 text-cyan-500 border-cyan-500/30", order: 2 },
  needs_docs:     { label: "Needs docs",      hint: "Upload supporting evidence to continue", cls: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30", order: 3 },
  pending_review: { label: "Pending review",  hint: "AI elevation requested — review in progress", cls: "bg-orange-500/10 text-orange-500 border-orange-500/30", order: 4 },
  verified:       { label: "Verified",        hint: "Confirmed against live analytics", cls: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30", order: 5 },
  elevated:       { label: "Elevated 100%",   hint: "AI-elevated with additional documentation", cls: "bg-emerald-500/15 text-emerald-600 border-emerald-500/40", order: 6 },
  rejected:       { label: "Rejected",        hint: "Data did not support the claim", cls: "bg-rose-500/10 text-rose-500 border-rose-500/30", order: -1 },
  expired:        { label: "Expired",         hint: "Verification aged out — re-run required", cls: "bg-gray-500/10 text-gray-500 border-gray-500/30", order: -2 },
}

export interface TimelineStep {
  status: ClaimStatus
  at: string
  label: string
  active: boolean
}

export interface ClaimTimelineInput {
  created_at: string
  updated_at?: string | null
  status: ClaimStatus
  verified_at?: string | null
  rejected_at?: string | null
  needs_docs_at?: string | null
  elevated_at?: string | null
}

/** Builds a linear timeline from a claim's timestamps. */
export function buildTimeline(c: ClaimTimelineInput): TimelineStep[] {
  const steps: TimelineStep[] = []
  steps.push({ status: "scored", at: c.created_at, label: "Scored", active: true })
  if (c.needs_docs_at) steps.push({ status: "needs_docs", at: c.needs_docs_at, label: "Docs requested", active: true })
  if (c.verified_at) steps.push({ status: "verified", at: c.verified_at, label: "Verified with live data", active: true })
  if (c.elevated_at) steps.push({ status: "elevated", at: c.elevated_at, label: "Elevated to 100%", active: true })
  if (c.rejected_at) steps.push({ status: "rejected", at: c.rejected_at, label: "Rejected", active: true })
  return steps
}
