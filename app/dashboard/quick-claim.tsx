"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Loader2, AlertTriangle, ArrowRight, Sparkles, Rocket, ShieldAlert } from "lucide-react"

interface ClientOpt { id: string; name: string; email: string; company: string | null }

interface Props {
  clients: ClientOpt[]
  unlimited: boolean
  used: number
  dailyLimit: number | null
}

interface ScoreResp {
  score: number
  reasoning: string[]
  tier: string
  claimId: string
  selfClaim?: boolean
  badgeSlug?: string | null
}

const SELF = "__self__"

const CLAIM_TYPES = [
  "general", "ranking", "traffic", "revenue", "audience", "conversion", "output", "customer",
]

export function QuickClaim({ clients, unlimited, used, dailyLimit }: Props) {
  const router = useRouter()
  const [clientId, setClientId] = useState("")
  const [claimText, setClaimText] = useState("")
  const [claimType, setClaimType] = useState("general")
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [result, setResult] = useState<ScoreResp | null>(null)

  const remaining = unlimited ? null : Math.max(0, (dailyLimit || 0) - used)
  const locked = !unlimited && remaining !== null && remaining <= 0

  async function submit() {
    setErr(null); setResult(null)
    if (!clientId) return setErr("Choose a client or pick 'Self-claim' first")
    if (claimText.trim().length < 10) return setErr("Claim needs a full sentence")
    setLoading(true)
    const selfClaim = clientId === SELF
    const payload: Record<string, string | boolean> = {
      claimText: claimText.trim(),
      claimType,
    }
    if (selfClaim) payload.selfClaim = true
    else payload.clientId = clientId
    try {
      const r = await fetch("/api/agency/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const j = await r.json()
      if (!r.ok) {
        if (r.status === 429) throw new Error(j.message || "Daily limit reached")
        throw new Error(j.error || "submit_failed")
      }
      setResult(j)
      setClaimText("")
      router.refresh()
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="rounded-xl border bg-card p-5 mb-6">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
        <div>
          <h2 className="font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> Quick claim
          </h2>
          <p className="text-xs text-muted-foreground">
            Submit a claim on a client&apos;s behalf — we score it instantly.
          </p>
        </div>
        {unlimited ? (
          <Badge variant="success" className="gap-1">
            <Rocket className="w-3 h-3" /> Unlimited
          </Badge>
        ) : (
          <Badge variant={locked ? "destructive" : "outline"}>
            {used}/{dailyLimit} today
          </Badge>
        )}
      </div>

      {locked && (
        <Alert variant="warning" className="mb-4">
          <AlertTriangle />
          <AlertDescription>
            <strong>Daily free-tier limit hit.</strong>{" "}
            <Link href="/pricing" className="underline font-semibold">Upgrade to Pro</Link>{" "}
            or{" "}
            <Link href="/api/stripe/checkout?plan=membership" className="underline font-semibold">
              activate the $8/mo membership
            </Link>{" "}
            for unlimited claims. Resets at midnight UTC.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-3 mb-3">
        <Select
          value={clientId}
          onValueChange={setClientId}
          disabled={loading || locked}
        >
          <SelectTrigger>
            <SelectValue placeholder="Who is this claim about?" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={SELF}>Self-claim · no client (Unverified badge)</SelectItem>
            {clients.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name} — {c.company || c.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={claimType} onValueChange={setClaimType} disabled={loading || locked}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CLAIM_TYPES.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Textarea
        value={claimText}
        onChange={(e) => setClaimText(e.target.value)}
        placeholder='e.g. "We closed $220K ARR in Q1 from cold email alone."'
        disabled={loading || locked}
        rows={3}
      />

      {err && (
        <Alert variant="destructive" className="mt-3">
          <AlertTriangle />
          <AlertDescription>{err}</AlertDescription>
        </Alert>
      )}

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-[11px] text-muted-foreground">Powered by VerifiedSXO AI · 25y marketing corpus</p>
        <Button
          onClick={submit}
          disabled={loading || locked || !clientId || claimText.trim().length < 10}
        >
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Scoring…</> : <>Score + save <ArrowRight className="w-4 h-4" /></>}
        </Button>
      </div>

      {clientId === SELF && (
        <Alert variant="warning" className="mt-3">
          <ShieldAlert />
          <AlertDescription>
            <strong>Self-claim mode.</strong> We&rsquo;ll score it and give you an <em>Unverified</em> embeddable badge, but it
            can&rsquo;t earn the green Verified stamp until a client attests with live data.
          </AlertDescription>
        </Alert>
      )}

      {result && (
        <div className="mt-4 rounded-lg border bg-background p-4 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-2">
            <div className={`text-3xl font-bold tabular-nums ${
              result.score >= 75 ? "text-emerald-500" :
              result.score >= 50 ? "text-cyan-500" :
              result.score >= 25 ? "text-orange-500" : "text-rose-500"
            }`}>{result.score}%</div>
            <div className="flex-1">
              <div className="text-sm font-semibold">Scored · {result.tier}</div>
              <div className="text-[10px] text-muted-foreground font-mono">{result.claimId}</div>
            </div>
            <Link href={`/dashboard/claims/${result.claimId}`} className="text-xs underline underline-offset-2 flex items-center gap-1">
              Open <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {result.reasoning.length > 0 && (
            <ul className="space-y-1 text-xs text-muted-foreground">
              {result.reasoning.map((r, i) => (
                <li key={i} className="flex gap-2">
                  <span className="font-mono text-foreground/60">0{i + 1}</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-3 pt-3 border-t flex items-center justify-between text-[11px] text-muted-foreground">
            {result.selfClaim ? (
              <>
                <span>Self-claim · Unverified badge ready</span>
                {result.badgeSlug && (
                  <Link href={`/v/${result.badgeSlug}`} className="underline" target="_blank">Copy badge →</Link>
                )}
              </>
            ) : (
              <>
                <span>Next step: upload evidence + verify live data on the claim page</span>
                <Link href={`/dashboard/claims/${result.claimId}`} className="underline">Open claim →</Link>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
