"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, Loader2, Sparkles, TrendingUp, AlertTriangle } from "lucide-react"

interface ScoreResponse {
  score: number
  reasoning: string[]
  tier: "agent" | "groq" | "fallback"
  claimType: string
  nextStep: "connect_data" | "verified_already" | "insufficient_evidence"
}

function scoreColor(score: number): string {
  if (score >= 70) return "from-emerald-400 to-cyan-400"
  if (score >= 40) return "from-yellow-400 to-orange-400"
  return "from-rose-400 to-red-500"
}

export function ClaimIntake() {
  const [claim, setClaim] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ScoreResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit() {
    if (claim.trim().length < 10) {
      setError("Claim needs at least 10 characters")
      return
    }
    setError(null)
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claim: claim.trim() }),
      })
      if (!res.ok) throw new Error((await res.json()).error || "scoring failed")
      const data = (await res.json()) as ScoreResponse
      setResult(data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 md:p-8 shadow-sm">
      <label htmlFor="claim" className="block text-sm font-medium mb-2">
        The claim
      </label>
      <textarea
        id="claim"
        value={claim}
        onChange={(e) => setClaim(e.target.value)}
        placeholder={"e.g. \"Built 5 SaaS apps last week and made $100K\" — or any stat you've seen on LinkedIn."}
        className="w-full min-h-[120px] p-4 rounded-lg border border-border bg-background focus:border-foreground/30 focus:ring-2 focus:ring-foreground/10 outline-none resize-y text-base"
        disabled={loading}
      />
      <div className="mt-4 flex items-center justify-between gap-4">
        <span className="text-xs text-muted-foreground">
          {claim.length} characters
        </span>
        <Button
          onClick={onSubmit}
          disabled={loading || claim.trim().length < 10}
          size="lg"
          className="gap-2 bg-foreground text-background hover:bg-foreground/90"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Scoring…
            </>
          ) : (
            <>
              Score this claim
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </div>

      {error && (
        <div className="mt-5 flex items-start gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-sm text-rose-500">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {result && (
        <div className="mt-6 rounded-xl border border-border bg-background p-6 animate-fade-in-up">
          <div className="flex items-center gap-4 mb-5">
            <div
              className={`text-5xl font-bold bg-gradient-to-br ${scoreColor(result.score)} bg-clip-text text-transparent`}
            >
              {result.score}%
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold">Plausibility</div>
              <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" />
                Scored by <span className="font-mono">{result.tier}</span> · {result.claimType}
              </div>
            </div>
          </div>

          <ul className="space-y-2 text-sm mb-6">
            {result.reasoning.map((r, i) => (
              <li key={i} className="flex gap-2.5 text-muted-foreground">
                <span className="text-foreground/60 font-mono text-xs pt-0.5">0{i + 1}</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>

          {result.nextStep === "connect_data" && (
            <div className="pt-4 border-t border-border/50 flex items-start gap-3">
              <TrendingUp className="w-5 h-5 mt-0.5 shrink-0" />
              <div className="flex-1">
                <div className="text-sm font-semibold mb-1">Disagree with the score?</div>
                <p className="text-xs text-muted-foreground mb-3">
                  Prove it. Connect your Analytics, Search Console, Ads, or Stripe — we&apos;ll
                  pull the real numbers and verify.
                </p>
                <Button size="sm" asChild className="bg-foreground text-background hover:bg-foreground/90">
                  <a href="/signup">Prove this claim →</a>
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
