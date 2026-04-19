import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { AnimatedGridBackground } from "@/components/animated-grid-background"
import { AnimatedSection } from "@/components/animated-section"
import { DetectorShapes } from "@/components/detector-shapes"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Check, X as XIcon, Sparkles, ShieldCheck, Users, Rocket } from "lucide-react"
import { PLANS, MEMBERSHIP } from "@/lib/stripe"
import React from "react"

export const metadata = {
  title: "Pricing | VerifiedSXO",
  description:
    "Free to try. Per-feature pricing with no per-seat tax. Agency plans from $0 to custom enterprise, plus the $8/mo public profile add-on.",
  alternates: { canonical: "https://verifiedsxo.com/pricing" },
}

type Cell = string | boolean

const FEATURES: Array<{ group: string; rows: Array<{ label: string; free: Cell; pro: Cell; scale: Cell; hint?: string }> }> = [
  {
    group: "Core",
    rows: [
      { label: "Agency dashboard",            free: true,          pro: true,          scale: true },
      { label: "Client invitations",          free: "1 client",    pro: "Unlimited",   scale: "Unlimited" },
      { label: "Plausibility scores",         free: "Unlimited",   pro: "Unlimited",   scale: "Unlimited" },
      { label: "Live-data verifications",     free: "3 / month",   pro: "Unlimited",   scale: "Unlimited" },
      { label: "AI elevation to 100%",        free: false,         pro: true,          scale: true, hint: "Groq review over uploaded evidence + live verification" },
    ],
  },
  {
    group: "Data connectors (per client)",
    rows: [
      { label: "Google Search Console",       free: true,          pro: true,          scale: true },
      { label: "Google Analytics 4",          free: false,         pro: "Coming",      scale: "Priority roadmap" },
      { label: "Google Ads",                  free: false,         pro: "Coming",      scale: "Priority roadmap" },
      { label: "Stripe (revenue claims)",     free: false,         pro: "Coming",      scale: "Priority roadmap" },
      { label: "LinkedIn sign-in",            free: true,          pro: true,          scale: true },
    ],
  },
  {
    group: "Public surface",
    rows: [
      { label: "Per-claim verification page",      free: true,          pro: true,          scale: true },
      { label: "Embed script (linked badge)",      free: true,          pro: true,          scale: true },
      { label: "Official certificate page",        free: true,          pro: true,          scale: true },
      { label: "Agency profile at /u/[slug]",      free: "$8/mo add-on", pro: "$8/mo add-on", scale: "Included" },
      { label: "Click-to-copy embeds",              free: "Per claim",   pro: "Per claim",   scale: "Bulk + themed" },
    ],
  },
  {
    group: "Team & ops",
    rows: [
      { label: "Automated review collection",      free: false,         pro: "v3 (coming)", scale: "Included day-one" },
      { label: "Incentive bank",                    free: false,         pro: "v2 (coming)", scale: "Custom library" },
      { label: "CRM memberships + certificate flow", free: true,        pro: true,          scale: true },
      { label: "White-label badge + domain",       free: false,         pro: false,         scale: true },
      { label: "Bulk verification API",            free: false,         pro: false,         scale: true },
      { label: "SSO / SAML",                        free: false,         pro: false,         scale: true },
    ],
  },
  {
    group: "Support",
    rows: [
      { label: "Priority email",                    free: false,         pro: true,          scale: true },
      { label: "Dedicated CS engineer",             free: false,         pro: false,         scale: true },
    ],
  },
]

function renderCell(v: Cell) {
  if (v === true) return <Check className="w-4 h-4 text-emerald-500 mx-auto" />
  if (v === false) return <XIcon className="w-4 h-4 text-muted-foreground/40 mx-auto" />
  return <span className="text-xs text-muted-foreground">{v}</span>
}

const FAQ = [
  {
    q: "Do I pay per client I invite?",
    a: "No. On Pro and Scale you get unlimited client invitations. The only per-seat thing is the optional $8/mo public profile membership — and that's paid by whoever wants the public page, not by the agency.",
  },
  {
    q: "What's the difference between an agency plan and the $8/mo membership?",
    a: "Agency plan (Free/Pro/Scale) powers verification and internal tooling. The membership unlocks a public-facing profile at verifiedsxo.com/u/[slug] — all your verified claims in one place, LinkedIn badge, click-to-copy embeds, and a certificate via our CRM. You can have any plan with or without a membership.",
  },
  {
    q: "What happens to my verified claims if I downgrade to Free?",
    a: "Already-published badges, certificates, and proof pages stay live forever. New verifications beyond the 3/month free cap require an upgrade.",
  },
  {
    q: "Do you offer annual pricing?",
    a: "Pro is month-to-month and cancellable anytime. Scale contracts are annual with volume discounts — talk to us.",
  },
  {
    q: "I'm a solo marketer, not an agency — does this work for me?",
    a: "Yes. Sign up as a single-person agency, invite yourself as the client, and run verifications normally. The $8/mo membership lives on your public profile.",
  },
  {
    q: "Can I white-label the badge to remove VerifiedSXO branding?",
    a: "White-label is part of the Scale tier. On Pro/Free the badge credits VerifiedSXO (which helps you — it signals independent verification, which is the whole point).",
  },
  {
    q: "How are verifications counted?",
    a: "One verification = one live-data API call against your claim. Re-running verification on the same claim counts as a new one. Elevation requests count separately and are included on Pro/Scale.",
  },
  {
    q: "What if I cancel?",
    a: "Cancel anytime from /account via Stripe's portal. Your plan stays active through the current billing period, then drops to Free. Published badges never disappear.",
  },
]

const AGENCY_SIZING = [
  { size: "Solo / self-verify",               plan: "Free",   note: "Prove your own stats. 3 verifications/mo.",                  tier: "free" },
  { size: "1–4 clients",                       plan: "Free",   note: "Fits under free tier; upgrade when you hit the cap.",       tier: "free" },
  { size: "5–20 clients",                      plan: "Pro",    note: "Unlimited verifications, elevation, priority support.",     tier: "pro"  },
  { size: "20–50 clients",                     plan: "Pro",    note: "Still Pro — we don't per-seat tax you.",                    tier: "pro"  },
  { size: "50+ clients / white-label / SSO",   plan: "Scale",  note: "Custom contract, dedicated engineer.",                       tier: "scale"},
]

export default function Page() {
  return (
    <>
      <AnimatedGridBackground />
      <Header />
      <main className="relative z-10 pt-28 pb-24 px-4 sm:px-6 lg:px-8">
        <DetectorShapes seed={88} count={6} intensity={0.4} blur={110} />

        {/* Hero */}
        <section className="relative z-10 max-w-4xl mx-auto text-center mb-14">
          <AnimatedSection>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-sm font-medium mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              Transparent pricing · pay only for capacity
            </div>
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-balance mb-5">
              Free to start.{" "}
              <span className="bg-gradient-to-r from-violet-500 to-cyan-500 bg-clip-text text-transparent">Priced to scale.</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              One agency account, unlimited client invitations, feature-based tiers. No per-seat tax, no setup calls,
              no proposal theater.
            </p>
          </AnimatedSection>
        </section>

        {/* How pricing works */}
        <section className="relative z-10 max-w-5xl mx-auto mb-16">
          <AnimatedSection>
            <div className="rounded-2xl border border-border bg-card p-8 md:p-10 grid md:grid-cols-3 gap-6">
              <div>
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500/20 to-cyan-500/20 flex items-center justify-center mb-3">
                  <Rocket className="w-5 h-5" />
                </div>
                <h3 className="font-semibold mb-1">Two independent axes</h3>
                <p className="text-sm text-muted-foreground">
                  <strong>Agency plan</strong> (Free / Pro / Scale) powers verification and tooling.
                  <br /><br />
                  <strong>Public Profile membership</strong> ($8/mo) unlocks the hosted agency page, LinkedIn badge, and certificate flow.
                  You can have one, the other, or both.
                </p>
              </div>
              <div>
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500/20 to-cyan-500/20 flex items-center justify-center mb-3">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="font-semibold mb-1">Unlimited clients on Pro+</h3>
                <p className="text-sm text-muted-foreground">
                  Invite as many clients as you want. Each client connects their own analytics, verifies their own claims,
                  and lives under your agency umbrella. The tier governs capacity (verifications, features) — not headcount.
                </p>
              </div>
              <div>
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500/20 to-cyan-500/20 flex items-center justify-center mb-3">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="font-semibold mb-1">Published badges never expire</h3>
                <p className="text-sm text-muted-foreground">
                  Verifications you complete stay public forever — even if you downgrade or cancel. The tier only caps
                  <em> new </em>verifications and access to advanced features.
                </p>
              </div>
            </div>
          </AnimatedSection>
        </section>

        {/* Plan cards */}
        <section className="relative z-10 max-w-6xl mx-auto mb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.map((plan, i) => (
              <AnimatedSection key={plan.id} delay={i * 80}>
                <div
                  className={`relative rounded-2xl border bg-card p-8 h-full flex flex-col ${
                    plan.featured ? "border-transparent ring-2 ring-violet-500/40 shadow-lg shadow-violet-500/10" : "border-border"
                  }`}
                >
                  {plan.featured && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-violet-500 to-cyan-500 text-white text-xs font-semibold">
                      Most popular
                    </div>
                  )}
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold mb-2">{plan.name}</h2>
                    <p className="text-sm text-muted-foreground">{plan.tagline}</p>
                  </div>
                  <div className="mb-8">
                    {plan.priceUsd === "custom" ? (
                      <div className="text-4xl font-bold">Let&apos;s talk</div>
                    ) : plan.priceUsd === 0 ? (
                      <div>
                        <span className="text-5xl font-bold">$0</span>
                        <span className="text-sm text-muted-foreground ml-1">forever</span>
                      </div>
                    ) : (
                      <div>
                        <span className="text-5xl font-bold">${plan.priceUsd}</span>
                        <span className="text-sm text-muted-foreground ml-1">/ {plan.billing}</span>
                      </div>
                    )}
                  </div>
                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href={plan.href} className="w-full">
                    <Button
                      size="lg"
                      className={`w-full gap-2 ${
                        plan.featured
                          ? "bg-gradient-to-r from-violet-500 to-cyan-500 text-white hover:opacity-90"
                          : "bg-foreground text-background hover:bg-foreground/90"
                      }`}
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </section>

        {/* Agency sizing guide */}
        <section className="relative z-10 max-w-4xl mx-auto mb-16">
          <AnimatedSection>
            <div className="text-center mb-8">
              <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Which plan fits your agency?
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Pick by shape, not by seat count</h2>
            </div>
          </AnimatedSection>
          <AnimatedSection delay={100}>
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-foreground/2 border-b border-border">
                  <tr className="text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="text-left font-medium px-5 py-3 w-2/5">Your size</th>
                    <th className="text-left font-medium px-5 py-3">Recommended plan</th>
                    <th className="text-left font-medium px-5 py-3 hidden sm:table-cell">Why</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {AGENCY_SIZING.map((row) => (
                    <tr key={row.size} className="hover:bg-foreground/2">
                      <td className="px-5 py-4 font-medium">{row.size}</td>
                      <td className="px-5 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                            row.tier === "free" ? "border-zinc-500/40 text-zinc-500 bg-zinc-500/5" :
                            row.tier === "pro" ? "border-violet-500/40 text-violet-500 bg-violet-500/5" :
                            "border-cyan-500/40 text-cyan-500 bg-cyan-500/5"
                          }`}
                        >
                          {row.plan}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-muted-foreground hidden sm:table-cell">{row.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AnimatedSection>
        </section>

        {/* Full comparison matrix */}
        <section className="relative z-10 max-w-5xl mx-auto mb-16">
          <AnimatedSection>
            <div className="text-center mb-8">
              <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Feature comparison
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">What&apos;s in each plan</h2>
            </div>
          </AnimatedSection>
          <AnimatedSection delay={100}>
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[640px]">
                  <thead className="bg-foreground/2 border-b border-border">
                    <tr className="text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="text-left font-medium px-5 py-3 w-2/5">Feature</th>
                      <th className="text-center font-medium px-5 py-3">Free</th>
                      <th className="text-center font-medium px-5 py-3 bg-violet-500/5">Pro $99/mo</th>
                      <th className="text-center font-medium px-5 py-3">Scale</th>
                    </tr>
                  </thead>
                  <tbody>
                    {FEATURES.map((grp) => (
                      <React.Fragment key={grp.group}>
                        <tr className="bg-background">
                          <td colSpan={4} className="px-5 pt-5 pb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                            {grp.group}
                          </td>
                        </tr>
                        {grp.rows.map((row) => (
                          <tr key={`${grp.group}-${row.label}`} className="border-t border-border/50 hover:bg-foreground/2">
                            <td className="px-5 py-3" title={row.hint}>
                              {row.label}
                              {row.hint && <span className="ml-1 text-[10px] text-muted-foreground/70">ⓘ</span>}
                            </td>
                            <td className="px-5 py-3 text-center">{renderCell(row.free)}</td>
                            <td className="px-5 py-3 text-center bg-violet-500/5">{renderCell(row.pro)}</td>
                            <td className="px-5 py-3 text-center">{renderCell(row.scale)}</td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </AnimatedSection>
        </section>

        {/* Public profile add-on */}
        <section className="relative z-10 max-w-5xl mx-auto mb-16">
          <AnimatedSection>
            <div className="text-center mb-8">
              <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Add-on</div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Public profile membership</h2>
              <p className="text-sm text-muted-foreground mt-2">Independent from your agency plan — available to anyone.</p>
            </div>
          </AnimatedSection>
          <AnimatedSection delay={100}>
            <div className="rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-500/5 via-card to-cyan-500/5 p-8 md:p-10 grid md:grid-cols-[1.3fr_1fr] gap-8 items-center">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-violet-500" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{MEMBERSHIP.tagline}</span>
                </div>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-5xl font-bold">$8</span>
                  <span className="text-sm text-muted-foreground">/ month</span>
                </div>
                <ul className="space-y-2.5 text-sm">
                  {MEMBERSHIP.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="md:border-l md:border-border md:pl-8 text-center md:text-left">
                <p className="text-sm text-muted-foreground mb-5">
                  Without membership your verified badges still work — they just point to a single claim page,
                  not a unified profile. Members get the flywheel: <strong>agency page + LinkedIn badge + certificate + directory listing</strong>.
                </p>
                <Link href={MEMBERSHIP.href}>
                  <Button size="lg" className="gap-2 w-full bg-gradient-to-r from-violet-500 to-cyan-500 text-white hover:opacity-90">
                    {MEMBERSHIP.cta}
                  </Button>
                </Link>
                <p className="text-[11px] text-muted-foreground mt-3">Cancel anytime. No commitment.</p>
              </div>
            </div>
          </AnimatedSection>
        </section>

        {/* FAQ */}
        <section className="relative z-10 max-w-3xl mx-auto mb-16">
          <AnimatedSection>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-center mb-8">Pricing questions</h2>
          </AnimatedSection>
          <div className="space-y-3">
            {FAQ.map((f, i) => (
              <AnimatedSection key={f.q} delay={i * 60}>
                <details className="group rounded-xl border border-border bg-card p-5 hover:border-foreground/20 transition-colors">
                  <summary className="cursor-pointer list-none flex items-center justify-between font-medium text-sm">
                    <span>{f.q}</span>
                    <span className="text-muted-foreground group-open:rotate-180 transition-transform">▾</span>
                  </summary>
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{f.a}</p>
                </details>
              </AnimatedSection>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="relative z-10 max-w-3xl mx-auto">
          <div className="rounded-2xl border border-border bg-card p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">Still not sure?</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Start Free. Upgrade the second you need more. Downgrade anytime. We&apos;re not going to trick you.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/signup"><Button className="bg-foreground text-background hover:bg-foreground/90">Start free</Button></Link>
              <Link href="/contact"><Button variant="outline">Talk to us</Button></Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
