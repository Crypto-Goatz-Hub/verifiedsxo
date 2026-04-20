import { redirect } from "next/navigation"
import Link from "next/link"
import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabase/server"
import { AppShell } from "@/components/app-shell"
import { clientNav } from "@/lib/nav"
import { Button } from "@/components/ui/button"
import { ShieldCheck, LinkIcon } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function ClientSettingsPage() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login?next=/client/settings")

  const admin = getSupabaseAdmin()
  const { data: clientRow } = await admin
    .from("vsxo_agency_clients")
    .select("id, name, email, agency_id, vsxo_agencies(name)")
    .eq("user_id", user.id)
    .maybeSingle()
  if (!clientRow) redirect("/dashboard")
  // @ts-expect-error join
  const agencyName: string = clientRow.vsxo_agencies?.name || "your agency"

  const { data: connections } = await admin
    .from("vsxo_data_connections")
    .select("provider, status, account_label, connected_at")
    .eq("client_id", clientRow.id)

  const connected = new Map((connections || []).map((c) => [c.provider, c]))

  return (
    <AppShell
      subtitle="Client account"
      title="Settings"
      groups={clientNav("/client/settings")}
      topRight={
        <form action="/api/auth/signout" method="POST">
          <Button type="submit" variant="outline" size="sm">Sign out</Button>
        </form>
      }
    >
      <p className="text-sm text-muted-foreground -mt-4 mb-6">
        Your client account is free forever. {agencyName} verifies claims on your behalf.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-4">
          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-semibold mb-4">Profile</h2>
            <dl className="space-y-3 text-sm">
              <Row label="Name" value={clientRow.name} />
              <Row label="Email" value={clientRow.email} />
              <Row label="Agency" value={agencyName} />
            </dl>
            <p className="text-xs text-muted-foreground mt-4">
              To change any of these, ask your agency to update them or <Link href="/contact" className="underline">contact support</Link>.
            </p>
          </section>

          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-semibold mb-4">Data connections</h2>
            <ul className="space-y-3">
              <ConnectionRow
                name="Google Search Console"
                description="Required for ranking + traffic verification"
                connected={connected.has("gsc")}
                account={connected.get("gsc")?.account_label}
                connectHref="/api/oauth/gsc/start"
              />
              <ConnectionRow
                name="LinkedIn"
                description="Cross-link verified claims to your profile"
                connected={connected.has("linkedin")}
                account={connected.get("linkedin")?.account_label}
                connectHref="/api/oauth/linkedin/start"
              />
            </ul>
          </section>

          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-semibold mb-2">Password + security</h2>
            <p className="text-xs text-muted-foreground mb-3">
              Forgot your password? Use the reset flow — it&rsquo;ll email you a link.
            </p>
            <Link href="/forgot-password">
              <Button variant="outline" size="sm">Reset password</Button>
            </Link>
          </section>
        </div>

        <aside className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Plan</div>
            <div className="text-sm font-mono">Free</div>
            <p className="text-xs text-muted-foreground mt-1">Clients stay free forever.</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 text-xs text-muted-foreground">
            <div className="font-medium text-foreground mb-1">Want your own agency?</div>
            <p className="mb-3">Sign up as an agency to invite your own clients and verify their claims.</p>
            <Link href="/signup" className="underline underline-offset-2 text-foreground">Create an agency</Link>
          </div>
        </aside>
      </div>
    </AppShell>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 border-b border-border last:border-0">
      <dt className="text-xs text-muted-foreground uppercase tracking-wider">{label}</dt>
      <dd className="font-mono">{value}</dd>
    </div>
  )
}

function ConnectionRow({ name, description, connected, account, connectHref }: {
  name: string; description: string; connected: boolean; account?: string; connectHref: string
}) {
  return (
    <li className={`flex items-center justify-between gap-4 p-4 rounded-lg border ${connected ? "border-emerald-500/40 bg-emerald-500/5" : "border-border bg-background"}`}>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {connected ? <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" /> : <LinkIcon className="w-5 h-5 text-muted-foreground shrink-0" />}
        <div className="min-w-0">
          <div className="text-sm font-medium truncate">{name}</div>
          <div className="text-xs text-muted-foreground truncate">{connected ? (account || "Connected") : description}</div>
        </div>
      </div>
      {!connected && (
        <a href={connectHref} className="text-xs font-medium text-foreground underline underline-offset-2 shrink-0">
          Connect
        </a>
      )}
    </li>
  )
}
