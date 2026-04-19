import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { ClaimStatusBadge } from "@/components/claim-status-badge"
import { Button } from "@/components/ui/button"
import { buildTimeline, STATUS_META, type ClaimStatus } from "@/lib/claims"
import { ShieldCheck, ArrowLeft, ArrowRight, Upload, Sparkles } from "lucide-react"

export const dynamic = "force-dynamic"

interface Props { params: Promise<{ id: string }> }

export default async function ClaimDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=/client/claims/${id}`)

  const admin = getSupabaseAdmin()
  const { data: clientRow } = await admin
    .from("vsxo_agency_clients")
    .select("id, agency_id")
    .eq("user_id", user.id)
    .maybeSingle()
  if (!clientRow) redirect("/dashboard")

  const { data: claim } = await admin
    .from("vsxo_claims")
    .select("*")
    .eq("id", id)
    .eq("client_id", clientRow.id)
    .maybeSingle()
  if (!claim) notFound()

  const { data: verifications } = await admin
    .from("vsxo_verifications")
    .select("id, provider, evidence, passed, confidence, verified_at")
    .eq("claim_id", id)
    .order("verified_at", { ascending: false })

  const { data: badge } = await admin
    .from("vsxo_badges")
    .select("slug, script_token, last_verified_at, public_visible, embed_count")
    .eq("claim_id", id)
    .maybeSingle()

  const status = (claim.status as ClaimStatus) || "scored"
  const timeline = buildTimeline({
    created_at: claim.created_at,
    status,
    verified_at: claim.verified_at,
    rejected_at: claim.rejected_at,
    needs_docs_at: claim.needs_docs_at,
    elevated_at: claim.elevated_at,
  })

  return (
    <>
      <Header />
      <main className="pt-28 pb-24 px-4 sm:px-6 lg:px-8 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <Link href="/client/claims" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-5">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to claims
          </Link>

          <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
            <div className="flex-1 min-w-0">
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                Claim · {claim.claim_type} · {new Date(claim.created_at).toLocaleString()}
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-balance mb-3">
                &ldquo;{claim.claim_text}&rdquo;
              </h1>
              <ClaimStatusBadge status={status} size="md" />
              <p className="text-xs text-muted-foreground mt-2">{STATUS_META[status]?.hint}</p>
            </div>

            {badge && (
              <Link href={`/verified/${badge.slug}`}>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> Public page
                </Button>
              </Link>
            )}
          </div>

          {/* Scorecard */}
          <section className="rounded-xl border border-border bg-card p-6 mb-6">
            <div className="flex items-center gap-4">
              <div className={`text-5xl font-bold tabular-nums ${
                (claim.plausibility_score ?? 0) >= 75 ? "text-emerald-500" :
                (claim.plausibility_score ?? 0) >= 50 ? "text-cyan-500" :
                (claim.plausibility_score ?? 0) >= 25 ? "text-orange-500" : "text-rose-500"
              }`}>{claim.plausibility_score ?? "—"}%</div>
              <div>
                <div className="text-sm font-semibold">Plausibility score</div>
                <div className="text-xs text-muted-foreground">
                  Scored by <span className="font-mono">{claim.plausibility_tier || "—"}</span>
                </div>
              </div>
            </div>
            {Array.isArray(claim.plausibility_reasoning) && claim.plausibility_reasoning.length > 0 && (
              <ul className="space-y-2 text-sm mt-5">
                {(claim.plausibility_reasoning as string[]).map((r, i) => (
                  <li key={i} className="flex gap-2.5 text-muted-foreground">
                    <span className="text-foreground/60 font-mono text-xs pt-0.5">0{i + 1}</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Timeline */}
          <section className="rounded-xl border border-border bg-card p-6 mb-6">
            <h2 className="text-sm font-semibold mb-4 uppercase tracking-wider text-muted-foreground">Timeline</h2>
            <ol className="space-y-3">
              {timeline.map((step, i) => (
                <li key={`${step.status}-${i}`} className="flex items-start gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${
                    step.status === "rejected" ? "bg-rose-500" : step.status === "verified" || step.status === "elevated" ? "bg-emerald-500" : "bg-foreground"
                  }`} />
                  <div>
                    <div className="text-sm font-medium">{step.label}</div>
                    <div className="text-xs text-muted-foreground">{new Date(step.at).toLocaleString()}</div>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* Verifications */}
          {verifications && verifications.length > 0 && (
            <section className="rounded-xl border border-border bg-card p-6 mb-6">
              <h2 className="text-sm font-semibold mb-4 uppercase tracking-wider text-muted-foreground">Verifications</h2>
              <ul className="space-y-3">
                {verifications.map((v) => {
                  const summary = ((v.evidence as Record<string, unknown>)?.summary as string) || ""
                  return (
                    <li key={v.id} className={`p-4 rounded-lg border ${v.passed ? "border-emerald-500/40 bg-emerald-500/5" : "border-rose-500/40 bg-rose-500/5"}`}>
                      <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                        <span className={`text-sm font-semibold ${v.passed ? "text-emerald-500" : "text-rose-500"}`}>
                          {v.passed ? "Passed" : "Not passed"} · {v.confidence}% confidence
                        </span>
                        <span className="text-xs text-muted-foreground font-mono">
                          {v.provider.toUpperCase()} · {new Date(v.verified_at).toLocaleString()}
                        </span>
                      </div>
                      {summary && <p className="text-sm text-muted-foreground">{summary}</p>}
                    </li>
                  )
                })}
              </ul>
            </section>
          )}

          {/* Actions */}
          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-sm font-semibold mb-4 uppercase tracking-wider text-muted-foreground">Next steps</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(status === "scored" || status === "needs_docs" || status === "rejected") && (
                <Link href={`/client/verify?claim=${claim.id}`} className="p-4 rounded-lg border border-border bg-background hover:border-foreground/30 transition-colors block">
                  <Sparkles className="w-4 h-4 mb-2" />
                  <div className="text-sm font-medium mb-1">Re-run verification</div>
                  <div className="text-xs text-muted-foreground">Submit with current data connection</div>
                </Link>
              )}
              <div className="p-4 rounded-lg border border-border bg-background opacity-70">
                <Upload className="w-4 h-4 mb-2" />
                <div className="text-sm font-medium mb-1">Upload evidence</div>
                <div className="text-xs text-muted-foreground">Add supporting docs (coming next)</div>
              </div>
              {status === "verified" && (
                <div className="p-4 rounded-lg border border-border bg-background opacity-70">
                  <ShieldCheck className="w-4 h-4 mb-2" />
                  <div className="text-sm font-medium mb-1">Elevate to 100%</div>
                  <div className="text-xs text-muted-foreground">AI review with your docs (coming next)</div>
                </div>
              )}
              {badge && (
                <Link href={`/verified/${badge.slug}`} className="p-4 rounded-lg border border-border bg-background hover:border-foreground/30 transition-colors block">
                  <ShieldCheck className="w-4 h-4 mb-2 text-emerald-500" />
                  <div className="text-sm font-medium mb-1">Public page</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    /verified/{badge.slug} <ArrowRight className="w-3 h-3" />
                  </div>
                </Link>
              )}
            </div>
          </section>
        </div>
      </main>
    </>
  )
}
