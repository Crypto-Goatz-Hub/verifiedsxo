"use client"

/**
 * Randomized ambient "detector shapes" background.
 *
 * Deterministic per-seed so SSR + client renders match and the shapes
 * don't shift between navigations. Pure decoration — pointer-events off,
 * no interaction, no accessibility tree impact.
 *
 * Drop it into any section:
 *   <section className="relative overflow-hidden">
 *     <DetectorShapes seed={7} />
 *     …
 *   </section>
 */

import { useMemo } from "react"

interface Props {
  seed?: number
  /** How many shapes to scatter. Default 6. */
  count?: number
  /** Overall opacity multiplier (0-1). Default 0.7. */
  intensity?: number
  /** Blur amount for orbs, 0 for sharp. Default 80. */
  blur?: number
  /** Clip to a specific palette; defaults to brand violet/cyan mix. */
  palette?: Array<{ from: string; to: string }>
}

const DEFAULT_PALETTE = [
  { from: "#8b5cf6", to: "#06b6d4" },
  { from: "#06b6d4", to: "#a78bfa" },
  { from: "#a5f3fc", to: "#8b5cf6" },
  { from: "#c4b5fd", to: "#22d3ee" },
]

// Small deterministic PRNG — mulberry32
function rng(seed: number): () => number {
  let t = seed >>> 0
  return () => {
    t = (t + 0x6D2B79F5) >>> 0
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

type ShapeKind = "orb" | "ring" | "arc" | "scan"

export function DetectorShapes({
  seed = 1,
  count = 6,
  intensity = 0.7,
  blur = 80,
  palette = DEFAULT_PALETTE,
}: Props) {
  const shapes = useMemo(() => {
    const r = rng(seed)
    const out: Array<{
      id: number
      kind: ShapeKind
      x: number; y: number
      size: number
      from: string; to: string
      delay: number
      duration: number
      rotate: number
    }> = []
    const kinds: ShapeKind[] = ["orb", "orb", "ring", "ring", "arc", "scan"]
    for (let i = 0; i < count; i++) {
      const kind = kinds[Math.floor(r() * kinds.length)]
      const p = palette[Math.floor(r() * palette.length)]
      out.push({
        id: i,
        kind,
        x: 5 + r() * 90,
        y: 5 + r() * 90,
        size: 120 + r() * 380,
        from: p.from,
        to: p.to,
        delay: r() * 6,
        duration: 8 + r() * 10,
        rotate: r() * 360,
      })
    }
    return out
  }, [seed, count, palette])

  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden"
      aria-hidden
      style={{ opacity: intensity }}
    >
      {shapes.map((s) => {
        const common = {
          position: "absolute" as const,
          left: `${s.x}%`,
          top: `${s.y}%`,
          width: s.size,
          height: s.size,
          transform: `translate(-50%, -50%) rotate(${s.rotate}deg)`,
        }

        if (s.kind === "orb") {
          return (
            <div
              key={s.id}
              style={{
                ...common,
                borderRadius: "50%",
                background: `radial-gradient(circle at 30% 30%, ${s.from}33, ${s.to}11 50%, transparent 70%)`,
                filter: `blur(${blur}px)`,
                animation: `vsxoFloat ${s.duration}s ease-in-out ${s.delay}s infinite`,
              }}
            />
          )
        }

        if (s.kind === "ring") {
          return (
            <svg key={s.id} style={common} viewBox="0 0 200 200">
              <defs>
                <linearGradient id={`ringG-${seed}-${s.id}`} x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor={s.from} stopOpacity="0.8" />
                  <stop offset="100%" stopColor={s.to} stopOpacity="0.2" />
                </linearGradient>
              </defs>
              <circle cx="100" cy="100" r="90" fill="none" stroke={`url(#ringG-${seed}-${s.id})`} strokeWidth="1" strokeOpacity="0.45">
                <animate attributeName="r" values="30;90;30" dur={`${s.duration}s`} begin={`${s.delay}s`} repeatCount="indefinite" />
                <animate attributeName="stroke-opacity" values="0.5;0.05;0.5" dur={`${s.duration}s`} begin={`${s.delay}s`} repeatCount="indefinite" />
              </circle>
              <circle cx="100" cy="100" r="60" fill="none" stroke={`url(#ringG-${seed}-${s.id})`} strokeWidth="1" strokeOpacity="0.25">
                <animate attributeName="r" values="20;60;20" dur={`${s.duration * 1.3}s`} begin={`${s.delay}s`} repeatCount="indefinite" />
              </circle>
            </svg>
          )
        }

        if (s.kind === "arc") {
          return (
            <svg key={s.id} style={common} viewBox="0 0 200 200">
              <defs>
                <linearGradient id={`arcG-${seed}-${s.id}`} x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor={s.from} stopOpacity="0.55" />
                  <stop offset="100%" stopColor={s.to} stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M 30 170 A 80 80 0 0 1 170 170" fill="none" stroke={`url(#arcG-${seed}-${s.id})`} strokeWidth="1.5">
                <animate attributeName="stroke-opacity" values="0.8;0.2;0.8" dur={`${s.duration}s`} begin={`${s.delay}s`} repeatCount="indefinite" />
              </path>
              <path d="M 50 160 A 60 60 0 0 1 150 160" fill="none" stroke={`url(#arcG-${seed}-${s.id})`} strokeWidth="1">
                <animate attributeName="stroke-opacity" values="0.6;0.1;0.6" dur={`${s.duration * 1.4}s`} begin={`${s.delay + 0.8}s`} repeatCount="indefinite" />
              </path>
            </svg>
          )
        }

        // scan
        return (
          <svg key={s.id} style={common} viewBox="0 0 200 200">
            <defs>
              <linearGradient id={`scanG-${seed}-${s.id}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={s.from} stopOpacity="0" />
                <stop offset="50%" stopColor={s.from} stopOpacity="0.4" />
                <stop offset="100%" stopColor={s.to} stopOpacity="0" />
              </linearGradient>
            </defs>
            <rect x="0" y="98" width="200" height="4" fill={`url(#scanG-${seed}-${s.id})`}>
              <animate attributeName="y" values="20;180;20" dur={`${s.duration * 1.2}s`} begin={`${s.delay}s`} repeatCount="indefinite" />
            </rect>
          </svg>
        )
      })}
      <style jsx>{`
        @keyframes vsxoFloat {
          0%, 100% { transform: translate(-50%, -50%) rotate(${0}deg) translateY(0px); }
          50%      { transform: translate(-50%, -52%); }
        }
      `}</style>
    </div>
  )
}
