"use client"

/**
 * BS Scanner — the headline widget.
 * An animated, interactive SVG "radar" that reacts to typing + reveals
 * a plausibility score after the claim is scored.
 */

import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, Loader2, Sparkles, ShieldCheck, XCircle, AlertTriangle } from "lucide-react"
import Link from "next/link"

interface ScoreResp {
  score: number
  reasoning: string[]
  tier: "agent" | "groq" | "fallback"
  claimType: string
  usage?: { used: number; limit: number | null; resets: string | null }
}

function scoreTone(score: number) {
  if (score >= 75) return { label: "Probably true", cls: "text-emerald-500", ring: "stroke-emerald-500" }
  if (score >= 50) return { label: "Plausible", cls: "text-cyan-500", ring: "stroke-cyan-500" }
  if (score >= 25) return { label: "Unlikely", cls: "text-orange-500", ring: "stroke-orange-500" }
  return { label: "Strong BS signal", cls: "text-rose-500", ring: "stroke-rose-500" }
}

export function BsScanner() {
  const [claim, setClaim] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ScoreResp | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement | null>(null)

  // Speed up radar when user is typing or focused
  const animIntensity = focused || claim.length > 0 ? 1 : 0.4

  const tone = result ? scoreTone(result.score) : null

  async function submit() {
    if (claim.trim().length < 10) { setErr("Give us a full sentence at least."); return }
    setErr(null); setLoading(true); setResult(null)
    try {
      const r = await fetch("/api/widget/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claim: claim.trim() }),
      })
      const j = await r.json()
      if (!r.ok) {
        if (r.status === 429) {
          setErr(j.message || "Daily limit reached — sign up for unlimited.")
        } else {
          setErr(j.error || "Couldn't score that — try again.")
        }
        if (j.usage) setResult({ score: -1, reasoning: [], tier: "fallback", claimType: "", usage: j.usage })
        return
      }
      setResult(j)
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Network error")
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setResult(null); setClaim(""); setErr(null)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  return (
    <div className="relative max-w-3xl mx-auto">
      <Radar score={result?.score} loading={loading} intensity={animIntensity} />

      <div className="relative mt-[-40px] md:mt-[-60px] z-10">
        <div className="text-center mb-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            BS Detector · Free for 5/day
          </div>
          <h2 className="text-2xl md:text-4xl font-bold tracking-tight text-balance">
            Wondering if that marketing claim is{" "}
            <span className="bg-gradient-to-r from-violet-500 to-cyan-500 bg-clip-text text-transparent">
              Bullsh*t?
            </span>
          </h2>
          <p className="text-muted-foreground mt-2 text-sm md:text-base">
            Paste it right here and let&apos;s take a look.
          </p>
        </div>

        <div className={`rounded-2xl border bg-card/80 backdrop-blur-xl p-4 md:p-5 shadow-lg transition-colors ${focused || claim ? "border-violet-500/40 shadow-violet-500/10" : "border-border"}`}>
          <textarea
            ref={inputRef}
            value={claim}
            onChange={(e) => setClaim(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={'e.g. "We built 5 SaaS apps last week and made $100K in revenue."'}
            disabled={loading}
            className="w-full min-h-[96px] bg-transparent outline-none resize-none text-base placeholder:text-muted-foreground/60"
          />
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-border/60">
            <div className="text-[11px] text-muted-foreground">
              {result?.usage && !loading && result.score >= 0 && result.usage.limit && (
                <span>{result.usage.used}/{result.usage.limit} free checks today</span>
              )}
              {!result && (
                <span>Powered by the VerifiedSXO AI · 25y marketing corpus</span>
              )}
            </div>
            {result && result.score >= 0 ? (
              <Button size="sm" variant="outline" onClick={reset}>Check another →</Button>
            ) : (
              <Button
                onClick={submit}
                disabled={loading || claim.trim().length < 10}
                size="lg"
                className="gap-2 bg-foreground text-background hover:bg-foreground/90"
              >
                {loading ? (<><Loader2 className="w-4 h-4 animate-spin" /> Scanning…</>) : (<>Check plausibility <ArrowRight className="w-4 h-4" /></>)}
              </Button>
            )}
          </div>
        </div>

        {err && (
          <div className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-sm text-rose-500">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{err} {err?.includes("limit") && <Link href="/signup" className="underline font-semibold">Sign up</Link>}</span>
          </div>
        )}

        {result && result.score >= 0 && tone && (
          <div className="mt-6 rounded-2xl border border-border bg-card p-5 md:p-6 animate-fade-in-up">
            <div className="flex items-center gap-4 mb-4">
              <div className={`text-5xl font-bold ${tone.cls}`}>{result.score}%</div>
              <div className="flex-1">
                <div className={`font-semibold ${tone.cls}`}>
                  {result.score >= 75 ? <ShieldCheck className="inline w-4 h-4 mr-1" /> : result.score < 25 ? <XCircle className="inline w-4 h-4 mr-1" /> : <Sparkles className="inline w-4 h-4 mr-1" />}
                  {tone.label}
                </div>
                <div className="text-xs text-muted-foreground">
                  Claim type: <span className="font-mono">{result.claimType}</span> · Scored by <span className="font-mono">{result.tier}</span>
                </div>
              </div>
            </div>
            <ul className="space-y-2 text-sm">
              {result.reasoning.map((r, i) => (
                <li key={i} className="flex gap-2.5 text-muted-foreground">
                  <span className="text-foreground/60 font-mono text-xs pt-0.5">0{i + 1}</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
            {result.score < 75 && (
              <div className="mt-4 pt-4 border-t border-border flex items-center justify-between gap-3 flex-wrap">
                <div className="text-sm text-muted-foreground">Disagree? Prove it with your own data.</div>
                <Link href="/signup">
                  <Button size="sm" className="bg-gradient-to-r from-violet-500 to-cyan-500 text-white hover:opacity-90">
                    Prove this claim →
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/** Animated radar — pure SVG + CSS. Reveals the score when provided. */
function Radar({ score, loading, intensity }: { score?: number; loading: boolean; intensity: number }) {
  // Needle angle: 0 at -90deg (left), 100 at +90deg (right)
  const angle = typeof score === "number" && score >= 0
    ? -90 + (score / 100) * 180
    : -70 + Math.sin(Date.now() / 1000) * 40

  const [, force] = useState(0)
  useEffect(() => {
    if (typeof score === "number" && score >= 0) return
    const iv = setInterval(() => force((x) => (x + 1) % 60), 60)
    return () => clearInterval(iv)
  }, [score])

  const dur = 3 / Math.max(0.3, intensity)

  const ringColor = useMemo(() => {
    if (typeof score !== "number" || score < 0) return "rgba(139,92,246,0.55)"
    if (score >= 75) return "rgba(16,185,129,0.8)"
    if (score >= 50) return "rgba(6,182,212,0.8)"
    if (score >= 25) return "rgba(249,115,22,0.8)"
    return "rgba(244,63,94,0.8)"
  }, [score])

  return (
    <div className="relative w-full h-[220px] md:h-[280px] pointer-events-none overflow-hidden">
      <svg
        viewBox="0 0 600 280"
        className="absolute inset-0 w-full h-full"
        aria-hidden
      >
        <defs>
          <radialGradient id="radarBg" cx="50%" cy="100%" r="70%">
            <stop offset="0%" stopColor="rgba(139,92,246,0.15)" />
            <stop offset="50%" stopColor="rgba(6,182,212,0.08)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <linearGradient id="needleGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Backdrop */}
        <rect x="0" y="0" width="600" height="280" fill="url(#radarBg)" />

        {/* Radar arc rings */}
        {[70, 115, 160, 205].map((r, i) => (
          <path
            key={r}
            d={`M ${300 - r} 260 A ${r} ${r} 0 0 1 ${300 + r} 260`}
            fill="none"
            stroke={ringColor}
            strokeOpacity={0.14 + i * 0.04}
            strokeWidth={1}
          />
        ))}

        {/* Scale ticks (0-100) */}
        {Array.from({ length: 11 }).map((_, i) => {
          const a = (-90 + i * 18) * (Math.PI / 180)
          const r1 = 200, r2 = 210
          const x1 = 300 + Math.cos(a) * r1
          const y1 = 260 + Math.sin(a) * r1
          const x2 = 300 + Math.cos(a) * r2
          const y2 = 260 + Math.sin(a) * r2
          return (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="currentColor" strokeOpacity={i % 5 === 0 ? 0.5 : 0.2} strokeWidth={i % 5 === 0 ? 2 : 1} />
          )
        })}

        {/* Scanning sweep */}
        <g transform={`rotate(${loading ? -90 + ((Date.now() / 20) % 180) : -90}, 300, 260)`} style={{ transformOrigin: "300px 260px" }}>
          <path
            d="M 300 260 L 300 55 A 205 205 0 0 1 505 260 Z"
            fill="url(#needleGrad)"
            fillOpacity={loading ? 0.18 : 0}
            style={{ transition: "fill-opacity 300ms ease" }}
          />
        </g>

        {/* Animated sonar pulse (always-on ambient) */}
        <circle cx="300" cy="260" r="18" fill="none" stroke={ringColor} strokeOpacity="0.45" strokeWidth="1.5">
          <animate attributeName="r" from="18" to="200" dur={`${dur}s`} repeatCount="indefinite" />
          <animate attributeName="stroke-opacity" from="0.45" to="0" dur={`${dur}s`} repeatCount="indefinite" />
        </circle>
        <circle cx="300" cy="260" r="18" fill="none" stroke={ringColor} strokeOpacity="0.45" strokeWidth="1.5">
          <animate attributeName="r" from="18" to="200" dur={`${dur}s`} begin={`${dur / 2}s`} repeatCount="indefinite" />
          <animate attributeName="stroke-opacity" from="0.45" to="0" dur={`${dur}s`} begin={`${dur / 2}s`} repeatCount="indefinite" />
        </circle>

        {/* Needle */}
        <g transform={`rotate(${angle}, 300, 260)`} style={{ transition: "transform 900ms cubic-bezier(0.34, 1.56, 0.64, 1)", filter: "url(#glow)" }}>
          <line x1="300" y1="260" x2="300" y2="80" stroke="url(#needleGrad)" strokeWidth="3" strokeLinecap="round" />
          <circle cx="300" cy="80" r="5" fill={ringColor} />
        </g>

        {/* Center orb */}
        <circle cx="300" cy="260" r="12" fill="url(#needleGrad)" filter="url(#glow)" />
        <circle cx="300" cy="260" r="6" fill="#fff" />

        {/* Labels */}
        <text x="95" y="275" fontSize="10" fontFamily="monospace" fill="currentColor" fillOpacity="0.5">BS</text>
        <text x="295" y="48" fontSize="10" fontFamily="monospace" fill="currentColor" fillOpacity="0.5" textAnchor="middle">50</text>
        <text x="505" y="275" fontSize="10" fontFamily="monospace" fill="currentColor" fillOpacity="0.5" textAnchor="end">TRUE</text>
      </svg>
    </div>
  )
}
