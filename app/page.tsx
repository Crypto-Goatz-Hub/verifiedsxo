import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { AnimatedGridBackground } from "@/components/animated-grid-background"
import { AnimatedSection } from "@/components/animated-section"
import { BsScanner } from "@/components/bs-scanner"
import { ArrowRight, ShieldCheck, Brain, LinkIcon, Award } from "lucide-react"
import Link from "next/link"

export default function Home() {
  return (
    <>
      <AnimatedGridBackground />
      <Header />

      <main className="relative z-10">
        {/* Hero */}
        <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
          {/* floating orbs */}
          <div
            className="absolute top-20 right-10 w-96 h-96 bg-foreground/5 rounded-full blur-3xl animate-float pointer-events-none"
            aria-hidden
          />
          <div
            className="absolute bottom-0 left-10 w-64 h-64 bg-foreground/3 rounded-full blur-3xl animate-float pointer-events-none"
            style={{ animationDelay: "2s" }}
            aria-hidden
          />

          <div className="max-w-5xl mx-auto text-center relative z-10">
            <AnimatedSection>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-sm font-medium mb-8">
                <span className="w-2 h-2 rounded-full bg-foreground animate-pulse" />
                The proof layer for marketers
              </div>
            </AnimatedSection>

            {/* BS Scanner — lives directly above the H1 */}
            <AnimatedSection delay={50}>
              <div id="verify" className="mb-16 scroll-mt-24">
                <BsScanner />
              </div>
            </AnimatedSection>

            <AnimatedSection delay={100}>
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight text-balance mb-6">
                Every stat claim,{" "}
                <span className="bg-gradient-to-r from-violet-500 to-cyan-500 bg-clip-text text-transparent">
                  weighed against 25 years of data
                </span>
                .
              </h1>
            </AnimatedSection>

            <AnimatedSection delay={200}>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
                Paste any marketing claim — "I made $100K in a week," "I rank #1 for my keyword,"
                "I built 5 SaaS apps last month." We score its plausibility, then give you a path
                to <span className="text-foreground font-semibold">actually prove it</span> with
                your own analytics. Earn a badge that lives next to your stat forever.
              </p>
            </AnimatedSection>

            <AnimatedSection delay={300}>
              <div className="flex flex-col sm:flex-row gap-3 justify-center mb-16">
                <Link href="#verify">
                  <Button
                    size="lg"
                    className="gap-2 group bg-foreground text-background hover:bg-foreground/90 transition-all duration-300 hover:shadow-lg hover:shadow-foreground/20"
                  >
                    Verify a claim free
                    <ArrowRight className="transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link href="/for-agencies">
                  <Button
                    variant="outline"
                    size="lg"
                    className="group bg-transparent border-border hover:border-foreground/50 hover:bg-foreground/5 transition-all duration-300"
                  >
                    I&apos;m an agency
                    <ArrowRight className="ml-2 opacity-0 transition-all group-hover:opacity-100" />
                  </Button>
                </Link>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={400}>
              <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto pt-10 border-t border-border/50 text-left sm:text-center">
                <div>
                  <div className="text-2xl sm:text-3xl font-bold">25 yrs</div>
                  <div className="text-xs text-muted-foreground mt-1">Marketing data corpus</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-bold">5</div>
                  <div className="text-xs text-muted-foreground mt-1">Data sources to prove it</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-bold">&lt;60s</div>
                  <div className="text-xs text-muted-foreground mt-1">First score</div>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </section>

        {/* How it works */}
        <section
          id="how-it-works"
          className="py-24 px-4 sm:px-6 lg:px-8 scroll-mt-20 relative"
        >
          <div className="max-w-6xl mx-auto">
            <AnimatedSection>
              <div className="text-center mb-16">
                <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  How it works
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-balance">
                  Four steps from claim to credibility
                </h2>
              </div>
            </AnimatedSection>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: Brain,
                  step: "01",
                  title: "Plausibility score",
                  desc: "Your claim is weighed against 25 years of marketing benchmarks. You get a % likelihood + reasoning in under 60 seconds.",
                },
                {
                  icon: LinkIcon,
                  step: "02",
                  title: "Connect the data",
                  desc: "Think the score is too low? Connect your Google Analytics, Search Console, Ads, or Stripe with one click.",
                },
                {
                  icon: ShieldCheck,
                  step: "03",
                  title: "We verify the numbers",
                  desc: "We pull the real metrics from your live accounts and compare to your claim. No guesswork, no self-reporting.",
                },
                {
                  icon: Award,
                  step: "04",
                  title: "Get your badge",
                  desc: "A tamper-resistant script you embed on your site. Links to a case-study page we host with the evidence.",
                },
              ].map((s, i) => (
                <AnimatedSection key={s.step} delay={i * 100}>
                  <div className="p-6 rounded-xl border border-border bg-card h-full transition-all duration-500 hover:border-foreground/20 hover:shadow-lg hover:shadow-foreground/5 group">
                    <div className="flex items-center justify-between mb-5">
                      <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center group-hover:scale-110 transition-transform">
                        <s.icon className="w-5 h-5" />
                      </div>
                      <span className="text-xs text-muted-foreground font-mono">{s.step}</span>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{s.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        {/* Why */}
        <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
          <div className="max-w-4xl mx-auto text-center">
            <AnimatedSection>
              <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
                Why it matters
              </div>
              <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-balance mb-6">
                Marketing runs on claims.{" "}
                <span className="bg-gradient-to-r from-violet-500 to-cyan-500 bg-clip-text text-transparent">
                  Most are fiction.
                </span>
              </h2>
              <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                LinkedIn and Twitter are a sea of unregulated, unprovable stats. Founders
                inflate numbers. Agencies recycle vanity metrics. Clients can&apos;t tell what&apos;s
                real. VerifiedSXO is the credibility layer that didn&apos;t exist — until now.
              </p>
            </AnimatedSection>
          </div>
        </section>

        {/* Agency CTA */}
        <section className="py-24 px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-5xl mx-auto">
            <AnimatedSection>
              <div className="rounded-2xl border border-border bg-card p-10 md:p-16 relative overflow-hidden">
                <div
                  className="absolute -top-20 -right-20 w-80 h-80 bg-gradient-to-br from-violet-500/10 to-cyan-500/10 rounded-full blur-3xl pointer-events-none"
                  aria-hidden
                />
                <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
                      For agencies
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-balance mb-4">
                      Become the proof behind your clients.
                    </h2>
                    <p className="text-muted-foreground mb-8 leading-relaxed">
                      Invite every client to verify their own stats. Assign them free
                      incentives from our library. Run an automated review flow that
                      collects testimonials tied to each verified claim. Your reputation
                      compounds, automatically.
                    </p>
                    <Link href="/for-agencies">
                      <Button size="lg" className="gap-2 group bg-foreground text-background hover:bg-foreground/90">
                        See the agency dashboard
                        <ArrowRight className="transition-transform group-hover:translate-x-1" />
                      </Button>
                    </Link>
                  </div>
                  <ul className="space-y-3 text-sm">
                    {[
                      "Unlimited client invitations",
                      "Incentive bank — free templates & tools to onboard clients",
                      "Automated post-verification review collection",
                      "Per-client dashboards and verification histories",
                      "White-label badge options (coming soon)",
                    ].map((b) => (
                      <li key={b} className="flex items-start gap-3">
                        <ShieldCheck className="w-5 h-5 text-foreground shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}
