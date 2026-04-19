"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import { useState } from "react"

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-xl border-b border-border/50 transition-all duration-300">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-violet-500 to-cyan-500 bg-clip-text text-transparent">
              VerifiedSXO
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-all duration-200 hover:translate-y-[-1px]">
              How it works
            </Link>
            <Link href="/for-agencies" className="text-sm text-muted-foreground hover:text-foreground transition-all duration-200 hover:translate-y-[-1px]">
              For agencies
            </Link>
            <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-all duration-200 hover:translate-y-[-1px]">
              Pricing
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-all duration-200">
              Sign in
            </Link>
            <Link href="/#verify">
              <Button size="sm">Verify a claim</Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/50 animate-fade-in-down">
            <div className="flex flex-col gap-4">
              <Link href="/how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors" onClick={() => setMobileMenuOpen(false)}>
                How it works
              </Link>
              <Link href="/for-agencies" className="text-sm text-muted-foreground hover:text-foreground transition-colors" onClick={() => setMobileMenuOpen(false)}>
                For agencies
              </Link>
              <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors" onClick={() => setMobileMenuOpen(false)}>
                Pricing
              </Link>
              <div className="flex flex-col gap-2 pt-4 border-t border-border/50">
                <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors py-2" onClick={() => setMobileMenuOpen(false)}>
                  Sign in
                </Link>
                <Link href="/#verify" onClick={() => setMobileMenuOpen(false)}>
                  <Button size="sm" className="w-full">Verify a claim</Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}
