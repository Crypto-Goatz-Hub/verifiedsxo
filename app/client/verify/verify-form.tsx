"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, ShieldCheck, XCircle, AlertTriangle, ArrowRight, Copy, CheckCircle2 } from "lucide-react"
import Link from "next/link"

type ClaimType = "ranking" | "traffic"

interface ScoreOut {
  claimId: string
  score: number
  reasoning: string[]
  tier: string
}

interface VerifyOut {
  passed: boolean
  confidence: number
  summary: string
  badgeSlug?: string
  scriptToken?: string
  evidence: Record<string, unknown>
}

export function VerifyForm() {
  const [claimType, setClaimType] = useState<ClaimType>("ranking")
  const [claimText, setClaimText] = useState("")
  const [site, setSite] = useState("")
  // ranking fields
  const [keyword, setKeyword] = useState("")
  const [maxPos, setMaxPos] = useState(10)
  // traffic fields
  const [metric, setMetric] = useState<"clicks" | "impressions">("clicks")
  const [minValue, setMinValue] = useState(1000)
  const [windowDays, setWindowDays] = useState(28)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [score, setScore] = useState<ScoreOut | null>(null)
  const [verify, setVerify] = useState<VerifyOut | null>(null)

  function target() {
    if (claimType === "ranking") return { type: "ranking", site, keyword, max_position: maxPos }
    return { type: "traffic", site, metric, min_value: minValue, window_days: windowDays }
  }

  async function onScore() {
    setErr(null); setScore(null); setVerify(null)
    if (claimText.trim().length < 10) return setErr("Describe the claim in a full sentence")
    if (!site.trim()) return setErr("Site URL required (e.g. https://example.com/)")
    setLoading(true)
    try {
      const r = await fetch("/api/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claimText: claimText.trim(), claimType, target: target() }),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || "scoring failed")
      setScore(j)
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "error")
    } finally {
      setLoading(false)
    }
  }

  async function onVerify() {
    if (!score?.claimId) return
    setErr(null); setVerify(null); setLoading(true)
    try {
      const r = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claimId: score.claimId }),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || "verification failed")
      setVerify(j)
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-6">
        <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Claim type</label>
        <div className="flex gap-2 mt-2 mb-6">
          {(["ranking", "traffic"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setClaimType(t)}
              className={`flex-1 p-3 rounded-lg border text-sm font-medium transition-colors ${
                claimType === t ? "border-foreground/40 bg-foreground/5" : "border-border hover:border-foreground/20"
              }`}
            >
              {t === "ranking" ? "Ranking" : "Traffic"}
              <div className="text-[10px] font-normal text-muted-foreground mt-0.5">
                {t === "ranking" ? "\"I rank #N for X\"" : "\"I get N clicks/impressions\""}
              </div>
            </button>
          ))}
        </div>

        <label className="block text-sm font-medium mb-2">The claim (as written publicly)</label>
        <textarea
          value={claimText}
          onChange={(e) => setClaimText(e.target.value)}
          placeholder={claimType === "ranking"
            ? "e.g. \"We rank #1 on Google for 'enterprise CRM consulting'\""
            : "e.g. \"Our site gets 50,000 organic clicks per month from Google\""}
          className="w-full min-h-[80px] p-3 rounded-lg border border-border bg-background focus:border-foreground/30 outline-none text-sm"
        />

        <label className="block text-sm font-medium mt-5 mb-2">Site URL in Search Console</label>
        <input
          type="text"
          value={site}
          onChange={(e) => setSite(e.target.value)}
          placeholder="https://example.com/"
          className="w-full p-3 rounded-lg border border-border bg-background focus:border-foreground/30 outline-none text-sm font-mono"
        />
        <p className="text-[11px] text-muted-foreground mt-1">Must exactly match a property you own in Search Console (including trailing slash).</p>

        {claimType === "ranking" ? (
          <div className="grid grid-cols-2 gap-4 mt-5">
            <div>
              <label className="block text-sm font-medium mb-2">Keyword</label>
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="enterprise crm consulting"
                className="w-full p-3 rounded-lg border border-border bg-background focus:border-foreground/30 outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Max position claimed</label>
              <input
                type="number"
                min={1}
                max={100}
                value={maxPos}
                onChange={(e) => setMaxPos(Number(e.target.value) || 10)}
                className="w-full p-3 rounded-lg border border-border bg-background focus:border-foreground/30 outline-none text-sm tabular-nums"
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4 mt-5">
            <div>
              <label className="block text-sm font-medium mb-2">Metric</label>
              <select
                value={metric}
                onChange={(e) => setMetric(e.target.value as "clicks" | "impressions")}
                className="w-full p-3 rounded-lg border border-border bg-background focus:border-foreground/30 outline-none text-sm"
              >
                <option value="clicks">Clicks</option>
                <option value="impressions">Impressions</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Min value claimed</label>
              <input
                type="number"
                min={1}
                value={minValue}
                onChange={(e) => setMinValue(Number(e.target.value) || 1000)}
                className="w-full p-3 rounded-lg border border-border bg-background focus:border-foreground/30 outline-none text-sm tabular-nums"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Window (days)</label>
              <input
                type="number"
                min={7}
                max={90}
                value={windowDays}
                onChange={(e) => setWindowDays(Number(e.target.value) || 28)}
                className="w-full p-3 rounded-lg border border-border bg-background focus:border-foreground/30 outline-none text-sm tabular-nums"
              />
            </div>
          </div>
        )}

        {err && (
          <div className="mt-5 flex items-start gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-sm text-rose-500">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{err}</span>
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <Button
            onClick={onScore}
            disabled={loading || !!score}
            size="lg"
            className="flex-1 gap-2 bg-foreground text-background hover:bg-foreground/90"
          >
            {loading && !score ? <><Loader2 className="w-4 h-4 animate-spin" /> Scoring…</> : <>1. Score plausibility <ArrowRight className="w-4 h-4" /></>}
          </Button>
          {score && !verify && (
            <Button
              onClick={onVerify}
              disabled={loading}
              size="lg"
              className="flex-1 gap-2 bg-gradient-to-r from-violet-500 to-cyan-500 text-white hover:opacity-90"
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying…</> : <>2. Verify with real data <ShieldCheck className="w-4 h-4" /></>}
            </Button>
          )}
        </div>
      </div>

      {score && (
        <div className="rounded-xl border border-border bg-card p-6 animate-fade-in-up">
          <div className="flex items-center gap-4 mb-4">
            <div className="text-4xl font-bold">{score.score}%</div>
            <div>
              <div className="text-sm font-semibold">Plausibility</div>
              <div className="text-xs text-muted-foreground">Scored by {score.tier}</div>
            </div>
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {score.reasoning.map((r, i) => (
              <li key={i} className="flex gap-2"><span className="text-foreground/60 font-mono text-xs pt-0.5">0{i + 1}</span><span>{r}</span></li>
            ))}
          </ul>
        </div>
      )}

      {verify && (
        <div className={`rounded-xl border p-6 animate-fade-in-up ${verify.passed ? "border-emerald-500/40 bg-emerald-500/5" : "border-rose-500/40 bg-rose-500/5"}`}>
          <div className="flex items-center gap-3 mb-4">
            {verify.passed ? (
              <ShieldCheck className="w-7 h-7 text-emerald-500" />
            ) : (
              <XCircle className="w-7 h-7 text-rose-500" />
            )}
            <div>
              <div className="text-lg font-bold">{verify.passed ? "Verified" : "Not verified"}</div>
              <div className="text-xs text-muted-foreground">Confidence {verify.confidence}% · source: Search Console</div>
            </div>
          </div>
          <p className="text-sm mb-4">{verify.summary}</p>

          {verify.passed && verify.badgeSlug && (
            <BadgeAssets slug={verify.badgeSlug} />
          )}

          <pre className="mt-4 p-3 rounded-lg bg-background text-[11px] overflow-auto border border-border">
{JSON.stringify(verify.evidence, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}

function BadgeAssets({ slug }: { slug: string }) {
  const [copied, setCopied] = useState<string | null>(null)
  const base = typeof window !== "undefined" ? window.location.origin : "https://verifiedsxo.com"
  const embed = `<script src="${base}/v/${slug}" async></script>`
  const link = `${base}/verified/${slug}`

  function copy(text: string, label: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(label)
      setTimeout(() => setCopied(null), 1800)
    })
  }

  return (
    <div className="rounded-lg border border-border bg-background p-4 space-y-3">
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Embed on your site</div>
          <button onClick={() => copy(embed, "embed")} className="text-xs flex items-center gap-1 text-foreground/70 hover:text-foreground">
            {copied === "embed" ? <><CheckCircle2 className="w-3 h-3" /> copied</> : <><Copy className="w-3 h-3" /> copy</>}
          </button>
        </div>
        <code className="block p-2 bg-foreground/5 rounded text-[11px] font-mono break-all">{embed}</code>
      </div>
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Public verification page</div>
          <button onClick={() => copy(link, "link")} className="text-xs flex items-center gap-1 text-foreground/70 hover:text-foreground">
            {copied === "link" ? <><CheckCircle2 className="w-3 h-3" /> copied</> : <><Copy className="w-3 h-3" /> copy</>}
          </button>
        </div>
        <Link href={`/verified/${slug}`} className="text-sm text-violet-500 hover:text-cyan-500 underline underline-offset-2 break-all">
          {link}
        </Link>
      </div>
    </div>
  )
}
