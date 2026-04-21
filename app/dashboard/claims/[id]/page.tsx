import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { ClaimStatusBadge } from "@/components/claim-status-badge"
import { Button } from "@/components/ui/button"
import { buildTimeline, STATUS_META, type ClaimStatus } from "@/lib/claims"
import { EvidenceUploader } from "@/components/evidence-uploader"
import { ElevateButton } from "@/components/elevate-button"
import { ResearchPanel } from "@/components/research-panel"
import { CopyEmbed } from "@/components/copy-embed"
import { ShieldCheck, ArrowLeft } from "lucide-react"

export const dynamic = "force-dynamic"

interface Props { params: Promise<{ id: string }> }

export default async function AgencyClaimDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=/dashboard/claims/${id}`)

  const admin = getSupabaseAdmin()
  const { data: agency } = await admin
    .from("vsxo_agencies")
    .select("id, name, plan, membership_status")
    .eq("owner_user_id", user.id)
    .maybeSingle()
  if (!agency) redirect("/signup")

  const canDeep = agency.plan !== "free" || agency.membership_status === "active"

  const { data: claim } = await admin
    .from("vsxo_claims")
    .select(`
      *,
      client:vsxo_agency_clients(id, name, email, company, website)
    `)
    .eq("id", id)
    .eq("agency_id", agency.id)
    .maybeSingle()
  if (!claim) notFound()

  // @ts-expect-error join
  const client = claim.client

  const { data: verifications } = await admin
    .from("vsxo_verifications")
    .select("id, provider, evidence, passed, confidence, verified_at")
    .eq("claim_id", id)
    .order("verified_at", { ascending: false })

  const { data: badge } = await admin
    .from("vsxo_badges")
    .select("slug, last_verified_at, public_visible, embed_count")
    .eq("claim_id", id)
    .maybeSingle()

  const { data: citations } = await admin
    .from("vsxo_claim_citations")
    .select("url, title, snippet, source, relevance, stance, fetched_ok")
    .eq("claim_id", id)
    .order("relevance", { ascending: false })

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
          <Link href="/dashboard/claims" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-5">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to claims
          </Link>

          <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
            <div className="flex-1 min-w-0">
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                {claim.self_claim
                  ? `Self-claim · ${claim.claim_type}`
                  : `${client?.name || ""} ${client?.company ? `· ${client.company}` : ""} · ${claim.claim_type}`}
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-balance mb-3">
                &ldquo;{claim.claim_text}&rdquo;
              </h1>
              <div className="flex items-center gap-2 flex-wrap">
                <ClaimStatusBadge status={status} size="md" />
                {claim.self_claim && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-yellow-500/30 bg-yellow-500/10 text-yellow-700 text-xs font-medium uppercase tracking-wider">
                    Self-claim · Unverified
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {claim.self_claim
                  ? "Self-attested. Earn the Verified stamp by inviting this claim's client to attest with live data."
                  : STATUS_META[status]?.hint}
              </p>
            </div>
            {badge && (
              <Link href={`/verified/${badge.slug}`}>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> Public page
                </Button>
              </Link>
            )}
          </div>

          <section className="rounded-xl border border-border bg-card p-6 mb-6">
            <div className="flex items-center gap-4">
              <div className={`text-5xl font-bold tabular-nums ${
                (claim.plausibility_score ?? 0) >= 75 ? "text-emerald-500" :
                (claim.plausibility_score ?? 0) >= 50 ? "text-cyan-500" :
                (claim.plausibility_score ?? 0) >= 25 ? "text-orange-500" : "text-rose-500"
              }`}>{claim.plausibility_score ?? "—"}%</div>
              <div>
                <div className="text-sm font-semibold">Plausibility score</div>
                <div className="text-xs text-muted-foreground">Scored by <span className="font-mono">{claim.plausibility_tier || "—"}</span></div>
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

          <ResearchPanel
            claimId={claim.id}
            initial={claim.research || null}
            initialCitations={citations || []}
            ranAt={claim.research_ran_at || null}
            canDeep={canDeep}
          />

          {claim.self_claim && badge && (
            <section className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-6 mt-6">
              <h2 className="text-sm font-semibold mb-2 uppercase tracking-wider text-yellow-700">Unverified badge snippet</h2>
              <p className="text-xs text-muted-foreground mb-4">
                This self-claim has an &ldquo;Unverified&rdquo; embeddable badge. To upgrade to the green Verified stamp,
                invite this claim&rsquo;s client to attest using live data.
              </p>
              <div className="space-y-3">
                <CopyEmbed snippet={`<script src="https://verifiedsxo.com/v/${badge.slug}" async></script>`} label="Inline pill (default)" />
                <CopyEmbed snippet={`<script src="https://verifiedsxo.com/v/${badge.slug}" data-variant="stamp" async></script>`} label="Circular stamp" />
                <CopyEmbed snippet={`<script src="https://verifiedsxo.com/v/${badge.slug}" data-variant="banner" async></script>`} label="Banner" />
              </div>
            </section>
          )}

          {!claim.self_claim && <EvidenceUploader claimId={claim.id} editable={true} />}

          {!claim.self_claim && (status === "verified" || status === "pending_review" || status === "elevated") && (
            <section className="rounded-xl border border-border bg-card p-6 mt-6">
              <h2 className="text-sm font-semibold mb-2 uppercase tracking-wider text-muted-foreground">
                {status === "elevated" ? "Re-run AI elevation" : "Elevate to 100%"}
              </h2>
              <p className="text-xs text-muted-foreground mb-4">
                AI reviews the uploaded evidence against the live-data verification.
              </p>
              <ElevateButton claimId={claim.id} />
            </section>
          )}
        </div>
      </main>
    </>
  )
}
