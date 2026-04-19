"use client"

/**
 * /reset-password
 *
 * Lands here from the email link Supabase sends. The auth token arrives
 * either via URL hash (#access_token=…) for legacy flows OR as a `code`
 * query param for the new PKCE flow. getSupabaseBrowser().auth has an
 * onAuthStateChange listener that picks up the session automatically,
 * so by the time the form submits, updateUser() can write the new
 * password against the recovery session.
 */

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { getSupabaseBrowser } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { AnimatedGridBackground } from "@/components/animated-grid-background"
import { DetectorShapes } from "@/components/detector-shapes"
import { Loader2, ArrowRight, AlertTriangle, CheckCircle2, Lock } from "lucide-react"

export default function ResetPasswordPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [sessionError, setSessionError] = useState<string | null>(null)
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const supabase = getSupabaseBrowser()

    // If the URL contains ?code=…, exchange it for a session (PKCE flow)
    const url = new URL(window.location.href)
    const code = url.searchParams.get("code")

    async function bootstrap() {
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) {
          setSessionError("Reset link is invalid or expired. Request a new one.")
          setReady(true)
          return
        }
      }
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setSessionError("No active reset session. Open the link from your email on this device/browser.")
      }
      setReady(true)
    }

    bootstrap()
  }, [])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    if (password.length < 8) return setErr("At least 8 characters.")
    if (password !== confirm) return setErr("Passwords don't match.")
    setLoading(true)
    try {
      const supabase = getSupabaseBrowser()
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw new Error(error.message)
      setDone(true)
      setTimeout(() => router.push("/dashboard"), 1500)
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
        <DetectorShapes seed={45} count={5} intensity={0.35} blur={120} />
        <div className="relative z-10 max-w-md mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">Set a new password</h1>
            <p className="text-muted-foreground">Pick something strong. You&apos;ll be signed in right after.</p>
          </div>

          {!ready ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
              Loading your reset session…
            </div>
          ) : done ? (
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-8 text-center">
              <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 mb-3" />
              <h2 className="text-lg font-semibold mb-1">Password updated</h2>
              <p className="text-sm text-muted-foreground">Sending you to your dashboard…</p>
            </div>
          ) : sessionError ? (
            <div className="rounded-xl border border-rose-500/40 bg-rose-500/5 p-6 space-y-4">
              <div className="flex items-start gap-2 text-sm text-rose-500">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{sessionError}</span>
              </div>
              <Link href="/forgot-password">
                <Button size="sm" variant="outline" className="w-full">Request a new link</Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="rounded-xl border border-border bg-card p-6 md:p-8 shadow-sm space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">New password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    placeholder="At least 8 characters"
                    autoFocus
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-background focus:border-foreground/30 focus:ring-2 focus:ring-foreground/10 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Confirm password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    minLength={8}
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

              <Button type="submit" disabled={loading} size="lg" className="w-full gap-2 bg-foreground text-background hover:bg-foreground/90">
                {loading ? (<><Loader2 className="w-4 h-4 animate-spin" /> Updating…</>) : (<>Update password <ArrowRight className="w-4 h-4" /></>)}
              </Button>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
