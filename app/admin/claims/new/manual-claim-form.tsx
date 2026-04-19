"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Loader2, AlertTriangle, CheckCircle2, ShieldCheck, ArrowRight } from "lucide-react"

interface Agency { id: string; name: string; slug: string }
interface Client { id: string; name: string; email: string; agency_id: string }

export function ManualClaimForm({ agencies, clients }: { agencies: Agency[]; clients: Client[] }) {
  const router = useRouter()
  const [agencyId, setAgencyId] = useState("")
  const [clientId, setClientId] = useState("")
  const [claimText, setClaimText] = useState("")
  const [claimType, setClaimType] = useState("general")
  const [plausibilityScore, setPlausibilityScore] = useState<number | "">("")
  const [reasoning, setReasoning] = useState("")
  const [evidenceSummary, setEvidenceSummary] = useState("")
  const [confidence, setConfidence] = useState<number>(92)
  const [provider, setProvider] = useState("manual")
  const [publishBadge, setPublishBadge] = useState(true)
  const [autoElevate, setAutoElevate] = useState(false)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [ok, setOk] = useState<{ claimId: string; badgeSlug?: string } | null>(null)

  const filteredClients = useMemo(
    () => (agencyId ? clients.filter((c) => c.agency_id === agencyId) : []),
    [agencyId, clients]
  )

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null); setOk(null)
    if (!agencyId || !clientId) return setErr("Agency and client required")
    if (claimText.trim().length < 10) return setErr("Claim needs a full sentence")
    setLoading(true)
    try {
      const r = await fetch("/api/admin/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agencyId,
          clientId,
          claimText: claimText.trim(),
          claimType,
          plausibilityScore: typeof plausibilityScore === "number" ? plausibilityScore : null,
          reasoning: reasoning.split("\n").map((s) => s.trim()).filter(Boolean),
          evidenceSummary: evidenceSummary.trim() || null,
          confidence,
          provider,
          publishBadge,
          autoElevate,
        }),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || "save_failed")
      setOk({ claimId: j.claimId, badgeSlug: j.badgeSlug })
      setTimeout(() => router.push(`/admin/claims/${j.claimId}`), 1200)
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "error")
    } finally {
      setLoading(false)
    }
  }

  if (ok) {
    return (
      <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-8 text-center">
        <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 mb-3" />
        <h2 className="text-lg font-semibold mb-1">Claim saved</h2>
        <p className="text-sm text-muted-foreground mb-1">Claim ID: <span className="font-mono">{ok.claimId}</span></p>
        {ok.badgeSlug && (
          <p className="text-sm text-muted-foreground">
            Badge slug: <span className="font-mono">{ok.badgeSlug}</span>
          </p>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-border bg-card p-6 md:p-8 space-y-5">
      {/* Agency + client */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Agency</label>
          <select
            value={agencyId}
            onChange={(e) => { setAgencyId(e.target.value); setClientId("") }}
            required
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:border-foreground/30 outline-none text-sm"
          >
            <option value="">— select agency —</option>
            {agencies.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.slug})</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Client</label>
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            disabled={!agencyId}
            required
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:border-foreground/30 outline-none text-sm disabled:opacity-50"
          >
            <option value="">{agencyId ? "— select client —" : "pick agency first"}</option>
            {filteredClients.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.email}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Claim text (as publicly stated)</label>
        <textarea
          value={claimText}
          onChange={(e) => setClaimText(e.target.value)}
          required
          rows={3}
          placeholder={'e.g. "We ranked #1 on Google for \'enterprise CRM consulting\' in Q1 2026"'}
          className="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:border-foreground/30 outline-none text-sm resize-y"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Type</label>
          <select
            value={claimType}
            onChange={(e) => setClaimType(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm"
          >
            <option>ranking</option>
            <option>traffic</option>
            <option>revenue</option>
            <option>audience</option>
            <option>conversion</option>
            <option>output</option>
            <option>customer</option>
            <option>general</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Plausibility</label>
          <input
            type="number"
            min={0} max={100}
            value={plausibilityScore}
            onChange={(e) => setPlausibilityScore(e.target.value === "" ? "" : Number(e.target.value))}
            placeholder="auto"
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm tabular-nums"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Evidence source</label>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm"
          >
            <option value="manual">manual</option>
            <option value="gsc">gsc</option>
            <option value="ga4">ga4</option>
            <option value="google_ads">google_ads</option>
            <option value="stripe">stripe</option>
            <option value="screenshot">screenshot</option>
            <option value="document">document</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Confidence</label>
          <input
            type="number"
            min={0} max={100}
            value={confidence}
            onChange={(e) => setConfidence(Number(e.target.value))}
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm tabular-nums"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Plausibility reasoning (one per line, optional)</label>
        <textarea
          value={reasoning}
          onChange={(e) => setReasoning(e.target.value)}
          rows={3}
          placeholder={"Benchmarks in B2B SEO for this keyword category…\nCompeting sites dominate top 3 positions…\nPlausible for a specialist with strong backlinks."}
          className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm resize-y"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Evidence summary (shown on public page)</label>
        <textarea
          value={evidenceSummary}
          onChange={(e) => setEvidenceSummary(e.target.value)}
          rows={3}
          placeholder="Verified against Search Console export dated 2026-03-15 showing 94 days at position 1 for the exact keyword."
          className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm resize-y"
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={publishBadge} onChange={(e) => setPublishBadge(e.target.checked)} />
          Publish badge + /verified page
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={autoElevate} onChange={(e) => setAutoElevate(e.target.checked)} />
          Mark as elevated 100% (requires badge)
        </label>
      </div>

      {err && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-sm text-rose-500">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{err}</span>
        </div>
      )}

      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={loading} size="lg" className="gap-2 bg-foreground text-background hover:bg-foreground/90">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <><ShieldCheck className="w-4 h-4" /> Save + verify <ArrowRight className="w-4 h-4" /></>}
        </Button>
      </div>
    </form>
  )
}
