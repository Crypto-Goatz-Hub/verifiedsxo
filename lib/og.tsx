/**
 * Shared Open Graph image helpers.
 *
 * Every route that needs a 1200×630 social card imports renderOgCard() and
 * composes the payload. Visual DNA is locked here so every card matches:
 *
 *   - Black background with violet → cyan diagonal gradient accent
 *   - Soft radial glow (detector-shape style) for depth
 *   - Monochrome grid lines behind content
 *   - Inter-like system fonts (edge runtime can't use google fonts freely)
 *   - Top-left VerifiedSXO wordmark with shield, bottom-right proof meta
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { ImageResponse } from "next/og"
import type React from "react"

export const OG_SIZE = { width: 1200, height: 630 }
export const OG_CONTENT_TYPE = "image/png"
export const OG_RUNTIME = "edge"

type Accent = "violet" | "emerald" | "amber" | "rose" | "cyan"

const ACCENTS: Record<Accent, { from: string; to: string; badge: string; dim: string }> = {
  violet:  { from: "#8b5cf6", to: "#06b6d4", badge: "#8b5cf6", dim: "rgba(139,92,246,0.15)" },
  emerald: { from: "#10b981", to: "#06b6d4", badge: "#10b981", dim: "rgba(16,185,129,0.15)" },
  amber:   { from: "#f59e0b", to: "#f97316", badge: "#f59e0b", dim: "rgba(245,158,11,0.15)" },
  rose:    { from: "#f43f5e", to: "#f97316", badge: "#f43f5e", dim: "rgba(244,63,94,0.15)" },
  cyan:    { from: "#06b6d4", to: "#8b5cf6", badge: "#06b6d4", dim: "rgba(6,182,212,0.15)" },
}

export interface OgCardProps {
  eyebrow?: string           // small kicker — "The Claims Wall", "Verified Agency", etc.
  title: string              // big headline (max ~6 words for legibility)
  subtitle?: string          // 1–2 lines of copy
  accent?: Accent            // color theme — default "violet"
  stats?: { label: string; value: string }[]   // up to 3
  rightTagline?: string      // small bottom-right line
  agencyName?: string        // if this card is for a specific agency
  verifiedBadge?: boolean    // show green verified shield in the top strip
}

/**
 * Central helper — builds an ImageResponse ready to return from an
 * opengraph-image route. Runtime must be "edge".
 */
export async function renderOgCard(props: OgCardProps): Promise<ImageResponse> {
  const accent = ACCENTS[props.accent || "violet"]

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0a0a0a",
          color: "#ffffff",
          fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
          position: "relative",
          padding: "60px 72px",
          overflow: "hidden",
        }}
      >
        {/* Background — gradient diagonal panel */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(135deg, ${accent.from}14 0%, transparent 45%, ${accent.to}14 100%)`,
            display: "flex",
          }}
        />

        {/* Background grid */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        {/* Soft accent orbs */}
        <div
          style={{
            position: "absolute",
            top: -140,
            right: -140,
            width: 520,
            height: 520,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${accent.from}4d 0%, transparent 65%)`,
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -180,
            left: -120,
            width: 480,
            height: 480,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${accent.to}4d 0%, transparent 65%)`,
            display: "flex",
          }}
        />

        {/* Top strip — wordmark + optional verified shield */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 2 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <ShieldMark size={40} color={accent.badge} glowColor={accent.dim} />
            <span style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em" }}>
              VerifiedSXO
            </span>
          </div>
          {props.verifiedBadge && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 16px",
                borderRadius: 999,
                background: "rgba(16,185,129,0.12)",
                border: "1px solid rgba(16,185,129,0.45)",
                color: "#34d399",
                fontSize: 16,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.12em",
              }}
            >
              <ShieldMark size={18} color="#34d399" glowColor="rgba(52,211,153,0.2)" /> Verified Agency
            </div>
          )}
        </div>

        {/* Middle — eyebrow, title, subtitle */}
        <div style={{ display: "flex", flexDirection: "column", zIndex: 2, maxWidth: 1040 }}>
          {props.eyebrow && (
            <div
              style={{
                fontSize: 20,
                fontWeight: 700,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: accent.badge,
                marginBottom: 18,
                display: "flex",
              }}
            >
              {props.eyebrow}
            </div>
          )}
          <div
            style={{
              fontSize: 82,
              fontWeight: 800,
              lineHeight: 1.02,
              letterSpacing: "-0.035em",
              display: "flex",
              flexWrap: "wrap",
              color: "#ffffff",
            }}
          >
            {props.title}
          </div>
          {props.subtitle && (
            <div
              style={{
                marginTop: 22,
                fontSize: 28,
                lineHeight: 1.35,
                color: "rgba(255,255,255,0.75)",
                display: "flex",
                maxWidth: 980,
              }}
            >
              {props.subtitle}
            </div>
          )}
          {props.agencyName && (
            <div
              style={{
                marginTop: 26,
                fontSize: 22,
                fontWeight: 600,
                color: "rgba(255,255,255,0.6)",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              Submitted by <span style={{ color: "#ffffff", fontWeight: 700 }}>{props.agencyName}</span>
            </div>
          )}
        </div>

        {/* Bottom strip — stats + tagline */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            zIndex: 2,
            gap: 24,
          }}
        >
          {props.stats && props.stats.length > 0 ? (
            <div style={{ display: "flex", gap: 24 }}>
              {props.stats.slice(0, 3).map((s) => (
                <div
                  key={s.label}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    padding: "18px 24px",
                    borderRadius: 16,
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    minWidth: 180,
                  }}
                >
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.55)",
                      display: "flex",
                      marginBottom: 6,
                    }}
                  >
                    {s.label}
                  </div>
                  <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.02em", display: "flex" }}>
                    {s.value}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: "flex" }} />
          )}
          <div
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: "rgba(255,255,255,0.55)",
              letterSpacing: "0.02em",
              textAlign: "right",
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
            }}
          >
            <span>verifiedsxo.com</span>
            {props.rightTagline && (
              <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 15, marginTop: 2 }}>
                {props.rightTagline}
              </span>
            )}
          </div>
        </div>

        {/* Accent rail along the bottom */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 6,
            background: `linear-gradient(90deg, ${accent.from} 0%, ${accent.to} 100%)`,
            display: "flex",
          }}
        />
      </div>
    ),
    OG_SIZE,
  )
}

function ShieldMark({ size, color, glowColor }: { size: number; color: string; glowColor: string }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: color,
        boxShadow: `0 0 36px ${glowColor}`,
        color: "#0a0a0a",
      }}
    >
      <svg width={size * 0.58} height={size * 0.58} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    </div>
  )
}
