import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { AnimatedGridBackground } from "@/components/animated-grid-background"
import { AnimatedSection } from "@/components/animated-section"
import { DetectorShapes } from "@/components/detector-shapes"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight, ShieldCheck, Users, Gift, TrendingUp, Mail, Rocket } from "lucide-react"

export const metadata = {
  title: "For agencies — turn every win into a verified case study",
  description:
    "Invite a client. Verify their stat with live analytics. Earn a badge tied to a public agency profile — shareable, embeddable, unforgeable.",
  alternates: { canonical: "https://verifiedsxo.com/for-agencies" },
  openGraph: {
    title: "Your case studies, on the record.",
    description:
      "Automated reputation compounding: invite tracking, verified badges, LinkedIn-ready proof — all tied to a public agency profile.",
    url: "https://verifiedsxo.com/for-agencies",
    siteName: "VerifiedSXO",
    type: "website",
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "VerifiedSXO for agencies",
    description: "Every client win → a public, verifiable proof. Automated.",
  },
}

export default function Page() {
  return (
    <>
      <AnimatedGridBackground />
      <Header />
      <main className="relative z-10 pt-28 pb-24 px-4 sm:px-6 lg:px-8">
        <DetectorShapes seed={55} count={6} intensity={0.45} blur={110} palette={[{ from: "#06b6d4", to: "#8b5cf6" }, { from: "#22d3ee", to: "#a78bfa" }]} />
        <section className="relative z-10 max-w-4xl mx-auto text-center mb-20">
          <AnimatedSection>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-sm font-medium mb-6">
              <Rocket className="w-3.5 h-3.5" />
              Built for agencies
            </div>
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-balance mb-5">
              Turn every client win into{" "}
              <span className="bg-gradient-to-r from-violet-500 to-cyan-500 bg-clip-text text-transparent">a verified case study</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Invite your clients. Assign them free incentives. Auto-trigger review sequences the moment a claim is verified. Your reputation compounds — on autopilot.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/signup"><Button size="lg" className="gap-2 bg-foreground text-background hover:bg-foreground/90">Start free <ArrowRight className="w-4 h-4" /></Button></Link>
              <Link href="/pricing"><Button size="lg" variant="outline">See pricing</Button></Link>
            </div>
          </AnimatedSection>
        </section>

        <section className="max-w-5xl mx-auto mb-24">
          <AnimatedSection>
            <div className="text-center mb-10">
              <div className="text-sm text-muted-foreground uppercase tracking-wider mb-3">What you get</div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Four compounding loops, one dashboard</h2>
            </div>
          </AnimatedSection>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              { icon: Users, title: "Unlimited client invites", body: "Send branded invites from your agency — we handle deliverability, tracking, status, and re-invites. Client joins under your agency with one click." },
              { icon: Gift, title: "Incentive bank (coming in v2)", body: "A curated library of templates, checklists, and tools. Assign one to a new client as a free gift — they redeem, you track conversion. Drives invite acceptance through the roof." },
              { icon: ShieldCheck, title: "Per-client verifications", body: "Each client connects their own Search Console / Analytics. You manage the relationship; we handle the proof. Every verified claim becomes your case study too." },
              { icon: Mail, title: "Automated review flow (coming in v3)", body: "The moment a claim is verified, a CRM workflow fires: asks your client's customers for a stat-tied testimonial. You approve. Reviews appear on the verification page + inside the embed tooltip." },
            ].map((c, i) => (
              <AnimatedSection key={c.title} delay={i * 80}>
                <div className="p-6 md:p-8 rounded-xl border border-border bg-card h-full">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500/15 to-cyan-500/15 flex items-center justify-center mb-4">
                    <c.icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{c.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{c.body}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </section>

        <section className="max-w-4xl mx-auto mb-24">
          <AnimatedSection>
            <div className="text-center mb-10">
              <div className="text-sm text-muted-foreground uppercase tracking-wider mb-3">The agency flywheel</div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">How one verified client compounds</h2>
            </div>
          </AnimatedSection>
          <div className="rounded-2xl border border-border bg-card p-8 md:p-12">
            <ol className="space-y-6">
              {[
                { k: "Month 0", v: "You sign up + invite your first 3 clients. Each gets a free incentive on accept." },
                { k: "Month 1", v: "Your clients start verifying claims — \"we rank #1 for X,\" \"we drive 40K monthly clicks.\" Badges go live on their sites." },
                { k: "Month 2", v: "Every visit to a client's site now shows a badge pointing back to a VerifiedSXO case study — with your agency credited as the one who ran the audit." },
                { k: "Month 3", v: "Automated review flow kicks in. Your verified clients get structured testimonials. Your case-study library grows without you writing a word." },
                { k: "Month 6", v: "Prospective clients Google your name and find a portfolio of independently-verified wins instead of generic case-study PDFs." },
              ].map((row) => (
                <li key={row.k} className="grid grid-cols-[100px_1fr] gap-4">
                  <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground pt-1">{row.k}</div>
                  <div className="text-sm leading-relaxed">{row.v}</div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="max-w-5xl mx-auto mb-24">
          <AnimatedSection>
            <div className="text-center mb-10">
              <div className="text-sm text-muted-foreground uppercase tracking-wider mb-3">Why agencies win</div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Prove you&apos;re different. Measurably.</h2>
            </div>
          </AnimatedSection>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { k: "Closes faster", v: "Prospects don't want slide decks. They want proof. Walking into the pitch with 8 verified-stat badges ends the objection cycle." },
              { k: "Retains longer", v: "Clients who see their own win publicly memorialized — with your agency tag on it — churn 30-50% less." },
              { k: "Priced higher", v: "Agencies that can prove their work quantitatively command 20–40% premium over peers that can't." },
            ].map((c) => (
              <div key={c.k} className="p-6 rounded-xl border border-border bg-card">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-foreground" />
                  <span className="text-sm font-semibold">{c.k}</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{c.v}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-3xl mx-auto text-center">
          <div className="rounded-2xl border border-border bg-card p-10 md:p-14">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">Spin up your agency account</h2>
            <p className="text-muted-foreground mb-8">Free to start. Upgrade only when you invite more than one client.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/signup"><Button size="lg" className="gap-2 bg-foreground text-background hover:bg-foreground/90">Start free <ArrowRight className="w-4 h-4" /></Button></Link>
              <Link href="/contact"><Button size="lg" variant="outline">Talk to us</Button></Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
