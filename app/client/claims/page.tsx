import { redirect } from "next/navigation"
import Link from "next/link"
import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { ClaimStatusBadge } from "@/components/claim-status-badge"
import { Button } from "@/components/ui/button"
import { Sparkles, ArrowRight } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function ClientClaimsPage() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login?next=/client/claims")

  const admin = getSupabaseAdmin()
  const { data: clientRow } = await admin
    .from("vsxo_agency_clients")
    .select("id, name")
    .eq("user_id", user.id)
    .maybeSingle()
  if (!clientRow) redirect("/dashboard")

  const { data: claims } = await admin
    .from("vsxo_claims")
    .select("id, claim_text, claim_type, plausibility_score, plausibility_tier, status, created_at, updated_at, verified_at, rejected_at, elevated_at, needs_docs_at")
    .eq("client_id", clientRow.id)
    .order("created_at", { ascending: false })

  return (
    <>
      <Header />
      <main className="pt-28 pb-24 px-4 sm:px-6 lg:px-8 min-h-screen">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-start justify-between flex-wrap gap-3 mb-6">
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Your claims</div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Claim log</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Every claim you&apos;ve submitted — with live verification status.
              </p>
            </div>
            <Button asChild className="bg-foreground text-background hover:bg-foreground/90 gap-2">
              <Link href="/client/verify">
                <Sparkles className="w-4 h-4" /> New claim
              </Link>
            </Button>
          </div>

          {claims && claims.length > 0 ? (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <table className="w-full">
                <thead className="bg-foreground/2 border-b border-border">
                  <tr className="text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="text-left font-medium px-4 py-3">Claim</th>
                    <th className="text-left font-medium px-4 py-3 hidden md:table-cell">Type</th>
                    <th className="text-left font-medium px-4 py-3 hidden sm:table-cell">Score</th>
                    <th className="text-left font-medium px-4 py-3">Status</th>
                    <th className="text-left font-medium px-4 py-3 hidden md:table-cell">Submitted</th>
                    <th className="text-right font-medium px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {claims.map((c) => (
                    <tr key={c.id} className="hover:bg-foreground/2 transition-colors">
                      <td className="px-4 py-3 max-w-md">
                        <div className="text-sm truncate" title={c.claim_text}>&ldquo;{c.claim_text}&rdquo;</div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-xs font-mono text-muted-foreground">{c.claim_type}</td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className={`text-sm font-bold tabular-nums ${
                          (c.plausibility_score ?? 0) >= 75 ? "text-emerald-500" :
                          (c.plausibility_score ?? 0) >= 50 ? "text-cyan-500" :
                          (c.plausibility_score ?? 0) >= 25 ? "text-orange-500" : "text-rose-500"
                        }`}>{c.plausibility_score ?? "—"}%</span>
                      </td>
                      <td className="px-4 py-3"><ClaimStatusBadge status={c.status} /></td>
                      <td className="px-4 py-3 hidden md:table-cell text-xs text-muted-foreground">
                        {new Date(c.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/client/claims/${c.id}`} className="text-xs inline-flex items-center gap-1 text-foreground hover:underline">
                          Open <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card p-12 text-center">
              <Sparkles className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <div className="text-sm font-medium mb-1">No claims yet</div>
              <p className="text-xs text-muted-foreground mb-5">Submit your first claim and we&apos;ll score + verify it.</p>
              <Button asChild size="sm" className="bg-foreground text-background hover:bg-foreground/90">
                <Link href="/client/verify">Start a claim</Link>
              </Button>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
