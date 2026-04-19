"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowser } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { AnimatedGridBackground } from "@/components/animated-grid-background"
import { Loader2, ArrowRight, AlertTriangle } from "lucide-react"
import Link from "next/link"

export default function SignupPage() {
  const router = useRouter()
  const [agencyName, setAgencyName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (agencyName.trim().length < 2) return setError("Agency name too short")
    if (password.length < 8) return setError("Password must be 8+ characters")
    setLoading(true)
    try {
      const supabase = getSupabaseBrowser()
      const { data, error: authErr } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { agency_name: agencyName.trim() } },
      })
      if (authErr) throw new Error(authErr.message)
      if (!data.user) throw new Error("Signup returned no user")

      const res = await fetch("/api/agencies/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: agencyName.trim() }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || "Agency creation failed")
      }
      router.push("/dashboard")
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Signup failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <AnimatedGridBackground />
      <Header />
      <main className="relative z-10 pt-32 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
              Start your agency account
            </h1>
            <p className="text-muted-foreground">
              Invite clients, verify their stats, grow your reputation.
            </p>
          </div>

          <form
            onSubmit={onSubmit}
            className="rounded-xl border border-border bg-card p-6 md:p-8 shadow-sm space-y-4"
          >
            <div>
              <label className="block text-sm font-medium mb-2">Agency name</label>
              <input
                type="text"
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
                placeholder="Acme Growth Partners"
                required
                className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:border-foreground/30 focus:ring-2 focus:ring-foreground/10 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Work email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@agency.com"
                required
                className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:border-foreground/30 focus:ring-2 focus:ring-foreground/10 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
                minLength={8}
                className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:border-foreground/30 focus:ring-2 focus:ring-foreground/10 outline-none"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-sm text-rose-500">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              size="lg"
              className="w-full gap-2 bg-foreground text-background hover:bg-foreground/90"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</>
              ) : (
                <>Create agency account <ArrowRight className="w-4 h-4" /></>
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Already have an account?{" "}
              <Link href="/login" className="text-foreground hover:underline underline-offset-2">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </main>
      <Footer />
    </>
  )
}
