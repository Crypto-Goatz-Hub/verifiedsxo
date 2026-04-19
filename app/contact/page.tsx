import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { AnimatedGridBackground } from "@/components/animated-grid-background"
import { ContactForm } from "./contact-form"

export const metadata = {
  title: "Contact | VerifiedSXO",
  description: "Questions, partnerships, or enterprise needs — drop us a line and Mike will reply personally.",
  alternates: { canonical: "https://verifiedsxo.com/contact" },
}

export default function Page() {
  return (
    <>
      <AnimatedGridBackground />
      <Header />
      <main className="relative z-10 pt-28 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl mx-auto">
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
