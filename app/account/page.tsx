import { redirect } from "next/navigation"
import Link from "next/link"
import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { DetectorShapes } from "@/components/detector-shapes"
import { Button } from "@/components/ui/button"
import { CreditCard, ShieldCheck, ExternalLink, Sparkles } from "lucide-react"

export const dynamic = "force-dynamic"

function fmtMoney(cents: number | null | undefined, currency = "usd"): string {
  if (cents == null) return "—"
  return new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(cents / 100)
}

export default async function AccountPage() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login?next=/account")

  const admin = getSupabaseAdmin()
  const { data: agency } = await admin
    .from("vsxo_agencies")
    .select("id, name, slug, plan, membership_status, membership_stripe_sub_id, membership_current_period_end, public_profile_enabled")
    .eq("owner_user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle()

  if (!agency) redirect("/signup")

  // Pull live subscription + invoice data via the Stripe FDW
  type SubRow = { id: string; status: string; current_period_start: string | null; current_period_end: string | null; cancel_at_period_end: boolean; price_id: string | null; plan_label: string | null; unit_amount: number | null; billing_interval: string | null; currency: string | null }
  type InvRow = { id: string; status: string | null; total: number | null; currency: string | null; period_start: string | null; period_end: string | null; invoice_pdf: string | null; number: string | null }

  let subs: SubRow[] = []
  let invoices: InvRow[] = []
  try {
    const { data: subData } = await admin.rpc("vsxo_lookup_stripe_for_agency", { _agency_id: agency.id })
    subs = (subData as SubRow[]) || []
  } catch {}
  try {
    const { data: invData } = await admin.rpc("vsxo_recent_stripe_invoices_for_agency", { _agency_id: agency.id, _limit: 10 })
    invoices = (invData as InvRow[]) || []
  } catch {}

  const activeSub = subs.find((s) => s.status === "active" || s.status === "trialing")

  return (
    <>
      <Header />
      <main className="pt-28 pb-24 px-4 sm:px-6 lg:px-8 min-h-screen relative overflow-hidden">
        <DetectorShapes seed={131} count={4} intensity={0.3} blur={120} />
        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="mb-8">
            <Link href="/dashboard" className="text-xs text-muted-foreground hover:text-foreground">← Dashboard</Link>
            <div className="flex items-start justify-between flex-wrap gap-3 mt-2">
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Account & billing</div>
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{agency.name}</h1>
                <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
              </div>
              <Link href="/api/stripe/portal">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5" /> Manage billing
                </Button>
              </Link>
            </div>
          </div>

          {/* Plan snapshot */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Agency plan
              </div>
              <div className="text-2xl font-bold capitalize">{agency.plan}</div>
              {agency.plan === "free" && (
                <Link href="/pricing" className="inline-block mt-2 text-xs underline underline-offset-2">
                  Upgrade to Pro
                </Link>
              )}
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> Public profile
              </div>
              <div className="text-2xl font-bold capitalize">{agency.membership_status || "inactive"}</div>
              {agency.public_profile_enabled ? (
                <Link href={`/u/${agency.slug}`} className="inline-block mt-2 text-xs underline underline-offset-2">
                  View profile
                </Link>
              ) : (
                <Link href="/api/stripe/checkout?plan=membership" className="inline-block mt-2 text-xs underline underline-offset-2">
                  Activate ($8/mo)
                </Link>
              )}
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5" /> Next bill
              </div>
              <div className="text-2xl font-bold">
                {activeSub?.current_period_end
                  ? new Date(activeSub.current_period_end).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                  : "—"}
              </div>
              {activeSub && (
                <div className="text-xs text-muted-foreground mt-1">
                  {fmtMoney(activeSub.unit_amount, activeSub.currency || "usd")}/{activeSub.billing_interval || "mo"}
                </div>
              )}
            </div>
          </section>

          {/* Active subscriptions */}
          <section className="rounded-xl border border-border bg-card mb-8 overflow-hidden">
            <div className="p-5 border-b border-border">
              <h2 className="font-semibold">Subscriptions</h2>
              <p className="text-xs text-muted-foreground">Live data from Stripe.</p>
            </div>
            {subs.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">No active subscription. Pick a plan on <Link href="/pricing" className="underline">/pricing</Link>.</div>
            ) : (
              <ul className="divide-y divide-border">
                {subs.map((s) => (
                  <li key={s.id} className="p-5 flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <div className="text-sm font-medium capitalize">{s.plan_label || s.price_id || "Subscription"}</div>
                      <div className="text-xs text-muted-foreground">
                        {fmtMoney(s.unit_amount, s.currency || "usd")}/{s.billing_interval || "mo"}
                        {s.current_period_end && <> · renews {new Date(s.current_period_end).toLocaleDateString()}</>}
                        {s.cancel_at_period_end && <> · <span className="text-orange-500">cancels at period end</span></>}
                      </div>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full border ${
                      s.status === "active" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30" :
                      s.status === "trialing" ? "bg-cyan-500/10 text-cyan-500 border-cyan-500/30" :
                      s.status === "past_due" ? "bg-orange-500/10 text-orange-500 border-orange-500/30" :
                      "bg-zinc-500/10 text-zinc-500 border-zinc-500/30"
                    }`}>{s.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Invoices */}
          <section className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="p-5 border-b border-border">
              <h2 className="font-semibold">Recent invoices</h2>
              <p className="text-xs text-muted-foreground">Last 10. For full history open the billing portal.</p>
            </div>
            {invoices.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">No invoices yet.</div>
            ) : (
              <ul className="divide-y divide-border">
                {invoices.map((inv) => (
                  <li key={inv.id} className="p-5 flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <div className="text-sm font-mono">{inv.number || inv.id.slice(0, 14)}</div>
                      <div className="text-xs text-muted-foreground">
                        {inv.period_end ? new Date(inv.period_end).toLocaleDateString() : "—"}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold tabular-nums">{fmtMoney(inv.total, inv.currency || "usd")}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${
                        inv.status === "paid" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30" :
                        "bg-zinc-500/10 text-zinc-500 border-zinc-500/30"
                      }`}>{inv.status}</span>
                      {inv.invoice_pdf && (
                        <a href={inv.invoice_pdf} target="_blank" rel="noopener" className="text-xs text-foreground hover:underline">PDF</a>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </>
  )
}
