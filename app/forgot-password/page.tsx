"use client"

import { useState } from "react"
import Link from "next/link"
import { getSupabaseBrowser } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { AnimatedGridBackground } from "@/components/animated-grid-background"
import { DetectorShapes } from "@/components/detector-shapes"
import { Loader2, ArrowRight, AlertTriangle, CheckCircle2, Mail } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      return setErr("Enter a valid email")
    }
    setLoading(true)
    try {
      const supabase = getSupabaseBrowser()
      const redirectTo =
        (typeof window !== "undefined" ? window.location.origin : "https://verifiedsxo.com") +
        "/reset-password"
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo })
      if (error) throw new Error(error.message)
      setSent(true)
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <AnimatedGridBackground />
      <Header />
      <main className="relative z-10 pt-32 pb-24 px-4 sm:px-6 lg:px-8">
        <DetectorShapes seed={44} count={5} intensity={0.35} blur={120} />
        <div className="relative z-10 max-w-md mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">Forgot your password?</h1>
            <p className="text-muted-foreground">
              Drop your email — we&apos;ll send a reset link that drops you right back in.
            </p>
          </div>

          {sent ? (
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-8 text-center">
              <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 mb-3" />
              <h2 className="text-lg font-semibold mb-1">Check your inbox</h2>
              <p className="text-sm text-muted-foreground mb-5">
                If an account exists for <span className="font-mono text-foreground">{email}</span>,
                a reset link is on its way. Click the link to set a new password.
              </p>
              <Link href="/login">
                <Button variant="outline" size="sm">Back to sign in</Button>
              </Link>
            </div>
          ) : (
            <form
              onSubmit={onSubmit}
              className="rounded-xl border border-border bg-card p-6 md:p-8 shadow-sm space-y-4"
            >
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-background focus:border-foreground/30 focus:ring-2 focus:ring-foreground/10 outline-none"
                  />
                </div>
              </div>

              {err && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-sm text-rose-500">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{err}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                size="lg"
                className="w-full gap-2 bg-foreground text-background hover:bg-foreground/90"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Sending link…</>
                ) : (
                  <>Send reset link <ArrowRight className="w-4 h-4" /></>
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center pt-1">
                Remember it?{" "}
                <Link href="/login" className="text-foreground hover:underline underline-offset-2">
                  Sign in
                </Link>
              </p>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
