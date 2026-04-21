"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Gift, Copy, Check, Share2, TrendingUp, PartyPopper } from "lucide-react"

interface RewardRow {
  id: string
  kind: string
  value: number | null
  note: string | null
  earned_at: string
  consumed_at: string | null
}

interface Props {
  referralCode: string
  siteUrl: string
  stats: {
    clicks: number
    signups: number
    conversions: number
    freeMonthsEarned: number
  }
  recent: RewardRow[]
}

const KIND_META: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
  free_month_membership: { label: "Free month of membership", icon: <Gift className="w-3 h-3" />, cls: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" },
  unlimited_claims_day:  { label: "Unlimited claims today",   icon: <TrendingUp className="w-3 h-3" />, cls: "bg-cyan-500/10 text-cyan-600 border-cyan-500/30" },
  deep_research_credit:  { label: "Deep research credit",     icon: <TrendingUp className="w-3 h-3" />, cls: "bg-violet-500/10 text-violet-600 border-violet-500/30" },
  badge_early_operator:  { label: "Early Operator badge",     icon: <Gift className="w-3 h-3" />, cls: "bg-yellow-500/10 text-yellow-700 border-yellow-500/30" },
  badge_streak:          { label: "Streak badge",             icon: <Gift className="w-3 h-3" />, cls: "bg-orange-500/10 text-orange-600 border-orange-500/30" },
  badge_top10:           { label: "Top 10 Agency badge",      icon: <Gift className="w-3 h-3" />, cls: "bg-violet-500/10 text-violet-600 border-violet-500/30" },
  manual:                { label: "Manual reward",            icon: <Gift className="w-3 h-3" />, cls: "bg-muted text-muted-foreground" },
}

export function RewardsPanel({ referralCode, siteUrl, stats, recent }: Props) {
  const [copied, setCopied] = useState(false)
  const refUrl = `${siteUrl}/?r=${encodeURIComponent(referralCode)}`

  async function copy() {
    try {
      await navigator.clipboard.writeText(refUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch { /* ignore */ }
  }

  const shareMsg =
    "I verify my marketing claims on VerifiedSXO — third-party proof on every number. Worth a look."
  const twitterHref = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMsg)}&url=${encodeURIComponent(refUrl)}`
  const linkedinHref = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(refUrl)}`

  return (
    <section className="rounded-xl border bg-gradient-to-br from-violet-500/5 via-card to-cyan-500/5 p-6 mb-6">
      <div className="flex items-start justify-between flex-wrap gap-3 mb-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shrink-0">
            <Gift className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-500 mb-0.5">Growth rewards</div>
            <h2 className="text-lg font-semibold">Refer an agency, earn a free month</h2>
            <p className="text-xs text-muted-foreground mt-0.5 max-w-md">
              Every agency that signs up and activates a membership through your link gives you <strong>1 free month</strong>.
              Unlimited stack.
            </p>
          </div>
        </div>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <StatPill label="Link clicks"         value={stats.clicks} />
        <StatPill label="Agencies signed up"  value={stats.signups} />
        <StatPill label="Memberships funded"  value={stats.conversions} accent={stats.conversions > 0} />
        <StatPill label="Free months earned"  value={stats.freeMonthsEarned} accent={stats.freeMonthsEarned > 0} />
      </div>

      {/* Link + share */}
      <div className="rounded-lg border bg-background p-3 flex items-center gap-2 mb-3">
        <code className="flex-1 text-xs font-mono truncate px-2">{refUrl}</code>
        <Button variant="outline" size="sm" onClick={copy} className={copied ? "border-emerald-500/50 text-emerald-600" : ""}>
          {copied ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
        </Button>
      </div>

      <div className="flex items-center flex-wrap gap-2 mb-5">
        <span className="text-xs text-muted-foreground uppercase tracking-wider">Share to:</span>
        <Button asChild variant="outline" size="sm">
          <a href={twitterHref} target="_blank" rel="noopener"><Share2 className="w-3 h-3" /> X / Twitter</a>
        </Button>
        <Button asChild variant="outline" size="sm">
          <a href={linkedinHref} target="_blank" rel="noopener"><Share2 className="w-3 h-3" /> LinkedIn</a>
        </Button>
      </div>

      {stats.freeMonthsEarned > 0 && (
        <Alert variant="success" className="mb-4">
          <PartyPopper />
          <AlertDescription>
            You have <strong>{stats.freeMonthsEarned} free month{stats.freeMonthsEarned === 1 ? "" : "s"}</strong> credited.
            We&rsquo;ll auto-apply these to your next renewal.
          </AlertDescription>
        </Alert>
      )}

      {recent.length > 0 && (
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Recent rewards</div>
          <ul className="space-y-2">
            {recent.slice(0, 5).map((r) => {
              const meta = KIND_META[r.kind] || KIND_META.manual
              return (
                <li key={r.id} className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-background">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold uppercase tracking-wider ${meta.cls}`}>
                      {meta.icon} {meta.label}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">{r.note || ""}</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground tabular-nums shrink-0">
                    {new Date(r.earned_at).toLocaleDateString()}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {recent.length === 0 && (
        <p className="text-xs text-muted-foreground">
          No rewards yet. First agency to convert through your link gets you a free month.{" "}
          <Link href="/how-it-works" className="underline">How it works</Link>.
        </p>
      )}
    </section>
  )
}

function StatPill({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className={`rounded-lg border p-3 ${accent ? "bg-gradient-to-br from-violet-500/5 to-cyan-500/5 border-violet-500/30" : "bg-background"}`}>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">{label}</div>
      <div className="text-xl font-bold tabular-nums">{value.toLocaleString()}</div>
    </div>
  )
}
