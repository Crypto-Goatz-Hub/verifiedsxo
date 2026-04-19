"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, Send, CheckCircle2, AlertTriangle } from "lucide-react"

export function ContactForm() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [company, setCompany] = useState("")
  const [topic, setTopic] = useState("general")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    if (!name.trim() || !email.trim() || !message.trim()) return setErr("Name, email, and message are required")
    setLoading(true)
    try {
      const r = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), company: company.trim(), topic, message: message.trim() }),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || "Submission failed")
      setDone(true)
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "error")
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-8 text-center">
        <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 mb-3" />
        <h2 className="text-lg font-semibold mb-1">Got it, {name.split(" ")[0] || "friend"}.</h2>
        <p className="text-sm text-muted-foreground">
          Mike reads every message personally. Expect a reply within 24 hours (usually much sooner).
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="rounded-xl border border-border bg-card p-6 md:p-8 shadow-sm space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
            className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:border-foreground/30 outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
            className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:border-foreground/30 outline-none" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Company <span className="text-muted-foreground font-normal">(optional)</span></label>
          <input type="text" value={company} onChange={(e) => setCompany(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:border-foreground/30 outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Topic</label>
          <select value={topic} onChange={(e) => setTopic(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:border-foreground/30 outline-none">
            <option value="general">General question</option>
            <option value="agency">Agency partnership</option>
            <option value="enterprise">Enterprise / white-label</option>
            <option value="press">Press / media</option>
            <option value="bug">Bug / feedback</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Message</label>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} required rows={6}
          placeholder="What's on your mind?"
          className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:border-foreground/30 outline-none resize-y" />
      </div>
      {err && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-sm text-rose-500">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{err}</span>
        </div>
      )}
      <Button type="submit" disabled={loading} size="lg" className="w-full gap-2 bg-foreground text-background hover:bg-foreground/90">
        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</> : <>Send message <Send className="w-4 h-4" /></>}
      </Button>
    </form>
  )
}
