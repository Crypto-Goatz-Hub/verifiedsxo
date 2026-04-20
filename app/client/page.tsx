import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabase/server"
import { AppShell } from "@/components/app-shell"
import { clientNav } from "@/lib/nav"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { ShieldCheck, LinkIcon, Sparkles, CheckCircle2, AlertTriangle } from "lucide-react"

export const dynamic = "force-dynamic"

interface Props { searchParams: Promise<{ gsc?: string; li?: string; reason?: string }> }

export default async function ClientDashboardPage({ searchParams }: Props) {
  const sp = await searchParams
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login?next=/client")

  const admin = getSupabaseAdmin()
  const { data: clientRow } = await admin
    .from("vsxo_agency_clients")
    .select("id, name, email, agency_id, status, vsxo_agencies(name)")
    .eq("user_id", user.id)
    .maybeSingle()

  if (!clientRow) redirect("/dashboard")
  // @ts-expect-error join
  const agencyName: string = clientRow.vsxo_agencies?.name || "Your agency"

  const { data: connections } = await admin
    .from("vsxo_data_connections")
    .select("provider, status, account_label, connected_at")
    .eq("client_id", clientRow.id)

  const connected = new Map((connections || []).map((c) => [c.provider, c]))

  const { data: claims } = await admin
    .from("vsxo_claims")
    .select("id, claim_text, claim_type, plausibility_score, plausibility_tier, status, created_at")
    .eq("client_id", clientRow.id)
    .order("created_at", { ascending: false })
    .limit(10)

  const { data: badges } = await admin
    .from("vsxo_badges")
    .select("slug, last_verified_at, claim_id")
    .eq("client_id", clientRow.id)
    .order("last_verified_at", { ascending: false })
    .limit(5)

  return (
    <AppShell
      subtitle={`Invited by ${agencyName}`}
      title={`Hey ${clientRow.name}`}
      groups={clientNav("/client", { claims: claims?.length || 0 })}
      topRight={
        <div className="flex items-center gap-2">
          <Link href="/client/verify"><Button size="sm" className="bg-foreground text-background hover:bg-foreground/90">Verify a claim</Button></Link>
          <form action="/api/auth/signout" method="POST">
            <Button type="submit" variant="outline" size="sm">Sign out</Button>
          </form>
        </div>
      }
      footerBlurb={
        <>
          Free forever. Your agency can verify claims on your behalf. Connect data sources to prove your own.
        </>
      }
    >
      <p className="text-sm text-muted-foreground -mt-4 mb-6">{user.email}</p>

      {sp.gsc === "connected" && (
        <Banner tone="ok" icon={<CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />}>
          Search Console connected. You can verify ranking + traffic claims now.
        </Banner>
      )}
      {sp.gsc === "required" && (
        <Banner tone="warn" icon={<AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />}>
          Connect Google Search Console first so we have data to verify against.
        </Banner>
      )}
      {sp.gsc === "error" && (
        <Banner tone="err" icon={<AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />}>
          Google OAuth didn&apos;t complete ({sp.reason || "unknown"}). Try again.
        </Banner>
      )}
      {sp.li === "connected" && (
        <Banner tone="ok" icon={<CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />}>
          LinkedIn connected. Your verified claims can now be cross-linked to your profile.
        </Banner>
      )}
      {sp.li === "error" && (
        <Banner tone="err" icon={<AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />}>
          LinkedIn OAuth didn&apos;t complete ({sp.reason || "unknown"}). Try again.
        </Banner>
      )}

      <section className="rounded-xl border border-border bg-card p-6 md:p-8 mb-6">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">Verify your next claim</h2>
              <p className="text-sm text-muted-foreground">
                Pick the claim type, connect the source, and we&apos;ll verify it in seconds.
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg" className="bg-foreground text-background hover:bg-foreground/90">
            <Link href="/client/verify">Verify a claim</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/#verify">Just score one (no proof)</Link>
          </Button>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-6 md:p-8 mb-6">
        <h2 className="font-semibold mb-4">Data connections</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <ConnectionTile
            name="Search Console"
            connected={connected.has("gsc")}
            account={connected.get("gsc")?.account_label}
            connectHref="/api/oauth/gsc/start"
          />
          <ConnectionTile
            name="LinkedIn"
            connected={connected.has("linkedin")}
            account={connected.get("linkedin")?.account_label}
            connectHref="/api/oauth/linkedin/start"
          />
          {[
            { name: "Google Analytics", key: "ga4" },
            { name: "Google Ads", key: "google_ads" },
            { name: "Stripe", key: "stripe" },
          ].map((p) => (
            <div key={p.key} className="p-4 rounded-lg border border-border bg-background text-center">
              <LinkIcon className="w-4 h-4 mx-auto mb-2 text-muted-foreground" />
              <div className="text-sm font-medium">{p.name}</div>
              <div className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">Coming soon</div>
            </div>
          ))}
        </div>
      </section>

      {badges && badges.length > 0 && (
        <section className="rounded-xl border border-border bg-card p-6 md:p-8 mb-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            Your verification badges
          </h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {badges.map((b) => (
              <li key={b.slug} className="p-4 rounded-lg border border-border bg-background flex items-center justify-between">
                <div>
                  <div className="text-xs font-mono text-muted-foreground">{b.slug}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{new Date(b.last_verified_at).toLocaleDateString()}</div>
                </div>
                <Link href={`/verified/${b.slug}`} className="text-sm text-violet-500 hover:text-cyan-500 underline underline-offset-2">
                  View
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-xl border border-border bg-card">
        <div className="p-5 border-b border-border">
          <h2 className="font-semibold">Your claims</h2>
          <p className="text-xs text-muted-foreground">Claims you&apos;ve submitted and their verification status.</p>
        </div>
        {claims && claims.length > 0 ? (
          <ul className="divide-y divide-border">
            {claims.map((c) => (
              <li key={c.id} className="p-5">
                <div className="flex items-center justify-between gap-4 mb-2">
                  <div className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
                    {c.claim_type} · {c.plausibility_tier || "—"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(c.created_at).toLocaleDateString()}
                  </div>
                </div>
                <p className="text-sm mb-3">&ldquo;{c.claim_text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold">{c.plausibility_score ?? "—"}%</span>
                  <Badge variant="outline">{c.status}</Badge>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-10 text-center text-sm text-muted-foreground">
            No claims yet — <Link href="/client/verify" className="underline">verify your first one</Link>.
          </div>
        )}
      </section>
    </AppShell>
  )
}

function Banner({ tone, icon, children }: { tone: "ok" | "warn" | "err"; icon: React.ReactNode; children: React.ReactNode }) {
  const variant = tone === "ok" ? "success" : tone === "warn" ? "warning" : "destructive"
  return (
    <Alert variant={variant} className="mb-6">
      {icon}
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  )
}

function ConnectionTile({ name, connected, account, connectHref }: { name: string; connected: boolean; account?: string; connectHref: string }) {
  return (
    <div className={`p-4 rounded-lg border text-center ${connected ? "border-emerald-500/40 bg-emerald-500/5" : "border-border bg-background"}`}>
      <div className="flex items-center justify-center mb-2">
        {connected ? <ShieldCheck className="w-4 h-4 text-emerald-500" /> : <LinkIcon className="w-4 h-4 text-muted-foreground" />}
      </div>
      <div className="text-sm font-medium">{name}</div>
      {connected ? (
        <div className="text-[10px] text-emerald-600 mt-1 font-mono truncate">{account || "connected"}</div>
      ) : (
        <a href={connectHref} className="text-[10px] text-foreground mt-1 font-medium uppercase tracking-wider underline underline-offset-2 inline-block">
          Connect
        </a>
      )}
    </div>
  )
}
