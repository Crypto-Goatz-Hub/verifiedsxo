import { redirect } from "next/navigation"
import Link from "next/link"
import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabase/server"
import { isAdmin } from "@/lib/admin"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { ClaimStatusBadge } from "@/components/claim-status-badge"
import { ShieldCheck, Users, Sparkles, PlusCircle, ExternalLink } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function AdminPage() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login?next=/admin")
  if (!(await isAdmin(user.id, user.email))) redirect("/dashboard")

  const admin = getSupabaseAdmin()

  const [
    { count: agencyCount },
    { count: clientCount },
    { count: claimCount },
    { count: verifiedCount },
    { count: elevatedCount },
    { count: badgeCount },
    { data: recentClaims },
    { data: recentAgencies },
  ] = await Promise.all([
    admin.from("vsxo_agencies").select("id", { count: "exact", head: true }),
    admin.from("vsxo_agency_clients").select("id", { count: "exact", head: true }),
    admin.from("vsxo_claims").select("id", { count: "exact", head: true }),
    admin.from("vsxo_claims").select("id", { count: "exact", head: true }).eq("status", "verified"),
    admin.from("vsxo_claims").select("id", { count: "exact", head: true }).eq("status", "elevated"),
    admin.from("vsxo_badges").select("id", { count: "exact", head: true }),
    admin.from("vsxo_claims")
      .select("id, claim_text, claim_type, plausibility_score, status, created_at, agency:vsxo_agencies(name, slug), client:vsxo_agency_clients(name, email)")
      .order("created_at", { ascending: false })
      .limit(20),
    admin.from("vsxo_agencies")
      .select("id, name, slug, plan, membership_status, public_profile_enabled, created_at")
      .order("created_at", { ascending: false })
      .limit(12),
  ])

  return (
    <>
      <Header />
      <main className="pt-28 pb-24 px-4 sm:px-6 lg:px-8 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-start justify-between flex-wrap gap-3 mb-6">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Platform admin</div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">VerifiedSXO control</h1>
              <p className="text-sm text-muted-foreground mt-1">Everything. Every agency, every client, every claim.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild className="bg-foreground text-background hover:bg-foreground/90 gap-2">
                <Link href="/admin/claims/new"><PlusCircle className="w-4 h-4" /> New claim</Link>
              </Button>
              <Button asChild variant="outline"><Link href="/dashboard">My agency</Link></Button>
              <form action="/api/auth/signout" method="POST">
                <Button type="submit" variant="outline" size="sm">Sign out</Button>
              </form>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-8">
            <Stat label="Agencies" value={agencyCount || 0} icon={Users} />
            <Stat label="Clients" value={clientCount || 0} icon={Users} />
            <Stat label="Claims" value={claimCount || 0} icon={Sparkles} />
            <Stat label="Verified" value={verifiedCount || 0} icon={ShieldCheck} tone="text-emerald-500" />
            <Stat label="Elevated" value={elevatedCount || 0} icon={ShieldCheck} tone="text-violet-500" />
            <Stat label="Badges" value={badgeCount || 0} icon={ShieldCheck} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6">
            {/* Recent claims */}
            <section className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="p-5 border-b border-border flex items-center justify-between">
                <div>
                  <h2 className="font-semibold">Recent claims</h2>
                  <p className="text-xs text-muted-foreground">Last 20 across all agencies.</p>
                </div>
              </div>
              {recentClaims && recentClaims.length > 0 ? (
                <ul className="divide-y divide-border">
                  {recentClaims.map((c) => {
                    // @ts-expect-error join
                    const agency = c.agency
                    // @ts-expect-error join
                    const client = c.client
                    return (
                      <li key={c.id} className="p-4 hover:bg-foreground/2 transition-colors">
                        <Link href={`/admin/claims/${c.id}`} className="block">
                          <div className="flex items-center justify-between flex-wrap gap-2 mb-1.5">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <strong className="text-foreground">{agency?.name || "—"}</strong>
                              <span>·</span>
                              <span>{client?.name || client?.email}</span>
                              <span>·</span>
                              <span className="font-mono">{c.claim_type}</span>
                            </div>
                            <ClaimStatusBadge status={c.status} />
                          </div>
                          <div className="text-sm truncate">&ldquo;{c.claim_text}&rdquo;</div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground mt-1.5">
                            <span className="tabular-nums">{c.plausibility_score ?? "—"}% plausibility</span>
                            <span>{new Date(c.created_at).toLocaleString()}</span>
                          </div>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <div className="p-12 text-center text-sm text-muted-foreground">No claims yet.</div>
              )}
            </section>

            {/* Recent agencies */}
            <section className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="p-5 border-b border-border">
                <h2 className="font-semibold">Agencies</h2>
                <p className="text-xs text-muted-foreground">Latest signups.</p>
              </div>
              {recentAgencies && recentAgencies.length > 0 ? (
                <ul className="divide-y divide-border">
                  {recentAgencies.map((a) => (
                    <li key={a.id} className="p-4 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">{a.name}</div>
                        <div className="text-xs text-muted-foreground">
                          <span className="font-mono">{a.slug}</span> · <span className="capitalize">{a.plan}</span>
                          {a.public_profile_enabled && a.membership_status === "active" && (
                            <span className="ml-1 text-violet-500">· member</span>
                          )}
                        </div>
                      </div>
                      {a.public_profile_enabled && (
                        <Link href={`/u/${a.slug}`} className="text-xs text-foreground/70 hover:text-foreground flex items-center gap-1">
                          <ExternalLink className="w-3 h-3" /> profile
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-12 text-center text-sm text-muted-foreground">No agencies yet.</div>
              )}
            </section>
          </div>
        </div>
      </main>
    </>
  )
}

function Stat({ label, value, icon: Icon, tone = "text-foreground" }: { label: string; value: number; icon: React.ComponentType<{ className?: string }>; tone?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
        <Icon className={`w-3.5 h-3.5 ${tone}`} />
      </div>
      <div className={`text-2xl font-bold tabular-nums ${tone}`}>{value}</div>
    </div>
  )
}
