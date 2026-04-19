import { redirect } from "next/navigation"
import Link from "next/link"
import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { ClaimStatusBadge } from "@/components/claim-status-badge"
import { ArrowRight, Users } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function AgencyClaimsPage() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login?next=/dashboard/claims")

  const admin = getSupabaseAdmin()
  const { data: agency } = await admin
    .from("vsxo_agencies")
    .select("id, name")
    .eq("owner_user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle()
  if (!agency) redirect("/signup")

  const { data: claims } = await admin
    .from("vsxo_claims")
    .select(`
      id, claim_text, claim_type, plausibility_score, status, created_at,
      client:vsxo_agency_clients(id, name, email, company)
    `)
    .eq("agency_id", agency.id)
    .order("created_at", { ascending: false })

  return (
    <>
      <Header />
      <main className="pt-28 pb-24 px-4 sm:px-6 lg:px-8 min-h-screen">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <Link href="/dashboard" className="text-xs text-muted-foreground hover:text-foreground">← Dashboard</Link>
            <div className="flex items-start justify-between flex-wrap gap-3 mt-2">
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{agency.name}</div>
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">All claims</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Every claim submitted under your agency — {claims?.length || 0} total.
                </p>
              </div>
            </div>
          </div>

          {claims && claims.length > 0 ? (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <table className="w-full">
                <thead className="bg-foreground/2 border-b border-border">
                  <tr className="text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="text-left font-medium px-4 py-3">Client</th>
                    <th className="text-left font-medium px-4 py-3 hidden lg:table-cell">Claim</th>
                    <th className="text-left font-medium px-4 py-3 hidden sm:table-cell">Type</th>
                    <th className="text-left font-medium px-4 py-3">Score</th>
                    <th className="text-left font-medium px-4 py-3">Status</th>
                    <th className="text-left font-medium px-4 py-3 hidden md:table-cell">Date</th>
                    <th className="text-right font-medium px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {claims.map((c) => {
                    // @ts-expect-error join shape
                    const client = c.client
                    return (
                      <tr key={c.id} className="hover:bg-foreground/2 transition-colors">
                        <td className="px-4 py-3 min-w-[140px]">
                          <div className="text-sm font-medium truncate">{client?.name || "—"}</div>
                          <div className="text-[10px] text-muted-foreground truncate">{client?.company || client?.email}</div>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell max-w-md">
                          <div className="text-sm truncate" title={c.claim_text}>&ldquo;{c.claim_text}&rdquo;</div>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell text-xs font-mono text-muted-foreground">{c.claim_type}</td>
                        <td className="px-4 py-3">
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
                          <Link href={`/dashboard/claims/${c.id}`} className="text-xs inline-flex items-center gap-1 text-foreground hover:underline">
                            Open <ArrowRight className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card p-12 text-center">
              <Users className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <div className="text-sm font-medium mb-1">No claims yet from any client</div>
              <p className="text-xs text-muted-foreground">Invite clients from your dashboard to start collecting verified claims.</p>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
