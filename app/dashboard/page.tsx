import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { InvitePanel } from "./invite-panel"
import { ShieldCheck, Users, Sparkles, PlusCircle } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login?next=/dashboard")

  const admin = getSupabaseAdmin()

  // Find the user's primary agency (first they own or are a member of)
  const { data: ownedAgency } = await admin
    .from("vsxo_agencies")
    .select("id, name, slug, plan, created_at")
    .eq("owner_user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle()

  let agency = ownedAgency
  if (!agency) {
    const { data: memberAgency } = await admin
      .from("vsxo_agency_members")
      .select("vsxo_agencies(id, name, slug, plan, created_at)")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle()
    // @ts-expect-error join shape
    agency = memberAgency?.vsxo_agencies || null
  }

  if (!agency) redirect("/signup")

  // Pull clients + claim counts
  const { data: clients } = await admin
    .from("vsxo_agency_clients")
    .select("id, name, email, company, status, created_at, invite_accepted_at")
    .eq("agency_id", agency.id)
    .order("created_at", { ascending: false })

  const { count: totalClaims } = await admin
    .from("vsxo_claims")
    .select("id", { count: "exact", head: true })
    .eq("agency_id", agency.id)

  const { count: verifiedCount } = await admin
    .from("vsxo_claims")
    .select("id", { count: "exact", head: true })
    .eq("agency_id", agency.id)
    .eq("status", "verified")

  const clientCount = clients?.length || 0
  const activeCount = clients?.filter((c) => c.status === "active").length || 0

  return (
    <>
      <Header />
      <main className="pt-28 pb-24 px-4 sm:px-6 lg:px-8 min-h-screen">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
            <div>
              <div className="text-sm text-muted-foreground uppercase tracking-wider mb-2">
                Agency dashboard
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{agency.name}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Plan: <span className="font-mono">{agency.plan}</span> · Signed in as {user.email}
              </p>
            </div>
            <form action="/api/auth/signout" method="POST">
              <Button type="submit" variant="outline" size="sm">Sign out</Button>
            </form>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
            <StatCard icon={Users} label="Clients" value={clientCount} />
            <StatCard icon={Sparkles} label="Active clients" value={activeCount} />
            <StatCard icon={Sparkles} label="Claims scored" value={totalClaims || 0} />
            <StatCard icon={ShieldCheck} label="Claims verified" value={verifiedCount || 0} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
            {/* Clients list */}
            <section className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-border">
                <div>
                  <h2 className="font-semibold">Your clients</h2>
                  <p className="text-xs text-muted-foreground">Invite marketers to verify their stats.</p>
                </div>
              </div>
              {clients && clients.length > 0 ? (
                <ul className="divide-y divide-border">
                  {clients.map((c) => (
                    <li key={c.id} className="flex items-center justify-between p-5 hover:bg-foreground/2 transition-colors">
                      <div>
                        <div className="font-medium">{c.name}</div>
                        <div className="text-xs text-muted-foreground">{c.email}{c.company ? ` · ${c.company}` : ""}</div>
                      </div>
                      <StatusChip status={c.status} />
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-10 text-center">
                  <PlusCircle className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                  <div className="text-sm font-medium mb-1">No clients yet</div>
                  <div className="text-xs text-muted-foreground max-w-xs mx-auto">
                    Invite your first client to start verifying their marketing claims.
                  </div>
                </div>
              )}
            </section>

            {/* Invite panel */}
            <div>
              <InvitePanel agencyId={agency.id} agencyName={agency.name} />
              <div className="mt-6 rounded-xl border border-border bg-card p-5">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  What's next
                </div>
                <ol className="space-y-2 text-sm text-muted-foreground">
                  <li>1. Invite a client</li>
                  <li>2. They paste a claim + connect their analytics</li>
                  <li>3. We verify and issue a badge</li>
                  <li>4. Review flow fires automatically (coming soon)</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}

function StatCard({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="text-2xl font-bold tabular-nums">{value}</div>
    </div>
  )
}

function StatusChip({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    invited:  { label: "Invited",  cls: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30" },
    active:   { label: "Active",   cls: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" },
    churned:  { label: "Churned",  cls: "bg-gray-500/10 text-gray-500 border-gray-500/30" },
    suspended:{ label: "Paused",   cls: "bg-rose-500/10 text-rose-600 border-rose-500/30" },
  }
  const s = map[status] || map.invited
  return <span className={`text-xs px-2.5 py-1 rounded-full border ${s.cls}`}>{s.label}</span>
}
