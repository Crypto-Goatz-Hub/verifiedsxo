import { notFound } from "next/navigation"
import Link from "next/link"
import { getSupabaseAdmin } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { AnimatedGridBackground } from "@/components/animated-grid-background"
import { ShieldCheck, Calendar, LinkIcon } from "lucide-react"

export const dynamic = "force-dynamic"

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  return {
    title: `Verified claim · ${slug} | VerifiedSXO`,
    description: "Independently verified marketing claim — evidence, methodology, and data source.",
  }
}

export default async function VerifiedPage({ params }: Props) {
  const { slug } = await params
  const admin = getSupabaseAdmin()

  const { data: badge } = await admin
    .from("vsxo_badges")
    .select("id, slug, claim_id, client_id, last_verified_at, public_visible, verification_id")
    .eq("slug", slug)
    .eq("public_visible", true)
    .maybeSingle()

  if (!badge) notFound()

  const [verificationRes, claimRes, clientRes] = await Promise.all([
    admin.from("vsxo_verifications").select("id, evidence, passed, confidence, provider, verified_at").eq("id", badge.verification_id).single(),
    admin.from("vsxo_claims").select("claim_text, claim_type, created_at").eq("id", badge.claim_id).single(),
    admin.from("vsxo_agency_clients").select("name, company, website, vsxo_agencies(name, slug)").eq("id", badge.client_id).single(),
  ])

  const verification = verificationRes.data
  const claim = claimRes.data
  const client = clientRes.data
  if (!verification || !claim || !client) notFound()

  const evidence = (verification.evidence as Record<string, unknown>) || {}
  const summary = (evidence.summary as string) || "Independently verified marketing claim."
  // @ts-expect-error join
  const agencyName: string = client.vsxo_agencies?.name || "VerifiedSXO agency"

  return (
    <>
      <AnimatedGridBackground />
      <Header />

      <main className="relative z-10 pt-28 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 text-sm font-medium mb-5">
              <ShieldCheck className="w-4 h-4" />
              Independently verified
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-balance mb-4">
              &ldquo;{claim.claim_text}&rdquo;
            </h1>
            <div className="text-sm text-muted-foreground flex items-center gap-2 justify-center flex-wrap">
              <span>Claimed by <strong className="text-foreground">{client.company || client.name}</strong></span>
              <span className="opacity-40">·</span>
              <span>Verified via {verification.provider.toUpperCase()}</span>
              <span className="opacity-40">·</span>
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(verification.verified_at).toLocaleDateString("en-US", { dateStyle: "long" })}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="rounded-xl border border-border bg-card p-6 text-center">
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Result</div>
              <div className="text-3xl font-bold text-emerald-500">Passed</div>
            </div>
            <div className="rounded-xl border border-border bg-card p-6 text-center">
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Confidence</div>
              <div className="text-3xl font-bold">{verification.confidence}%</div>
            </div>
            <div className="rounded-xl border border-border bg-card p-6 text-center">
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Data source</div>
              <div className="text-lg font-semibold">Google Search Console</div>
              <div className="text-xs text-muted-foreground mt-1">User-delegated OAuth</div>
            </div>
          </div>

          <section className="rounded-xl border border-border bg-card p-6 md:p-8 mb-6">
            <h2 className="text-xl font-semibold mb-3">What the data shows</h2>
            <p className="text-muted-foreground leading-relaxed">{summary}</p>
          </section>

          <section className="rounded-xl border border-border bg-card p-6 md:p-8 mb-6">
            <h2 className="text-xl font-semibold mb-4">Evidence</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              {Object.entries(evidence)
                .filter(([k]) => k !== "summary")
                .map(([k, v]) => (
                  <div key={k} className="border-b border-border/50 pb-2">
                    <dt className="text-xs text-muted-foreground uppercase tracking-wider">{k.replaceAll("_", " ")}</dt>
                    <dd className="font-mono text-sm mt-0.5">{String(v)}</dd>
                  </div>
                ))}
            </dl>
          </section>

          <section className="rounded-xl border border-border bg-card p-6 md:p-8 mb-6">
            <h2 className="text-xl font-semibold mb-3">Methodology</h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>1. The client granted VerifiedSXO read-only access to their Google Search Console via standard OAuth.</li>
              <li>2. We queried the Search Console Search Analytics API directly — no screenshots, no self-reported data.</li>
              <li>3. Reported values are aggregated over the stated window and compared to the specific target the claim made.</li>
              <li>4. The verification is re-run automatically over time; if the underlying data changes, this page reflects it.</li>
            </ul>
          </section>

          <div className="text-center text-sm text-muted-foreground">
            Audited by {agencyName} · powered by{" "}
            <Link href="/" className="text-foreground hover:underline">VerifiedSXO</Link>
          </div>

          {client.website && (
            <div className="text-center mt-6">
              <Link
                href={client.website}
                className="inline-flex items-center gap-2 text-sm text-foreground/70 hover:text-foreground"
              >
                <LinkIcon className="w-3 h-3" /> Visit {client.company || client.name}
              </Link>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  )
}
