"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { MessageCircle, X, Send, Loader2, ShieldCheck, AlertTriangle, Sparkles } from "lucide-react"

interface WidgetMsg {
  id: string
  role: "user" | "assistant"
  text: string
  score?: number
  reasoning?: string[]
  tier?: string
  claimType?: string
}

export function BsChatWidget() {
  const [open, setOpen] = useState(false)
  const [claim, setClaim] = useState("")
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState<WidgetMsg[]>([])
  const [usage, setUsage] = useState<{ used: number; limit: number | null } | null>(null)
  const [limitHit, setLimitHit] = useState(false)
  const scrollRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 999999, behavior: "smooth" })
  }, [messages, loading])

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        id: "welcome",
        role: "assistant",
        text: "Paste any marketing claim you've seen — I'll score how likely it is to be true. 5 free checks per day.",
      }])
    }
  }, [open, messages.length])

  async function send() {
    const text = claim.trim()
    if (text.length < 10 || loading) return
    setClaim("")
    const uMsg: WidgetMsg = { id: `u${Date.now()}`, role: "user", text }
    setMessages((m) => [...m, uMsg])
    setLoading(true)
    try {
      const r = await fetch("/api/widget/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claim: text }),
      })
      const j = await r.json()
      if (!r.ok) {
        if (r.status === 429) {
          setLimitHit(true)
          setMessages((m) => [...m, {
            id: `a${Date.now()}`,
            role: "assistant",
            text: j.message || "You've hit your 5 free checks for today. Sign up for unlimited.",
          }])
          if (j.usage) setUsage({ used: j.usage.used, limit: j.usage.limit })
        } else {
          setMessages((m) => [...m, { id: `a${Date.now()}`, role: "assistant", text: j.error || "Something went sideways. Try again?" }])
        }
        return
      }
      setMessages((m) => [...m, {
        id: `a${Date.now()}`,
        role: "assistant",
        text: "",
        score: j.score,
        reasoning: j.reasoning || [],
        tier: j.tier,
        claimType: j.claimType,
      }])
      if (j.usage) setUsage({ used: j.usage.used, limit: j.usage.limit })
    } catch {
      setMessages((m) => [...m, { id: `a${Date.now()}`, role: "assistant", text: "Network hiccup. Try again." }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close BS detector" : "Open BS detector"}
        className={`fixed bottom-5 right-5 z-[90] w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all ${
          open
            ? "bg-background text-foreground border border-border"
            : "bg-gradient-to-br from-violet-500 to-cyan-500 text-white hover:scale-105 active:scale-95"
        }`}
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        {!open && (
          <>
            <span className="absolute inset-0 rounded-full border-2 border-violet-500/50 animate-ping" />
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-rose-500 border-2 border-background" />
          </>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-5 z-[89] w-[calc(100vw-2.5rem)] sm:w-[380px] max-h-[72vh] rounded-2xl border border-border bg-background shadow-2xl overflow-hidden flex flex-col animate-fade-in-up">
          <header className="px-4 py-3 border-b border-border bg-gradient-to-r from-violet-500/10 to-cyan-500/10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="font-semibold text-sm">BS Detector</div>
                <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live · VerifiedSXO AI
                </div>
              </div>
              <div className="ml-auto text-[10px] text-muted-foreground">
                {usage && usage.limit ? `${usage.used}/${usage.limit} today` : "5 free/day"}
              </div>
            </div>
          </header>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((m) => <Message key={m.id} msg={m} />)}
            {loading && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground pl-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Scanning claim against 25y corpus…
              </div>
            )}
            {limitHit && (
              <div className="text-xs p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-500">
                <AlertTriangle className="inline w-3.5 h-3.5 mr-1" />
                Limit reached.{" "}
                <Link href="/signup" className="underline font-semibold">Sign up free</Link>{" "}
                for unlimited checks.
              </div>
            )}
          </div>

          <div className="p-3 border-t border-border bg-background">
            <div className="relative">
              <textarea
                value={claim}
                onChange={(e) => setClaim(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send() }
                }}
                placeholder="Paste any claim — e.g. &quot;I closed $1M in Q1 from cold DMs&quot;"
                disabled={loading || limitHit}
                rows={2}
                className="w-full pr-10 pl-3 py-2 rounded-lg border border-border bg-background focus:border-violet-500/50 outline-none text-sm resize-none"
              />
              <button
                onClick={send}
                disabled={loading || limitHit || claim.trim().length < 10}
                aria-label="Send"
                className="absolute right-2 bottom-2 w-7 h-7 rounded-md bg-foreground text-background flex items-center justify-center disabled:opacity-40 hover:bg-foreground/90"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Verify for real with your data — <Link href="/signup" className="underline ml-1">sign up</Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function Message({ msg }: { msg: WidgetMsg }) {
  if (msg.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] px-3 py-2 rounded-2xl rounded-tr-sm bg-foreground text-background text-sm">
          {msg.text}
        </div>
      </div>
    )
  }
  return (
    <div className="max-w-[90%]">
      {msg.text && (
        <div className="px-3 py-2 rounded-2xl rounded-tl-sm bg-secondary text-secondary-foreground text-sm">
          {msg.text}
        </div>
      )}
      {typeof msg.score === "number" && (
        <div className="mt-2 rounded-xl border border-border bg-card p-3 text-xs">
          <div className="flex items-center gap-3 mb-2">
            <div className={`text-3xl font-bold ${msg.score >= 75 ? "text-emerald-500" : msg.score >= 50 ? "text-cyan-500" : msg.score >= 25 ? "text-orange-500" : "text-rose-500"}`}>
              {msg.score}%
            </div>
            <div>
              <div className="font-semibold">
                {msg.score >= 75 ? "Probably true" : msg.score >= 50 ? "Plausible" : msg.score >= 25 ? "Unlikely" : "Strong BS"}
              </div>
              <div className="text-[10px] text-muted-foreground font-mono">
                {msg.claimType} · {msg.tier}
              </div>
            </div>
          </div>
          <ul className="space-y-1 text-[11px] text-muted-foreground">
            {(msg.reasoning || []).map((r, i) => (
              <li key={i} className="flex gap-1.5"><span className="font-mono">0{i + 1}</span><span>{r}</span></li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
