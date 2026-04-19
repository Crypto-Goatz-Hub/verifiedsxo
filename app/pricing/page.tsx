import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { AnimatedGridBackground } from "@/components/animated-grid-background"
import { AnimatedSection } from "@/components/animated-section"
import { DetectorShapes } from "@/components/detector-shapes"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Check, Sparkles } from "lucide-react"
import { PLANS } from "@/lib/stripe"

export const metadata = {
  title: "Pricing | VerifiedSXO",
  description: "Free to try, predictable as you scale. No proposal theater. Cancel anytime.",
  alternates: { canonical: "https://verifiedsxo.com/pricing" },
}

export default function Page() {
  return (
    <>
      <AnimatedGridBackground />
      <Header />
      <main className="relative z-10 pt-28 pb-24 px-4 sm:px-6 lg:px-8">
        <DetectorShapes seed={88} count={6} intensity={0.4} blur={110} />
        <section className="relative z-10 max-w-4xl mx-auto text-center mb-16">
          <AnimatedSection>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-sm font-medium mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              Transparent pricing
            </div>
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-balance mb-5">
              Free to start.{" "}
              <span className="bg-gradient-to-r from-violet-500 to-cyan-500 bg-clip-text text-transparent">Priced to scale.</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              No setup calls. No proposal theater. Cancel anytime — we don&apos;t play that game.
            </p>
          </AnimatedSection>
        </section>

        <section className="max-w-6xl mx-auto mb-20">
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

        <section className="max-w-3xl mx-auto">
          <div className="rounded-2xl border border-border bg-card p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">Cancel anytime. No credit card to start.</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Free tier has no time limit. Upgrade the second you need more — downgrade anytime.
            </p>
            <Link href="/contact"><Button variant="outline">Questions? Talk to us.</Button></Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
