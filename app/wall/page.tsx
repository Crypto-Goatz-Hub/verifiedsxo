/**
 * /wall — public claims feed.
 *
 * Every claim submitted to VerifiedSXO is public the moment it's scored.
 * This is the viral surface: logged-in or not, anyone can open, copy,
 * and link back to any claim — tied forever to the agency that submitted it.
 *
 * Verified agencies (domain email match) get a distinct trust stamp.
 */

import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { getSupabaseAdmin } from "@/lib/supabase/server"
import { ClaimStatusBadge } from "@/components/claim-status-badge"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { WallCopyButton } from "./copy-button"
import { ShieldCheck, Flame, TrendingUp, Sparkles, Filter, ShieldAlert } from "lucide-react"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Claims wall — every marketing claim, public on submit | VerifiedSXO",
  description:
    "The live public feed of every marketing claim submitted through VerifiedSXO. See the score, the status, who submitted it, and copy any claim in one click. Verified agencies carry a domain-matched trust stamp.",
  alternates: { canonical: "https://verifiedsxo.com/wall" },
}

interface Props {
  searchParams: Promise<{ q?: string; type?: string; verified?: string }>
}

const CLAIM_TYPES = [
  "all", "general", "ranking", "traffic", "revenue", "audience", "conversion", "output", "customer",
]

export default async function WallPage({ searchParams }: Props) {
  const sp = await searchParams
  const q = (sp?.q || "").trim()
  const typeFilter = (sp?.type || "all").toLowerCase()
  const verifiedOnly = sp?.verified === "1"

  const admin = getSupabaseAdmin()

  let query = admin
    .from("vsxo_claims")
    .select(`
      id, claim_text, claim_type, plausibility_score, plausibility_tier, status,
      created_at, verified_at, elevated_at, agency_id, self_claim,
      agency:vsxo_agencies(id, name, slug, domain_verified, membership_status)
    `)
    .order("created_at", { ascending: false })
    .limit(80)

  if (q) query = query.ilike("claim_text", `%${q}%`)
  if (typeFilter && typeFilter !== "all") query = query.eq("claim_type", typeFilter)

  const { data: rawClaims } = await query

  type AgencyJoin = { id: string; name: string; slug: string; domain_verified: boolean; membership_status: string } | null
  const claims = (rawClaims || []).filter((c) => {
    const agency = (c as unknown as { agency: AgencyJoin }).agency
    if (verifiedOnly && !agency?.domain_verified) return false
    return true
  })

  // Stats
  const { count: totalClaims } = await admin.from("vsxo_claims").select("id", { count: "exact", head: true })
  const { count: verifiedClaims } = await admin.from("vsxo_claims").select("id", { count: "exact", head: true }).eq("status", "verified")
  const { count: elevatedClaims } = await admin.from("vsxo_claims").select("id", { count: "exact", head: true }).eq("status", "elevated")

  // Leaderboard: top agencies by verified claim count
  const { data: leaderClaims } = await admin
    .from("vsxo_claims")
    .select("agency_id, agency:vsxo_agencies(id, name, slug, domain_verified, public_profile_enabled, membership_status)")
    .in("status", ["verified", "elevated"])
    .limit(500)
  type LeaderAgency = { id: string; name: string; slug: string; domain_verified: boolean; public_profile_enabled: boolean; membership_status: string } | null
  const tally = new Map<string, { name: string; slug: string; count: number; verified: boolean; public: boolean }>()
  for (const row of leaderClaims || []) {
    const a = (row as unknown as { agency: LeaderAgency }).agency
    if (!a) continue
    const cur = tally.get(a.id) || {
      name: a.name,
      slug: a.slug,
      count: 0,
      verified: !!a.domain_verified,
      public: a.membership_status === "active" && !!a.public_profile_enabled,
    }
    cur.count++
    tally.set(a.id, cur)
  }
  const leaderboard = Array.from(tally.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)

  return (
    <>
      <Header />
      <main className="relative pt-24 pb-24 min-h-screen">
        {/* Hero */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-10">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-3">
            <Flame className="w-3.5 h-3.5 text-orange-500" />
            The Claims Wall
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-3">
            Every claim,{" "}
            <span className="bg-gradient-to-r from-violet-500 to-cyan-500 bg-clip-text text-transparent">public the moment it&rsquo;s submitted.</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mb-6">
            Score, status, agency — all on the record. Copy any claim in one click,
            re-share it, or open it to see the evidence behind it.
          </p>

          {/* Mini stat row */}
          <div className="grid grid-cols-3 gap-3 max-w-xl">
            <StatMini icon={<Sparkles className="w-3.5 h-3.5" />} label="Total" value={totalClaims || 0} />
            <StatMini icon={<ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />} label="Verified" value={verifiedClaims || 0} />
            <StatMini icon={<TrendingUp className="w-3.5 h-3.5 text-violet-500" />} label="Elevated" value={elevatedClaims || 0} />
          </div>
        </section>

        {/* Leaderboard strip */}
        {leaderboard.length > 0 && (
          <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
            <div className="rounded-xl border bg-gradient-to-br from-violet-500/5 via-card to-cyan-500/5 p-5">
              <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-violet-500" />
                  <h2 className="font-semibold">Top verified agencies</h2>
                </div>
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground">By verified claim count</span>
              </div>
              <ol className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2">
                {leaderboard.map(([id, a], i) => (
                  <li key={id} className="flex items-center gap-2 p-2.5 rounded-lg border bg-background">
                    <span className="text-xs font-mono text-muted-foreground w-5 text-center">{String(i + 1).padStart(2, "0")}</span>
                    {a.public ? (
                      <Link href={`/u/${a.slug}`} className="text-sm font-medium truncate hover:underline">{a.name}</Link>
                    ) : (
                      <span className="text-sm font-medium truncate">{a.name}</span>
                    )}
                    {a.verified && <ShieldCheck className="w-3 h-3 text-emerald-500 shrink-0" />}
                    <span className="ml-auto text-xs font-bold tabular-nums text-foreground/80">{a.count}</span>
                  </li>
                ))}
              </ol>
            </div>
          </section>
        )}

        {/* Filter bar */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
          <form method="GET" action="/wall" className="rounded-xl border bg-card p-4 flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[240px] flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
              <Input name="q" defaultValue={q} placeholder='Search claims — e.g. "ARR", "rank", "growth"' className="h-9" />
            </div>
            <select
              name="type"
              defaultValue={typeFilter}
              className="h-9 rounded-md border bg-background px-3 text-sm focus:border-ring focus:ring-ring/50 focus:ring-[3px] outline-none"
            >
              {CLAIM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <label className="inline-flex items-center gap-2 text-sm px-2">
              <input
                type="checkbox"
                name="verified"
                value="1"
                defaultChecked={verifiedOnly}
                className="h-4 w-4"
              />
              Verified agencies only
            </label>
            <Button type="submit" size="sm">Filter</Button>
            {(q || typeFilter !== "all" || verifiedOnly) && (
              <Link href="/wall" className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2">
                Clear
              </Link>
            )}
          </form>
        </section>

        {/* Feed */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {claims.length > 0 ? (
            <ul className="space-y-4">
              {claims.map((c) => {
                const agency = (c as unknown as { agency: AgencyJoin }).agency
                const score = c.plausibility_score ?? 0
                const scoreCls =
                  score >= 75 ? "text-emerald-500" :
                  score >= 50 ? "text-cyan-500" :
                  score >= 25 ? "text-orange-500" : "text-rose-500"

                return (
                  <li key={c.id} className="rounded-xl border bg-card p-5 hover:border-foreground/25 transition-colors">
                    <div className="flex items-start gap-4">
                      {/* Score */}
                      <div className="flex flex-col items-center shrink-0 w-[72px]">
                        <div className={`text-4xl font-bold tabular-nums leading-none ${scoreCls}`}>
                          {c.plausibility_score ?? "—"}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider mt-1">score</div>
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Meta row */}
                        <div className="flex items-center flex-wrap gap-2 text-xs text-muted-foreground mb-2">
                          <ClaimStatusBadge status={c.status} size="xs" />
                          {c.self_claim && (
                            <Badge variant="warning" className="gap-1">
                              <ShieldAlert /> Self-claim · Unverified
                            </Badge>
                          )}
                          <span className="font-mono uppercase tracking-wider">{c.claim_type}</span>
                          <span>·</span>
                          <time dateTime={c.created_at}>
                            {new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </time>
                        </div>

                        {/* Claim body */}
                        <p className="text-base leading-relaxed mb-3">&ldquo;{c.claim_text}&rdquo;</p>

                        {/* Agency attribution + actions */}
                        <div className="flex items-center justify-between flex-wrap gap-3 pt-3 border-t">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-muted-foreground">Submitted by</span>
                            {agency?.membership_status === "active" && agency?.slug ? (
                              <Link href={`/u/${agency.slug}`} className="text-sm font-semibold hover:underline underline-offset-2">
                                {agency.name}
                              </Link>
                            ) : (
                              <span className="text-sm font-semibold">{agency?.name || "Agency"}</span>
                            )}
                            {agency?.domain_verified ? (
                              <Badge variant="success" className="gap-1">
                                <ShieldCheck /> Verified agency
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="gap-1 text-muted-foreground">
                                <ShieldAlert /> Unverified
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <WallCopyButton text={c.claim_text} />
                            <Button asChild variant="ghost" size="sm">
                              <Link href={`/verified/${c.id}`}>Open →</Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          ) : (
            <div className="rounded-xl border bg-card p-16 text-center">
              <Sparkles className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <div className="text-sm font-medium mb-1">
                {q || verifiedOnly || typeFilter !== "all" ? "No claims match your filter" : "No claims on the wall yet"}
              </div>
              <p className="text-xs text-muted-foreground">
                {q || verifiedOnly || typeFilter !== "all"
                  ? "Try clearing the filter or widening your search."
                  : "Be the first — score a claim and it lands here instantly."}
              </p>
              <div className="mt-6 flex items-center justify-center gap-2">
                <Button asChild><Link href="/signup">Start verifying</Link></Button>
                <Button asChild variant="outline"><Link href="/how-it-works">How it works</Link></Button>
              </div>
            </div>
          )}
        </section>

        {/* Footer nudge */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-14 text-center">
          <div className="rounded-xl border border-violet-500/30 bg-gradient-to-r from-violet-500/5 to-cyan-500/5 p-8">
            <div className="flex items-center justify-center gap-1 text-xs font-semibold uppercase tracking-[0.2em] text-violet-500 mb-3">
              <ShieldCheck className="w-3.5 h-3.5" /> Verified Agency · domain-matched
            </div>
            <h2 className="text-2xl font-bold mb-2">Want the verified stamp on your claims?</h2>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto mb-5">
              Add your agency&rsquo;s public website and sign in with an email on that domain.
              We auto-match them — no docs, no waiting. Every claim you submit picks up the trust stamp.
            </p>
            <Button asChild>
              <Link href="/dashboard/settings">Verify my agency</Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}

function StatMini({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-card px-3 py-2">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="text-xl font-bold tabular-nums">{value.toLocaleString()}</div>
    </div>
  )
}
