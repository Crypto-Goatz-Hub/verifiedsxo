import Link from "next/link"

export function Footer() {
  return (
    <footer className="relative border-t border-border py-16 px-4 sm:px-6 lg:px-8 mt-24">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2 mb-4">
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-violet-500 to-cyan-500 bg-clip-text text-transparent">
                VerifiedSXO
              </span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
              The proof layer for marketers. Weigh any stat claim against 25 years
              of data, then prove it with your own analytics. Badge the truth.
            </p>
            <p className="text-xs text-muted-foreground/70 mt-6">
              An SXO Ecosystem product · Built by{" "}
              <a href="https://rocketopp.com" className="hover:text-foreground transition-colors underline underline-offset-2">
                RocketOpp
              </a>
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-4">Product</h4>
            <ul className="space-y-2">
              <li><Link href="/how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">How it works</Link></li>
              <li><Link href="/for-agencies" className="text-sm text-muted-foreground hover:text-foreground transition-colors">For agencies</Link></li>
              <li><Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</Link></li>
              <li><Link href="/#verify" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Verify a claim</Link></li>
              <li><Link href="/badge-examples" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Badge examples</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-4">Company</h4>
            <ul className="space-y-2">
              <li><a href="https://sxowebsite.com" className="text-sm text-muted-foreground hover:text-foreground transition-colors">SXO</a></li>
              <li><a href="https://rocketopp.com" className="text-sm text-muted-foreground hover:text-foreground transition-colors">RocketOpp</a></li>
              <li><Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy</Link></li>
              <li><Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Terms</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border/50 flex flex-col md:flex-row justify-between gap-4 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} RocketOpp LLC. All rights reserved.</span>
          <span>Fighting marketing misinformation since 2026.</span>
        </div>
      </div>
    </footer>
  )
}
