/**
 * /claim/[id] — public claim-detail page for every claim on the Wall.
 *
 * Works for:
 *   - scored     (no evidence yet, no badge)
 *   - self-claim (unverified badge)
 *   - verified   (redirects to the richer /verified/[slug] page when a
 *                 public badge exists, since that page carries the full
 *                 methodology + certificate link)
 */

import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { getSupabaseAdmin } from "@/lib/supabase/server"
import { ClaimStatusBadge } from "@/components/claim-status-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ShareButtons } from "@/components/share-buttons"
import { ShieldCheck, ShieldAlert, ArrowLeft, Sparkles, ExternalLink } from "lucide-react"

export const dynamic = "force-dynamic"

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const admin = getSupabaseAdmin()
  const { data: claim } = await admin
    .from("vsxo_claims")
    .select("claim_text, self_claim, status")
    .eq("id", id)
    .maybeSingle()
  const snippet = claim?.claim_text ? (claim.claim_text.length > 120 ? claim.claim_text.slice(0, 117) + "…" : claim.claim_text) : "Claim on VerifiedSXO"
  const isSelf = !!claim?.self_claim
  const title = isSelf ? `Unverified · self-attested — "${snippet}"` : `"${snippet}"`
  const description = isSelf
    ? "Self-attested marketing claim. Plausibility-scored by AI. Not yet backed by live-data verification."
    : "Marketing claim scored and tracked on VerifiedSXO — open the page for the full record."
  return {
    title,
    description,
    alternates: { canonical: `https://verifiedsxo.com/claim/${id}` },
    openGraph: { title, description, url: `https://verifiedsxo.com/claim/${id}`, siteName: "VerifiedSXO", type: "article" },
    twitter: { card: "summary_large_image" as const, title, description },
  }
}

export default async function ClaimPage({ params }: Props) {
  const { id } = await params
  const admin = getSupabaseAdmin()

  const { data: claim } = await admin
    .from("vsxo_claims")
    .select(`
      id, claim_text, claim_type, plausibility_score, plausibility_tier, plausibility_reasoning,
      status, self_claim, created_at, verified_at, elevated_at,
      research, research_verdict, research_confidence, research_tier,
      agency:vsxo_agencies(id, name, slug, domain_verified, membership_status, public_profile_enabled)
    `)
    .eq("id", id)
    .maybeSingle()

  if (!claim) notFound()

  // If a published badge exists, hand off to the richer /verified/<slug> page
  const { data: badge } = await admin
    .from("vsxo_badges")
    .select("slug, public_visible")
    .eq("claim_id", id)
    .eq("public_visible", true)
    .maybeSingle()
  if (badge && !claim.self_claim) redirect(`/verified/${badge.slug}`)

  // @ts-expect-error join
  const agency = claim.agency as { id: string; name: string; slug: string; domain_verified: boolean; membership_status: string; public_profile_enabled: boolean } | null
  const score = claim.plausibility_score ?? 0
  const scoreCls =
    score >= 75 ? "text-emerald-500" :
    score >= 50 ? "text-cyan-500" :
    score >= 25 ? "text-orange-500" : "text-rose-500"
  const reasoning = Array.isArray(claim.plausibility_reasoning) ? claim.plausibility_reasoning as string[] : []
  const { data: citations } = await admin
    .from("vsxo_claim_citations")
    .select("url, title, snippet, source, relevance, stance")
    .eq("claim_id", id)
    .order("relevance", { ascending: false })
    .limit(8)

  const shareUrl = `https://verifiedsxo.com/claim/${id}`
  const shareText = claim.self_claim
    ? `Unverified self-claim on VerifiedSXO — ${claim.claim_text.slice(0, 160)}`
    : `Scored on VerifiedSXO (${score}%) — ${claim.claim_text.slice(0, 160)}`

  return (
    <>
      <Header />
      <main className="pt-24 pb-24 px-4 sm:px-6 lg:px-8 min-h-screen">
        <div className="max-w-3xl mx-auto">
          <Link href="/wall" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-5">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to the Wall
          </Link>

          <div className="flex items-center gap-2 flex-wrap mb-3">
            <ClaimStatusBadge status={claim.status} size="sm" />
            {claim.self_claim && (
              <Badge variant="warning" className="gap-1"><ShieldAlert /> Self-claim · Unverified</Badge>
            )}
            <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">{claim.claim_type}</span>
            <span className="text-xs text-muted-foreground">·</span>
            <time className="text-xs text-muted-foreground" dateTime={claim.created_at}>
              {new Date(claim.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </time>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-balance mb-6">
            &ldquo;{claim.claim_text}&rdquo;
          </h1>

          <section className="rounded-xl border bg-card p-6 mb-6">
            <div className="flex items-center gap-4">
              <div className={`text-5xl font-bold tabular-nums ${scoreCls}`}>{claim.plausibility_score ?? "—"}%</div>
              <div>
                <div className="text-sm font-semibold">Plausibility</div>
                <div className="text-xs text-muted-foreground">Scored by <span className="font-mono">{claim.plausibility_tier || "—"}</span></div>
              </div>
            </div>
            {reasoning.length > 0 && (
              <ul className="space-y-2 text-sm mt-5">
                {reasoning.map((r, i) => (
                  <li key={i} className="flex gap-2.5 text-muted-foreground">
                    <span className="text-foreground/60 font-mono text-xs pt-0.5">0{i + 1}</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Agency attribution */}
          {agency && (
            <section className="rounded-xl border bg-card p-5 mb-6 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Submitted by</div>
                {agency.membership_status === "active" && agency.public_profile_enabled ? (
                  <Link href={`/u/${agency.slug}`} className="text-sm font-semibold hover:underline underline-offset-2">
                    {agency.name}
                  </Link>
                ) : (
                  <span className="text-sm font-semibold">{agency.name}</span>
                )}
                {agency.domain_verified ? (
                  <Badge variant="success" className="gap-1"><ShieldCheck /> Verified agency</Badge>
                ) : (
                  <Badge variant="outline" className="gap-1 text-muted-foreground"><ShieldAlert /> Unverified</Badge>
                )}
              </div>
              {agency.membership_status === "active" && agency.public_profile_enabled && (
                <Button asChild variant="outline" size="sm">
                  <Link href={`/u/${agency.slug}`}>
                    Profile <ExternalLink className="w-3 h-3" />
                  </Link>
                </Button>
              )}
            </section>
          )}

          {/* Research snippet if available */}
          {claim.research && (
            <section className="rounded-xl border bg-card p-6 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-violet-500" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">AI research</h2>
                <Badge variant="outline" className="font-mono">{claim.research_tier}</Badge>
              </div>
              <p className="text-sm mb-3">{(claim.research as { summary?: string })?.summary || "Research ran; see details."}</p>
              {citations && citations.length > 0 && (
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Top citations</div>
                  <ul className="space-y-1.5">
                    {citations.slice(0, 5).map((c, i) => (
                      <li key={i} className="text-xs">
                        <a href={c.url} target="_blank" rel="noopener" className="hover:underline line-clamp-1">
                          [{i + 1}] {c.title || c.url}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}

          {/* Share bar */}
          <div className="rounded-xl border bg-card p-5 mb-6">
            <ShareButtons url={shareUrl} text={shareText} compact />
          </div>

          {/* Footer nudge */}
          <div className="text-center text-xs text-muted-foreground mt-8">
            Powered by <Link href="/" className="text-foreground hover:underline underline-offset-2">VerifiedSXO</Link>
            {" · "}Every claim on the record.
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
