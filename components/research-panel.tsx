"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertTriangle, Telescope, Check, Minus, X } from "lucide-react"

export interface ResearchCitation {
  url: string
  title?: string | null
  snippet?: string | null
  source?: string | null
  relevance: number
  stance: "supports" | "contradicts" | "unrelated" | "mixed"
  fetched_ok?: boolean
}

export interface ResearchBundle {
  verdict: "likely_true" | "likely_false" | "unsupported" | "mixed" | "inconclusive"
  confidence: number
  summary: string
  reasoning: string[]
  red_flags: string[]
  queries?: string[]
  tier: "crm_agent" | "groq" | "fallback"
  depth?: "basic" | "deep"
  duration_ms?: number
}

interface Props {
  claimId: string
  initial: ResearchBundle | null
  initialCitations: ResearchCitation[]
  ranAt: string | null
  canDeep: boolean
}

const VERDICT_META: Record<ResearchBundle["verdict"], { label: string; cls: string }> = {
  likely_true:    { label: "Likely true",    cls: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" },
  likely_false:   { label: "Likely false",   cls: "bg-rose-500/10 text-rose-600 border-rose-500/30" },
  unsupported:    { label: "Unsupported",    cls: "bg-yellow-500/10 text-yellow-700 border-yellow-500/30" },
  mixed:          { label: "Mixed signals",  cls: "bg-cyan-500/10 text-cyan-600 border-cyan-500/30" },
  inconclusive:   { label: "Inconclusive",   cls: "bg-gray-500/10 text-gray-500 border-gray-500/30" },
}

export function ResearchPanel({ claimId, initial, initialCitations, ranAt, canDeep }: Props) {
  const router = useRouter()
  const [research, setResearch] = useState<ResearchBundle | null>(initial)
  const [citations, setCitations] = useState<ResearchCitation[]>(initialCitations || [])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [lastRunAt, setLastRunAt] = useState<string | null>(ranAt)
  const [depth, setDepth] = useState<"basic" | "deep">(canDeep ? "deep" : "basic")

  async function run() {
    setLoading(true); setErr(null)
    try {
      const r = await fetch(`/api/claims/${claimId}/research`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ depth }),
      })
      const j = await r.json()
      if (!r.ok) {
        if (r.status === 429) throw new Error(j.message || "Cooldown — try again shortly")
        throw new Error(j.error || "research_failed")
      }
      setResearch(j.result)
      setCitations(j.result.citations)
      setLastRunAt(new Date().toISOString())
      router.refresh()
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "error")
    } finally {
      setLoading(false)
    }
  }

  const meta = research ? VERDICT_META[research.verdict] : null

  return (
    <section className="rounded-xl border bg-card p-6 mb-6">
      <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500/10 to-cyan-500/10 flex items-center justify-center shrink-0">
            <Telescope className="w-4 h-4 text-violet-500" />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Verify engine · K-layer</div>
            <h2 className="text-lg font-semibold">AI research</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Entity extraction → web search → cross-source synthesis. Powered by the CRM marketing corpus + Groq.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canDeep && (
            <select
              value={depth}
              onChange={(e) => setDepth(e.target.value as "basic" | "deep")}
              className="h-9 rounded-md border bg-background px-3 text-xs focus:border-ring focus:ring-ring/50 focus:ring-[3px] outline-none"
              disabled={loading}
            >
              <option value="basic">Basic · 3 sources</option>
              <option value="deep">Deep · 8 sources</option>
            </select>
          )}
          <Button onClick={run} disabled={loading} size="sm">
            {loading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Researching…</> : (research ? "Re-run research" : "Research this claim")}
          </Button>
        </div>
      </div>

      {err && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle />
          <AlertDescription>{err}</AlertDescription>
        </Alert>
      )}

      {!research && !loading && !err && (
        <div className="rounded-lg border border-dashed bg-background p-6 text-center">
          <Telescope className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
          <div className="text-sm font-medium mb-1">No research yet for this claim</div>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Click <strong>Research this claim</strong> to run the Verify engine. We&rsquo;ll pull third-party
            sources, cross-check them against your marketing K-layer, and write a verdict.
          </p>
        </div>
      )}

      {research && meta && (
        <>
          {/* Verdict header */}
          <div className="flex items-center flex-wrap gap-3 mb-4">
            <span className={`inline-flex items-center px-3 py-1 rounded-full border text-sm font-semibold ${meta.cls}`}>
              {meta.label}
            </span>
            <span className="text-sm text-muted-foreground">
              <span className="font-bold text-foreground tabular-nums">{research.confidence}%</span> confidence
            </span>
            <Badge variant="outline" className="font-mono">{research.tier}</Badge>
            {research.depth && <Badge variant="secondary" className="font-mono">{research.depth}</Badge>}
            {lastRunAt && (
              <span className="text-xs text-muted-foreground">
                Ran {new Date(lastRunAt).toLocaleString()}
              </span>
            )}
          </div>

          {research.summary && (
            <p className="text-sm leading-relaxed mb-4">{research.summary}</p>
          )}

          {research.reasoning.length > 0 && (
            <div className="mb-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Reasoning</div>
              <ul className="space-y-2 text-sm">
                {research.reasoning.map((r, i) => (
                  <li key={i} className="flex gap-2.5 text-muted-foreground">
                    <span className="text-foreground/60 font-mono text-xs pt-0.5">{String(i + 1).padStart(2, "0")}</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {research.red_flags.length > 0 && (
            <div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/5 p-3">
              <div className="text-xs font-semibold uppercase tracking-wider text-rose-600 mb-2">Red flags</div>
              <ul className="space-y-1 text-sm text-rose-700 dark:text-rose-400">
                {research.red_flags.map((f, i) => (
                  <li key={i}>· {f}</li>
                ))}
              </ul>
            </div>
          )}

          {research.queries && research.queries.length > 0 && (
            <details className="mb-4">
              <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                Search queries used · {research.queries.length}
              </summary>
              <ul className="mt-2 space-y-1 text-xs font-mono text-muted-foreground pl-4">
                {research.queries.map((q, i) => <li key={i}>· {q}</li>)}
              </ul>
            </details>
          )}

          {citations.length > 0 && (
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Citations · {citations.length}
              </div>
              <ul className="space-y-2.5">
                {citations.map((c, i) => (
                  <CitationItem key={i} index={i + 1} c={c} />
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </section>
  )
}

function CitationItem({ index, c }: { index: number; c: ResearchCitation }) {
  const stanceIcon =
    c.stance === "supports" ? <Check className="w-3 h-3 text-emerald-500" /> :
    c.stance === "contradicts" ? <X className="w-3 h-3 text-rose-500" /> :
    c.stance === "mixed" ? <Minus className="w-3 h-3 text-cyan-500" /> :
    <Minus className="w-3 h-3 text-muted-foreground" />

  const stanceLabel = c.stance.charAt(0).toUpperCase() + c.stance.slice(1)

  return (
    <li className="rounded-lg border bg-background p-3 hover:border-foreground/25 transition-colors">
      <div className="flex items-start gap-3">
        <div className="text-xs font-mono text-muted-foreground shrink-0 w-6 pt-0.5">[{index}]</div>
        <div className="flex-1 min-w-0">
          <a href={c.url} target="_blank" rel="noopener" className="text-sm font-medium hover:underline line-clamp-1">
            {c.title || c.url}
          </a>
          <div className="text-[11px] text-muted-foreground font-mono mb-1 truncate">{c.source || c.url}</div>
          {c.snippet && <p className="text-xs text-muted-foreground line-clamp-2">{c.snippet}</p>}
        </div>
        <div className="shrink-0 flex flex-col items-end gap-1 text-[10px] uppercase tracking-wider">
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            {stanceIcon} {stanceLabel}
          </span>
          <span className="font-mono tabular-nums">{c.relevance}%</span>
        </div>
      </div>
    </li>
  )
}
