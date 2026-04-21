import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { AnimatedGridBackground } from "@/components/animated-grid-background"
import { DetectorShapes } from "@/components/detector-shapes"
import { ContactForm } from "./contact-form"

export const metadata = {
  title: "Contact — talk to the team behind the badge",
  description: "Questions, partnerships, enterprise needs — drop us a line. We read every message and reply within one business day.",
  alternates: { canonical: "https://verifiedsxo.com/contact" },
  openGraph: {
    title: "Talk to the team behind the badge.",
    description: "Direct line to VerifiedSXO. Partnerships, integrations, or just a hello.",
    url: "https://verifiedsxo.com/contact",
    siteName: "VerifiedSXO",
    type: "website",
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "Contact VerifiedSXO",
    description: "Direct line — we reply within one business day.",
  },
}

export default function Page() {
  return (
    <>
      <AnimatedGridBackground />
      <Header />
      <main className="relative z-10 pt-28 pb-24 px-4 sm:px-6 lg:px-8">
        <DetectorShapes seed={17} count={5} intensity={0.4} blur={120} />
        <div className="relative z-10 max-w-xl mx-auto">
          <div className="text-center mb-10">
            <div className="text-sm text-muted-foreground uppercase tracking-wider mb-2">Contact</div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">Talk to us</h1>
            <p className="text-muted-foreground">
              Partnerships, enterprise, or just curious — drop a note. We read everything.
            </p>
          </div>
          <ContactForm />
        </div>
      </main>
      <Footer />
    </>
  )
}
