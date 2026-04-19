"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowser } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Loader2, ArrowRight, AlertTriangle } from "lucide-react"

export function AcceptInviteForm({ token, defaultEmail, defaultName }: { token: string; defaultEmail: string; defaultName: string }) {
  const router = useRouter()
  const [email, setEmail] = useState(defaultEmail)
  const [name, setName] = useState(defaultName)
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < 8) return setError("Password must be 8+ characters")
    setLoading(true)
    try {
      const supabase = getSupabaseBrowser()
      const { data, error: authErr } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      })
      if (authErr) throw new Error(authErr.message)
      if (!data.user) throw new Error("Signup returned no user")

      const res = await fetch("/api/invites/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, name }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || "Accept failed")
      }
      router.push("/client")
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="rounded-xl border border-border bg-card p-6 md:p-8 shadow-sm space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Your name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:border-foreground/30 focus:ring-2 focus:ring-foreground/10 outline-none"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:border-foreground/30 focus:ring-2 focus:ring-foreground/10 outline-none"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Create a password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          placeholder="At least 8 characters"
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
        {loading ? (<><Loader2 className="w-4 h-4 animate-spin" /> Creating account…</>) : (<>Accept & create account <ArrowRight className="w-4 h-4" /></>)}
      </Button>
    </form>
  )
}
