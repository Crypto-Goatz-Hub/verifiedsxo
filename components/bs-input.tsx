"use client"

/**
 * Lean claim-input unit. Lives below the H1 in the hero — renders
 * result as a compact card beneath. No radar visuals (those are now
 * in the hero background).
 */

import { useState, useRef } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Loader2, ShieldCheck, XCircle, Sparkles, AlertTriangle } from "lucide-react"

interface ScoreResp {
  score: number
  reasoning: string[]
  tier: "agent" | "groq" | "fallback"
  claimType: string
  usage?: { used: number; limit: number | null; resets: string | null }
}

function tone(score: number) {
  if (score >= 75) return { label: "Probably true", cls: "text-emerald-500", icon: ShieldCheck }
  if (score >= 50) return { label: "Plausible", cls: "text-cyan-500", icon: Sparkles }
  if (score >= 25) return { label: "Unlikely", cls: "text-orange-500", icon: AlertTriangle }
  return { label: "Strong BS signal", cls: "text-rose-500", icon: XCircle }
}

export function BsInput() {
  const [claim, setClaim] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ScoreResp | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement | null>(null)

  async function submit() {
    if (claim.trim().length < 10) { setErr("Give us a full sentence at least."); return }
    setErr(null); setLoading(true); setResult(null)
    try {
      const r = await fetch("/api/widget/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claim: claim.trim() }),
      })
      const j = await r.json()
      if (!r.ok) {
        if (r.status === 429) {
          setErr(j.message || "Daily limit reached — sign up for unlimited.")
        } else {
          setErr(j.error || "Couldn't score that — try again.")
        }
        return
      }
      setResult(j)
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Network error")
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setResult(null); setClaim(""); setErr(null)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const ToneIcon = result ? tone(result.score).icon : Sparkles

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-5">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-balance">
          Wondering if that marketing claim is{" "}
          <span className="bg-gradient-to-r from-violet-500 to-cyan-500 bg-clip-text text-transparent">
            Bullsh*t?
          </span>
        </h2>
        <p className="text-muted-foreground mt-2 text-sm md:text-base">
          Paste it right here and let&apos;s take a look.
        </p>
      </div>

      <div
        className={`rounded-2xl border bg-card/85 backdrop-blur-xl p-4 md:p-5 shadow-lg transition-colors text-left ${
          focused || claim ? "border-violet-500/40 shadow-violet-500/10" : "border-border"
        }`}
      >
        <textarea
          ref={inputRef}
          value={claim}
          onChange={(e) => setClaim(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); submit() }
          }}
          placeholder={'e.g. "We built 5 SaaS apps last week and made $100K in revenue."'}
          disabled={loading}
          className="w-full min-h-[84px] bg-transparent outline-none resize-none text-base placeholder:text-muted-foreground/60"
        />
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-border/60">
          <div className="text-[11px] text-muted-foreground">
            5 free checks per day · Powered by VerifiedSXO AI
          </div>
          {result ? (
            <Button size="sm" variant="outline" onClick={reset}>Check another →</Button>
          ) : (
            <Button
              onClick={submit}
              disabled={loading || claim.trim().length < 10}
              className="gap-2 bg-foreground text-background hover:bg-foreground/90"
            >
              {loading ? (<><Loader2 className="w-4 h-4 animate-spin" /> Scanning…</>) : (<>Check it <ArrowRight className="w-4 h-4" /></>)}
            </Button>
          )}
        </div>
      </div>

      {err && (
        <div className="mt-3 flex items-start gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-sm text-rose-500 text-left">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{err} {err?.toLowerCase().includes("limit") && <Link href="/signup" className="underline font-semibold">Sign up</Link>}</span>
        </div>
      )}

      {result && (
        <div className="mt-4 rounded-2xl border border-border bg-card/90 backdrop-blur p-5 text-left animate-fade-in-up">
          <div className="flex items-center gap-4 mb-4">
            <div className={`text-5xl font-bold ${tone(result.score).cls}`}>{result.score}%</div>
            <div>
              <div className={`font-semibold flex items-center gap-1.5 ${tone(result.score).cls}`}>
                <ToneIcon className="w-4 h-4" />
                {tone(result.score).label}
              </div>
              <div className="text-xs text-muted-foreground">
                Claim type: <span className="font-mono">{result.claimType}</span> · scored by <span className="font-mono">{result.tier}</span>
              </div>
            </div>
          </div>
          <ul className="space-y-2 text-sm">
            {result.reasoning.map((r, i) => (
              <li key={i} className="flex gap-2.5 text-muted-foreground">
                <span className="text-foreground/60 font-mono text-xs pt-0.5">0{i + 1}</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
          {result.score < 75 && (
            <div className="mt-4 pt-4 border-t border-border flex items-center justify-between gap-3 flex-wrap">
              <div className="text-sm text-muted-foreground">Disagree? Prove it with your own data.</div>
              <Link href="/signup">
                <Button size="sm" className="bg-gradient-to-r from-violet-500 to-cyan-500 text-white hover:opacity-90">
                  Prove this claim →
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
