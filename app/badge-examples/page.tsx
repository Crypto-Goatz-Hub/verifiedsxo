import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { AnimatedGridBackground } from "@/components/animated-grid-background"
import { DetectorShapes } from "@/components/detector-shapes"
import { AnimatedSection } from "@/components/animated-section"
import { BadgePreview } from "./badge-preview"
import { CopyEmbed } from "@/components/copy-embed"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ShieldCheck, Maximize2, Grid2x2 } from "lucide-react"
import { getSupabaseAdmin } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Badge examples — one script, three variants, zero dependencies",
  description:
    "Inline pill, circular stamp, or full banner — each embeddable with one script tag. Shadow-DOM scoped, tamper-evident, click-through to methodology.",
  alternates: { canonical: "https://verifiedsxo.com/badge-examples" },
  openGraph: {
    title: "One script. Three variants. Zero dependencies.",
    description: "Drop-in proof badge for any site, email, or deck. Live-rendered against verifiedsxo.com.",
    url: "https://verifiedsxo.com/badge-examples",
    siteName: "VerifiedSXO",
    type: "website",
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "VerifiedSXO badges — drop-in proof",
    description: "Inline · stamp · banner — one script, three variants.",
  },
}

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://verifiedsxo.com"

async function getExampleSlug(): Promise<string | null> {
  const admin = getSupabaseAdmin()
  const { data } = await admin
    .from("vsxo_badges")
    .select("slug")
    .eq("public_visible", true)
    .order("last_verified_at", { ascending: false })
    .limit(1)
    .maybeSingle()
  return data?.slug || null
}

export default async function Page() {
  const slug = (await getExampleSlug()) || "example"
  const inlineSnippet = `<script src="${SITE}/v/${slug}" async></script>`
  const inlineMetricSnippet = `<script src="${SITE}/v/${slug}" data-metric="#1 Google" async></script>`
  const stampSnippet = `<script src="${SITE}/v/${slug}" data-variant="stamp" async></script>`
  const bannerSnippet = `<script src="${SITE}/v/${slug}" data-variant="banner" data-metric="#1 Google" async></script>`
  const darkInlineSnippet = `<script src="${SITE}/v/${slug}" data-theme="dark" async></script>`

  return (
    <>
      <AnimatedGridBackground />
      <Header />
      <main className="relative z-10 pt-28 pb-24 px-4 sm:px-6 lg:px-8">
        <DetectorShapes seed={777} count={5} intensity={0.35} blur={120} />

        {/* Hero */}
        <section className="relative z-10 max-w-4xl mx-auto text-center mb-14">
          <AnimatedSection>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-sm font-medium mb-5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Trust in one tag
            </div>
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-balance mb-4">
              One script.{" "}
              <span className="bg-gradient-to-r from-violet-500 to-cyan-500 bg-clip-text text-transparent">Three variants.</span>{" "}
              Zero dependencies.
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Drop a single <code className="text-sm bg-foreground/5 px-1.5 py-0.5 rounded">&lt;script&gt;</code> tag anywhere on your site.
              Shadow-DOM scoped. No fonts, no images, no CSS bleed. Click-through to a live verification page.
            </p>
          </AnimatedSection>
        </section>

        {/* Variant gallery */}
        <section className="relative z-10 max-w-4xl mx-auto space-y-10">
          {/* Inline (default) */}
          <AnimatedSection>
            <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
              <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Variant 01 · default</div>
                  <h2 className="text-2xl font-bold tracking-tight mt-1">Inline pill</h2>
                  <p className="text-sm text-muted-foreground mt-1">Drop-in next to a stat, in a footer, under a hero, in an article byline.</p>
                </div>
                <Grid2x2 className="w-5 h-5 text-muted-foreground shrink-0" />
              </div>

              <div className="rounded-xl bg-gradient-to-br from-background to-foreground/3 border border-border/60 p-8 flex items-center justify-center min-h-[120px] mb-3">
                <BadgePreview slug={slug} />
              </div>
              <p className="text-xs text-muted-foreground italic text-center mb-5">
                Example above is a live render against verifiedsxo.com/v/{slug}
              </p>

              <div className="space-y-4">
                <CopyEmbed snippet={inlineSnippet} label="Default" />
                <CopyEmbed snippet={inlineMetricSnippet} label="With a short metric callout (e.g. #1 Google)" />
                <CopyEmbed snippet={darkInlineSnippet} label="Dark theme (for dark-surface backgrounds)" />
              </div>
            </div>
          </AnimatedSection>

          {/* Stamp */}
          <AnimatedSection delay={80}>
            <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
              <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Variant 02 · recognizable</div>
                  <h2 className="text-2xl font-bold tracking-tight mt-1">Circular stamp</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    120×120 trust seal with rotating ring + pulsing core. Place beside a hero stat, on case-study pages,
                    in PDFs printed from your browser, or in email signatures.
                  </p>
                </div>
                <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
              </div>

              <div className="rounded-xl bg-gradient-to-br from-background to-foreground/3 border border-border/60 p-8 flex items-center justify-center min-h-[180px] mb-3">
                <BadgePreview slug={slug} variant="stamp" />
              </div>
              <p className="text-xs text-muted-foreground italic text-center mb-5">Live render</p>

              <CopyEmbed snippet={stampSnippet} label="Stamp" />
            </div>
          </AnimatedSection>

          {/* Banner */}
          <AnimatedSection delay={160}>
            <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
              <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Variant 03 · headline</div>
                  <h2 className="text-2xl font-bold tracking-tight mt-1">Banner strip</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Wide, headline-grade. Put it directly above or below the stat claim it proves.
                  </p>
                </div>
                <Maximize2 className="w-5 h-5 text-muted-foreground shrink-0" />
              </div>

              <div className="rounded-xl bg-gradient-to-br from-background to-foreground/3 border border-border/60 p-8 flex items-center justify-center min-h-[150px] mb-3">
                <BadgePreview slug={slug} variant="banner" metric="#1 Google" />
              </div>
              <p className="text-xs text-muted-foreground italic text-center mb-5">Live render with <code>data-metric=&quot;#1 Google&quot;</code></p>

              <CopyEmbed snippet={bannerSnippet} label="Banner with metric" />
            </div>
          </AnimatedSection>

          {/* Customization docs */}
          <AnimatedSection delay={200}>
            <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
              <h2 className="text-2xl font-bold tracking-tight mb-1">Customization</h2>
              <p className="text-sm text-muted-foreground mb-6">
                All customization is via <code className="text-sm bg-foreground/5 px-1.5 py-0.5 rounded">data-*</code> attributes on the script tag.
                No JS API to call, no config file.
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[560px]">
                  <thead className="border-b border-border">
                    <tr className="text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="text-left font-medium px-4 py-2 w-1/4">Attribute</th>
                      <th className="text-left font-medium px-4 py-2 w-1/3">Values</th>
                      <th className="text-left font-medium px-4 py-2">Effect</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    <tr>
                      <td className="px-4 py-3 font-mono text-xs">data-variant</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">inline · stamp · banner</td>
                      <td className="px-4 py-3">Picks which badge shape renders (defaults to <code>inline</code>).</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-mono text-xs">data-theme</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">light (default) · dark</td>
                      <td className="px-4 py-3">Flips surface + text color for dark backgrounds.</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-mono text-xs">data-metric</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">any short string (≤ 40 chars)</td>
                      <td className="px-4 py-3">Adds a short stat tag (e.g. <code>#1 Google</code>) inline/banner only.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </AnimatedSection>

          {/* Rules / why it's trustworthy */}
          <AnimatedSection delay={240}>
            <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
              <h2 className="text-2xl font-bold tracking-tight mb-4">Why this badge is different</h2>
              <ul className="space-y-3 text-sm">
                {[
                  { k: "Tamper-evident", v: "Each script is bound to a specific, server-signed verification. Edit the URL and the badge won't render." },
                  { k: "Live, not baked-in", v: "Renders from verifiedsxo.com on every load. If the underlying claim is revoked, the badge is gone instantly — no cached lie." },
                  { k: "Style-isolated", v: "Each badge lives in a closed shadow root. It can't be restyled, hijacked, or broken by your site CSS." },
                  { k: "Zero-dep", v: "Inline SVG, system fonts. No remote images, no Google Fonts, no webfont flash." },
                  { k: "Accessible + crawlable", v: "Link, aria-label, visible text. Search engines and screen readers see it as a real proof link." },
                  { k: "Click-through", v: "Every badge opens the full methodology page — evidence, confidence, data source, re-verify timestamp." },
                ].map((r) => (
                  <li key={r.k} className="flex gap-3">
                    <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-semibold">{r.k}.</strong>{" "}
                      <span className="text-muted-foreground">{r.v}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={280}>
            <div className="rounded-2xl border border-border bg-card p-8 text-center">
              <h2 className="text-xl font-semibold mb-2">Want your own?</h2>
              <p className="text-sm text-muted-foreground mb-5">
                Connect your analytics, verify a claim, copy your script. ~3 minutes.
              </p>
              <Link href="/signup">
                <Button className="bg-foreground text-background hover:bg-foreground/90">Start verifying</Button>
              </Link>
            </div>
          </AnimatedSection>
        </section>
      </main>
      <Footer />
    </>
  )
}
