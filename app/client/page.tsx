import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { ShieldCheck, LinkIcon, Sparkles } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function ClientDashboardPage() {
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

  const { data: claims } = await admin
    .from("vsxo_claims")
    .select("id, claim_text, claim_type, plausibility_score, plausibility_tier, status, created_at")
    .eq("client_id", clientRow.id)
    .order("created_at", { ascending: false })
    .limit(10)

  return (
    <>
      <Header />
      <main className="pt-28 pb-24 px-4 sm:px-6 lg:px-8 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
            <div>
              <div className="text-sm text-muted-foreground uppercase tracking-wider mb-2">
                Verified client — invited by {agencyName}
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Hey {clientRow.name}</h1>
              <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
            </div>
            <form action="/api/auth/signout" method="POST">
              <Button type="submit" variant="outline" size="sm">Sign out</Button>
            </form>
          </div>

          <section className="rounded-xl border border-border bg-card p-6 md:p-8 mb-8">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-semibold text-lg">Next step: verify your first claim</h2>
                <p className="text-sm text-muted-foreground">
                  Paste a stat claim you&apos;ve made publicly. We score it in 60 seconds, then let
                  you connect your data to prove it.
                </p>
              </div>
            </div>
            <Link href="/#verify">
              <Button size="lg" className="gap-2 bg-foreground text-background hover:bg-foreground/90">
                Score a claim <ShieldCheck className="w-4 h-4" />
              </Button>
            </Link>
          </section>

          <section className="rounded-xl border border-border bg-card p-6 md:p-8 mb-8">
            <h2 className="font-semibold mb-4">Data connections</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Connect the source of your claim to prove it with real numbers.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { name: "Search Console", key: "gsc", status: "Available" },
                { name: "Google Analytics", key: "ga4", status: "Coming soon" },
                { name: "Google Ads", key: "google_ads", status: "Coming soon" },
                { name: "Stripe", key: "stripe", status: "Coming soon" },
              ].map((p) => (
                <div key={p.key} className="p-4 rounded-lg border border-border bg-background text-center">
                  <LinkIcon className="w-4 h-4 mx-auto mb-2 text-muted-foreground" />
                  <div className="text-sm font-medium">{p.name}</div>
                  <div className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">{p.status}</div>
                </div>
              ))}
            </div>
          </section>

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
                        {c.claim_type} · {c.plausibility_tier}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(c.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <p className="text-sm mb-3">&ldquo;{c.claim_text}&rdquo;</p>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold">{c.plausibility_score ?? "—"}%</span>
                      <span className="text-xs px-2 py-0.5 rounded-full border border-border text-muted-foreground">{c.status}</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-10 text-center text-sm text-muted-foreground">
                No claims yet.
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  )
}
