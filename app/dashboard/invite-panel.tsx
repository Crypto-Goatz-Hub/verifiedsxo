"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Loader2, Send, CheckCircle2, AlertTriangle } from "lucide-react"

export function InvitePanel({ agencyId, agencyName }: { agencyId: string; agencyName: string }) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [company, setCompany] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null); setSuccess(null)
    if (!name.trim() || !email.trim()) { setError("Name and email are required"); return }
    setLoading(true)
    try {
      const res = await fetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agencyId, name: name.trim(), email: email.trim(), company: company.trim() || undefined }),
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j.error || "Invite failed")
      setSuccess(`Invite sent to ${email}. ${j.inviteUrl ? "Link: " + j.inviteUrl : ""}`)
      setName(""); setEmail(""); setCompany("")
      router.refresh()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="rounded-xl border border-border bg-card p-5">
      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
        Invite a client
      </div>
      <div className="space-y-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Client name"
          required
          className="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:border-foreground/30 outline-none text-sm"
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="client@example.com"
          required
          className="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:border-foreground/30 outline-none text-sm"
        />
        <input
          type="text"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="Company (optional)"
          className="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:border-foreground/30 outline-none text-sm"
        />

        {error && (
          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-500">
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-600 break-words">
            <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <Button
          type="submit"
          disabled={loading}
          size="sm"
          className="w-full gap-2 bg-foreground text-background hover:bg-foreground/90"
        >
          {loading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending…</> : <>Send invite <Send className="w-3.5 h-3.5" /></>}
        </Button>
        <p className="text-[10px] text-muted-foreground text-center">
          Invites sent from <span className="font-mono">{agencyName}</span>
        </p>
      </div>
    </form>
  )
}
