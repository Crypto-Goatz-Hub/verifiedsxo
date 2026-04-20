import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabase/server"
import { checkAgencyDailyClaimLimit } from "@/lib/agency-claim-limit"
import { AppShell } from "@/components/app-shell"
import { agencyNav } from "@/lib/nav"
import { Badge } from "@/components/ui/badge"
import { InvitePanel } from "./invite-panel"
import { QuickClaim } from "./quick-claim"
import { ShieldCheck, Users, Sparkles, PlusCircle } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login?next=/dashboard")

  const admin = getSupabaseAdmin()

  // Owned agency first
  const { data: ownedAgency } = await admin
    .from("vsxo_agencies")
    .select("id, name, slug, plan, created_at, membership_status, public_profile_enabled")
    .eq("owner_user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle()

  let agency = ownedAgency
  if (!agency) {
    const { data: memberAgency } = await admin
      .from("vsxo_agency_members")
      .select("vsxo_agencies(id, name, slug, plan, created_at, membership_status, public_profile_enabled)")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle()
    // @ts-expect-error join shape
    agency = memberAgency?.vsxo_agencies || null
  }

  // If not an agency owner/member, check whether they're a client
  if (!agency) {
    const { data: clientRow } = await admin
      .from("vsxo_agency_clients")
      .select("id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle()
    if (clientRow) redirect("/client")
    redirect("/signup")
  }

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
  const limit = await checkAgencyDailyClaimLimit(agency.id)

  return (
    <AppShell
      subtitle="Agency dashboard"
      title={agency.name}
      groups={agencyNav("/dashboard", { clients: clientCount, claims: totalClaims || 0 })}
      topRight={
        <div className="flex items-center gap-2">
          <Link href="/dashboard/claims"><Button variant="outline" size="sm">All claims</Button></Link>
          <Link href="/account"><Button variant="outline" size="sm">Billing</Button></Link>
          <form action="/api/auth/signout" method="POST">
            <Button type="submit" variant="outline" size="sm">Sign out</Button>
          </form>
        </div>
      }
    >
      <p className="text-sm text-muted-foreground -mt-4 mb-6">
        Plan: <span className="font-mono">{agency.plan}</span> · Signed in as {user.email}
      </p>

      {/* Public profile card */}
      <div className="mb-6">
        {agency.public_profile_enabled && agency.membership_status === "active" ? (
          <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-5 flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="text-xs uppercase tracking-wider text-emerald-600 mb-1">Public profile — Active</div>
              <div className="text-sm">
                Live at{" "}
                <Link href={`/u/${agency.slug}`} className="font-mono underline underline-offset-2">
                  verifiedsxo.com/u/{agency.slug}
                </Link>
              </div>
            </div>
            <Link href={`/u/${agency.slug}`}>
              <Button variant="outline" size="sm">View profile</Button>
            </Link>
          </div>
        ) : (
          <div className="rounded-xl border border-violet-500/30 bg-gradient-to-r from-violet-500/5 to-cyan-500/5 p-5 flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="text-xs uppercase tracking-wider text-violet-600 mb-1">Public profile</div>
              <div className="text-sm font-medium">
                Activate your agency profile page for <span className="font-semibold">$8/mo</span>
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Public page · LinkedIn badge · click-to-copy embeds · certificate flow
              </div>
            </div>
            <Link href="/api/stripe/checkout?plan=membership">
              <Button size="sm" className="bg-gradient-to-r from-violet-500 to-cyan-500 text-white hover:opacity-90">
                Activate
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Users} label="Clients" value={clientCount} />
        <StatCard icon={Sparkles} label="Active clients" value={activeCount} />
        <StatCard icon={Sparkles} label="Claims scored" value={totalClaims || 0} />
        <StatCard icon={ShieldCheck} label="Claims verified" value={verifiedCount || 0} />
      </div>

      {/* Agency-side quick claim */}
      <QuickClaim
        clients={(clients || []).filter((c) => c.status === "active" || c.status === "invited").map((c) => ({
          id: c.id, name: c.name, email: c.email, company: c.company,
        }))}
        unlimited={limit.unlimited}
        used={limit.used}
        dailyLimit={limit.limit}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        {/* Clients list */}
        <section id="clients" className="rounded-xl border border-border bg-card overflow-hidden">
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
              What&apos;s next
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
    </AppShell>
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
  const map: Record<string, { label: string; variant: "warning" | "success" | "secondary" | "destructive" }> = {
    invited:   { label: "Invited",  variant: "warning" },
    active:    { label: "Active",   variant: "success" },
    churned:   { label: "Churned",  variant: "secondary" },
    suspended: { label: "Paused",   variant: "destructive" },
  }
  const s = map[status] || map.invited
  return <Badge variant={s.variant}>{s.label}</Badge>
}
