import { notFound } from "next/navigation"
import Link from "next/link"
import { getSupabaseAdmin } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { AnimatedGridBackground } from "@/components/animated-grid-background"
import { DetectorShapes } from "@/components/detector-shapes"
import { CopyEmbed } from "@/components/copy-embed"
import { Button } from "@/components/ui/button"
import { ShareButtons } from "@/components/share-buttons"
import { ShieldCheck, Linkedin, ArrowRight } from "lucide-react"

export const dynamic = "force-dynamic"

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const admin = getSupabaseAdmin()
  const { data: a } = await admin
    .from("vsxo_agencies")
    .select("name, tagline, description, domain_verified")
    .eq("slug", slug)
    .maybeSingle()
  const name = a?.name || slug
  const tagline = a?.tagline || "Independently verified marketing claims, live on a public agency profile."
  const title = `${name} — ${a?.domain_verified ? "verified agency" : "agency profile"}`
  return {
    title,
    description: tagline,
    alternates: { canonical: `https://verifiedsxo.com/u/${slug}` },
    openGraph: {
      title,
      description: tagline,
      url: `https://verifiedsxo.com/u/${slug}`,
      siteName: "VerifiedSXO",
      type: "profile",
    },
    twitter: {
      card: "summary_large_image" as const,
      title,
      description: tagline,
    },
  }
}

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://verifiedsxo.com"

export default async function PublicProfilePage({ params }: Props) {
  const { slug } = await params
  const admin = getSupabaseAdmin()

  const { data: agency } = await admin
    .from("vsxo_agencies")
    .select("id, name, slug, logo_url, website, plan, tagline, description, membership_status, public_profile_enabled")
    .eq("slug", slug)
    .maybeSingle()
  if (!agency) notFound()

  const isActive = agency.public_profile_enabled && agency.membership_status === "active"

  // Gate: non-active memberships show an upsell stub instead of the full profile
  if (!isActive) {
    return (
      <>
        <AnimatedGridBackground />
        <Header />
        <main className="relative z-10 pt-28 pb-24 px-4 sm:px-6 lg:px-8">
          <DetectorShapes seed={202} count={5} intensity={0.35} blur={110} />
          <div className="relative z-10 max-w-xl mx-auto text-center">
            <div className="rounded-2xl border border-border bg-card p-10">
              <ShieldCheck className="w-10 h-10 mx-auto text-muted-foreground mb-4" />
              <h1 className="text-2xl font-bold mb-2">{agency.name}</h1>
              <p className="text-sm text-muted-foreground mb-6">
                This public profile isn&apos;t active yet. The agency can turn it on for $8/month.
              </p>
              <p className="text-xs text-muted-foreground">
                Individual verified claims by this agency&apos;s clients are still publicly browsable —
                the agency profile just isn&apos;t consolidated here.
              </p>
            </div>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  // Clients + their verified badges
  const { data: clients } = await admin
    .from("vsxo_agency_clients")
    .select("id, name, company")
    .eq("agency_id", agency.id)
    .eq("status", "active")

  const clientIds = (clients || []).map((c) => c.id)
  const { data: badges } = clientIds.length
    ? await admin
        .from("vsxo_badges")
        .select("id, slug, claim_id, client_id, last_verified_at, embed_count, vsxo_claims(claim_text, claim_type, status)")
        .in("client_id", clientIds)
        .eq("public_visible", true)
        .order("last_verified_at", { ascending: false })
    : { data: [] }

  // Linked accounts: look for any client with LinkedIn connection
  const { data: linkedinConnections } = clientIds.length
    ? await admin
        .from("vsxo_data_connections")
        .select("client_id, account_label")
        .in("client_id", clientIds)
        .eq("provider", "linkedin")
        .eq("status", "connected")
    : { data: [] }

  const linkedinByClient = new Map((linkedinConnections || []).map((c) => [c.client_id, c.account_label]))

  return (
    <>
      <AnimatedGridBackground />
      <Header />
      <main className="relative z-10 pt-28 pb-24 px-4 sm:px-6 lg:px-8">
        <DetectorShapes seed={303} count={6} intensity={0.4} blur={120} />
        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 text-xs font-medium mb-5">
              <ShieldCheck className="w-3.5 h-3.5" /> Verified VerifiedSXO member
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-balance mb-3">{agency.name}</h1>
            {agency.tagline && <p className="text-lg text-muted-foreground mb-3">{agency.tagline}</p>}
            {agency.website && (
              <a href={agency.website} target="_blank" rel="noopener" className="text-sm underline underline-offset-2">
                {agency.website}
              </a>
            )}
          </div>

          {agency.description && (
            <section className="rounded-xl border border-border bg-card p-6 mb-6">
              <p className="text-sm leading-relaxed">{agency.description}</p>
            </section>
          )}

          <div className="rounded-xl border bg-card p-4 mb-6">
            <ShareButtons
              url={`${SITE}/u/${agency.slug}?r=${encodeURIComponent(agency.slug)}`}
              text={`${agency.name} — ${agency.tagline || "Verified agency on VerifiedSXO."}`}
              compact
            />
          </div>

          <section className="rounded-xl border border-border bg-card p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Verified claims</h2>
              <span className="text-xs text-muted-foreground">{badges?.length || 0} total</span>
            </div>
            {badges && badges.length > 0 ? (
              <ul className="space-y-4">
                {badges.map((b) => {
                  // @ts-expect-error join
                  const claim = b.vsxo_claims
                  const snippet = `<script src="${SITE}/v/${b.slug}" async></script>`
                  return (
                    <li key={b.id} className="rounded-lg border border-border bg-background p-5">
                      <div className="flex items-start justify-between flex-wrap gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{claim?.claim_type}</div>
                          <div className="text-sm font-medium">&ldquo;{claim?.claim_text}&rdquo;</div>
                          <div className="text-[10px] text-muted-foreground mt-1">
                            Verified {new Date(b.last_verified_at).toLocaleDateString()}
                            {b.embed_count > 0 ? ` · embedded ${b.embed_count}×` : ""}
                            {claim?.status === "elevated" && <> · <span className="text-emerald-500 font-semibold">Elevated 100%</span></>}
                          </div>
                        </div>
                        <Link href={`/verified/${b.slug}`}>
                          <Button variant="outline" size="sm" className="gap-1"><ShieldCheck className="w-3 h-3" /> Full proof</Button>
                        </Link>
                      </div>
                      <CopyEmbed snippet={snippet} label="Embed this badge on your site" />
                    </li>
                  )
                })}
              </ul>
            ) : (
              <div className="text-center text-sm text-muted-foreground py-8 border border-dashed border-border rounded-lg">
                No verified claims yet. Their first one drops here the moment it&apos;s verified.
              </div>
            )}
          </section>

          {linkedinByClient.size > 0 && (
            <section className="rounded-xl border border-border bg-card p-6 mb-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                <Linkedin className="w-3.5 h-3.5" /> LinkedIn-connected clients
              </h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                {(clients || []).filter((c) => linkedinByClient.has(c.id)).map((c) => (
                  <li key={c.id} className="flex items-center gap-2 p-3 border border-border rounded-lg bg-background">
                    <Linkedin className="w-4 h-4 text-[#0a66c2]" />
                    <span className="truncate">{c.company || c.name}</span>
                    <span className="text-[10px] text-muted-foreground ml-auto">{linkedinByClient.get(c.id)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="rounded-2xl border border-border bg-card p-10 text-center">
            <h2 className="text-xl font-semibold mb-2">Want your own verified page?</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Prove your marketing claims with live data. Embed badges on your site. Build real credibility.
            </p>
            <Link href="/signup"><Button size="lg" className="gap-2 bg-foreground text-background hover:bg-foreground/90">Get verified <ArrowRight className="w-4 h-4" /></Button></Link>
          </section>
        </div>
      </main>
      <Footer />
    </>
  )
}
