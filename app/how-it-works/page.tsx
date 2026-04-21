import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { AnimatedGridBackground } from "@/components/animated-grid-background"
import { AnimatedSection } from "@/components/animated-section"
import { DetectorShapes } from "@/components/detector-shapes"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight, Brain, LinkIcon, ShieldCheck, Award, Lock, Database, Clock } from "lucide-react"

export const metadata = {
  title: "How it works — score, verify, badge, in 15 seconds",
  description:
    "A three-tier AI pipeline scores any claim against 25 years of marketing data, then checks it against live analytics. No screenshots. No self-reporting.",
  alternates: { canonical: "https://verifiedsxo.com/how-it-works" },
  openGraph: {
    title: "Score. Verify. Badge. In 15 seconds.",
    description: "Three-tier AI pipeline + live analytics + an unforgeable embeddable badge.",
    url: "https://verifiedsxo.com/how-it-works",
    siteName: "VerifiedSXO",
    type: "article",
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "How VerifiedSXO works",
    description: "From pasted claim to public trust badge in 15 seconds.",
  },
}

const STEPS = [
  {
    n: "01",
    icon: Brain,
    title: "Plausibility score",
    body: "You paste the exact claim — as written on LinkedIn, Twitter, your homepage. Our model weighs it against 25 years of marketing benchmarks and returns a 0–100% likelihood plus 3 reasons. Unauthenticated, free, 60 seconds.",
    detail: "Runs through CRM Agent Studio (primary) → Groq llama-3.3-70b (fallback) → deterministic heuristic (last resort). Always returns a result.",
  },
  {
    n: "02",
    icon: LinkIcon,
    title: "Connect the source",
    body: "Disagree with the score? Prove it. Click one button to connect Google Search Console, Analytics, Ads, or Stripe — whichever data source actually backs your claim.",
    detail: "OAuth 2.0 user-delegated. Read-only scopes. Tokens AES-256-GCM encrypted at rest. Revoke any time from your dashboard or your Google account.",
  },
  {
    n: "03",
    icon: ShieldCheck,
    title: "We verify against the data",
    body: "We query the live API — not a screenshot — and compare the real numbers to exactly what the claim asserted. Ranking claims: avg position over 28 days for the exact keyword. Traffic claims: summed clicks/impressions for the stated window.",
    detail: "Evidence is stored as structured JSON. Methodology is documented. Confidence score is explicit. You can re-run verification any time.",
  },
  {
    n: "04",
    icon: Award,
    title: "Earn a badge + case-study page",
    body: "On pass, we mint a tamper-resistant badge you can embed on your site with one <script> tag. The badge links to a hosted case-study page with the full claim, evidence, date, and methodology.",
    detail: "Badge is signed. Evidence page is version-stamped. If the underlying data changes, the badge page updates — you can't fake this without your real account.",
  },
]

const FAQS = [
  { q: "Do you store my analytics data?", a: "Only the minimum needed to verify the claim. OAuth refresh tokens are stored encrypted. You can revoke access at Google at any time and the connection dies immediately." },
  { q: "What if my claim changes over time?", a: "Verifications are dated. If you re-verify weekly or monthly, the public badge shows the latest verified value plus a re-verify timestamp." },
  { q: "Can competitors weaponize this against me?", a: "No. Scoring uses only what you publicly claim, and verification only uses data you voluntarily connect. There is no mechanism for anyone to run a verification on someone else's account." },
  { q: "What data sources do you support?", a: "Launching with Google Search Console. Google Analytics 4, Google Ads, Stripe, and GitHub are next on the roadmap." },
  { q: "Is the scoring model based on real data?", a: "Yes. A curated corpus of ~25 years of public marketing performance data (benchmarks from HubSpot, Ahrefs, SimilarWeb, Clutch, industry surveys, etc.) — with proprietary data layered on top." },
]

export default function Page() {
  return (
    <>
      <AnimatedGridBackground />
      <Header />
      <main className="relative z-10 pt-28 pb-24 px-4 sm:px-6 lg:px-8">
        <DetectorShapes seed={9} count={7} intensity={0.4} blur={120} />
        <section className="relative z-10 max-w-4xl mx-auto text-center mb-20">
          <AnimatedSection>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-sm font-medium mb-6">
              <span className="w-2 h-2 rounded-full bg-foreground animate-pulse" />
              4 steps, under 10 minutes
            </div>
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-balance mb-5">
              From a paste to a{" "}
              <span className="bg-gradient-to-r from-violet-500 to-cyan-500 bg-clip-text text-transparent">proof badge</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              The full arc — from a LinkedIn-worthy claim to a tamper-resistant badge you embed on your own site.
            </p>
          </AnimatedSection>
        </section>

        <section className="max-w-4xl mx-auto space-y-5 mb-24">
          {STEPS.map((s, i) => (
            <AnimatedSection key={s.n} delay={i * 80}>
              <div className="rounded-xl border border-border bg-card p-6 md:p-8 hover:border-foreground/20 transition-colors">
                <div className="flex items-start gap-5">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-violet-500/10 to-cyan-500/10 flex items-center justify-center shrink-0">
                    <s.icon className="w-6 h-6 text-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">{s.n}</span>
                      <h2 className="text-xl sm:text-2xl font-bold">{s.title}</h2>
                    </div>
                    <p className="text-base text-muted-foreground leading-relaxed mb-3">{s.body}</p>
                    <p className="text-xs text-muted-foreground/80 leading-relaxed border-l-2 border-border pl-3">{s.detail}</p>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </section>

        <section className="max-w-4xl mx-auto mb-24">
          <AnimatedSection>
            <div className="text-center mb-10">
              <div className="text-sm text-muted-foreground uppercase tracking-wider mb-3">Under the hood</div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">What makes this tamper-resistant</h2>
            </div>
          </AnimatedSection>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { icon: Lock, title: "User-delegated OAuth", body: "We never see credentials. Google issues us scoped read-only tokens on your explicit consent. Revocable at any time." },
              { icon: Database, title: "Real-API queries", body: "Every verification is a live call to Google's API. No screenshots. No copy-paste. No way to fake the number." },
              { icon: Clock, title: "Version-stamped evidence", body: "Each verification is dated + confidence-scored. Public pages update when data updates — nothing is preserved in amber." },
            ].map((c, i) => (
              <AnimatedSection key={c.title} delay={i * 100}>
                <div className="p-6 rounded-xl border border-border bg-card h-full">
                  <div className="w-9 h-9 rounded-md bg-secondary flex items-center justify-center mb-4">
                    <c.icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold mb-2">{c.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{c.body}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </section>

        <section className="max-w-3xl mx-auto mb-20">
          <AnimatedSection>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-center mb-10">FAQ</h2>
          </AnimatedSection>
          <div className="space-y-3">
            {FAQS.map((f, i) => (
              <AnimatedSection key={f.q} delay={i * 60}>
                <details className="group rounded-xl border border-border bg-card p-5 hover:border-foreground/20 transition-colors">
                  <summary className="cursor-pointer list-none flex items-center justify-between font-medium">
                    <span>{f.q}</span>
                    <span className="text-muted-foreground group-open:rotate-180 transition-transform">▾</span>
                  </summary>
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{f.a}</p>
                </details>
              </AnimatedSection>
            ))}
          </div>
        </section>

        <section className="max-w-3xl mx-auto text-center">
          <div className="rounded-2xl border border-border bg-card p-10 md:p-14">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">Try it in 60 seconds</h2>
            <p className="text-muted-foreground mb-8">Paste any stat claim — we score it without asking you to sign up.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/#verify"><Button size="lg" className="gap-2 bg-foreground text-background hover:bg-foreground/90">Score a claim <ArrowRight className="w-4 h-4" /></Button></Link>
              <Link href="/pricing"><Button size="lg" variant="outline">See pricing</Button></Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
