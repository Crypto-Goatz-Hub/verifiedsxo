"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ShieldCheck, Loader2, AlertTriangle, CheckCircle2, XCircle } from "lucide-react"

export interface ElevationOut {
  elevated: boolean
  elevation_score: number
  synthesis: string
  highlights: string[]
  unresolved_gaps: string[]
  model: string
}

export function ElevateButton({ claimId, disabled }: { claimId: string; disabled?: boolean }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ElevationOut | null>(null)
  const [err, setErr] = useState<string | null>(null)

  async function run() {
    setErr(null); setLoading(true); setResult(null)
    try {
      const r = await fetch(`/api/claims/${claimId}/elevate`, { method: "POST" })
      const j = await r.json()
      if (!r.ok) throw new Error(j.message || j.error || "elevation_failed")
      setResult(j)
      setTimeout(() => router.refresh(), 1500)
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Button
        onClick={run}
        disabled={loading || disabled}
        size="lg"
        className="w-full gap-2 bg-gradient-to-r from-violet-500 to-cyan-500 text-white hover:opacity-90"
      >
        {loading ? (<><Loader2 className="w-4 h-4 animate-spin" /> Reviewing evidence…</>) : (<><ShieldCheck className="w-4 h-4" /> Elevate to 100%</>)}
      </Button>

      {err && (
        <div className="mt-3 flex items-start gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-sm text-rose-500">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{err}</span>
        </div>
      )}

      {result && (
        <div
          className={`mt-4 rounded-xl border p-5 text-left animate-fade-in-up ${
            result.elevated ? "border-emerald-500/40 bg-emerald-500/5" : "border-orange-500/40 bg-orange-500/5"
          }`}
        >
          <div className="flex items-center gap-3 mb-3">
            {result.elevated ? <CheckCircle2 className="w-6 h-6 text-emerald-500" /> : <XCircle className="w-6 h-6 text-orange-500" />}
            <div>
              <div className={`font-bold ${result.elevated ? "text-emerald-500" : "text-orange-500"}`}>
                {result.elevated ? "Elevated to 100%" : "Elevation declined"} · {result.elevation_score}%
              </div>
              <div className="text-[10px] text-muted-foreground font-mono">{result.model}</div>
            </div>
          </div>
          <p className="text-sm mb-4">{result.synthesis}</p>

          {result.highlights.length > 0 && (
            <div className="mb-3">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5">Highlights</div>
              <ul className="space-y-1 text-sm">
                {result.highlights.map((h, i) => (
                  <li key={i} className="flex gap-2"><span className="text-foreground/60">✓</span><span>{h}</span></li>
                ))}
              </ul>
            </div>
          )}

          {result.unresolved_gaps.length > 0 && (
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5">Gaps</div>
              <ul className="space-y-1 text-sm">
                {result.unresolved_gaps.map((g, i) => (
                  <li key={i} className="flex gap-2 text-orange-500"><span>!</span><span>{g}</span></li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
