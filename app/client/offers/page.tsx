import { redirect } from "next/navigation"
import Link from "next/link"
import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabase/server"
import { AppShell } from "@/components/app-shell"
import { clientNav } from "@/lib/nav"
import { Gift, ArrowRight } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function ClientOffersPage() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login?next=/client/offers")

  const admin = getSupabaseAdmin()
  const { data: clientRow } = await admin
    .from("vsxo_agency_clients")
    .select("id, agency_id, vsxo_agencies(name, slug)")
    .eq("user_id", user.id)
    .maybeSingle()
  if (!clientRow) redirect("/dashboard")
  // @ts-expect-error join
  const agencyName: string = clientRow.vsxo_agencies?.name || "your agency"
  // @ts-expect-error join
  const agencySlug: string = clientRow.vsxo_agencies?.slug || ""

  return (
    <AppShell
      subtitle="Partner perks"
      title="Special offers"
      groups={clientNav("/client/offers", { offers: 2 })}
    >
      <p className="text-sm text-muted-foreground -mt-4 mb-6">
        Deals from VerifiedSXO partners and the tools {agencyName} recommends.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <OfferCard
          brand="VerifiedSXO"
          headline="Get a Seal of Truth badge on your own site"
          description="Independent claims verification for your own landing pages — $8/mo unlocks the public profile + embeddable badge."
          cta="Activate"
          ctaHref="/api/stripe/checkout?plan=membership"
          accent="from-violet-500 to-cyan-500"
        />
        <OfferCard
          brand={agencyName}
          headline={`Work directly with ${agencyName}`}
          description="Your agency publishes verified case studies under your name. Check their public profile for proof."
          cta="View profile"
          ctaHref={agencySlug ? `/u/${agencySlug}` : "/how-it-works"}
          accent="from-emerald-500 to-cyan-500"
        />
      </div>

      <section className="mt-8 rounded-xl border border-dashed border-border bg-card/50 p-6 text-center">
        <Gift className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
        <div className="text-sm font-medium mb-1">More offers coming</div>
        <p className="text-xs text-muted-foreground max-w-md mx-auto">
          We&rsquo;re curating deals from tools that help agencies prove their claims —
          analytics, attribution, and reporting software.
          Want to partner? <Link href="/contact" className="underline underline-offset-2">Get in touch.</Link>
        </p>
      </section>
    </AppShell>
  )
}

function OfferCard({
  brand, headline, description, cta, ctaHref, accent,
}: {
  brand: string; headline: string; description: string
  cta: string; ctaHref: string; accent: string
}) {
  return (
    <article className="rounded-xl border border-border bg-card overflow-hidden">
      <div className={`h-1 bg-gradient-to-r ${accent}`} />
      <div className="p-5">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">{brand}</div>
        <h3 className="font-semibold text-base mb-2">{headline}</h3>
        <p className="text-xs text-muted-foreground mb-4 leading-relaxed">{description}</p>
        <Link
          href={ctaHref}
          className="inline-flex items-center gap-1 text-xs font-medium underline underline-offset-2 hover:text-foreground text-foreground/80"
        >
          {cta} <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </article>
  )
}
