/**
 * POST /api/widget/ask
 * Anonymous claim-scoring for the BS Detector widget.
 *
 * Rate limit: 5 submissions per fingerprint per calendar day (UTC).
 * Fingerprint = vsxo_fp cookie, auto-set on first call.
 * Authenticated users are exempt (unlimited).
 *
 * Body: { claim: string }
 * Response: { score, reasoning, tier, claimType, usage: {used, limit, resets} }
 */

import { NextRequest, NextResponse } from "next/server"
import { randomBytes, createHash } from "node:crypto"
import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabase/server"
import { pingMike } from "@/lib/notify-mike"

export const runtime = "nodejs"
export const maxDuration = 30

const DAILY_LIMIT = 5

function newFingerprint(): string {
  return randomBytes(16).toString("base64url")
}

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10)
}

function hashIp(ip: string): string {
  return createHash("sha256").update(`vsxo:${ip}`).digest("base64url").slice(0, 22)
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const claim: string = typeof body?.claim === "string" ? body.claim.trim() : ""
  if (claim.length < 10) return NextResponse.json({ error: "claim too short" }, { status: 400 })
  if (claim.length > 800) return NextResponse.json({ error: "claim too long" }, { status: 400 })

  // Check authentication — signed-in users skip the rate limit
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  const authenticated = !!user

  // Fingerprint — prefer cookie, fallback to hashed IP
  const existingFp = req.cookies.get("vsxo_fp")?.value
  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "unknown"
  const fp = existingFp || newFingerprint()
  const limitKey = existingFp || hashIp(ip)
  const date = todayUtc()

  let used = 0
  if (!authenticated) {
    const admin = getSupabaseAdmin()
    const { data, error } = await admin.rpc("vsxo_widget_increment", { _fp: limitKey, _date: date })
    if (error) {
      // fail open — don't block on counter errors
      used = 1
    } else {
      used = typeof data === "number" ? data : Number(data) || 1
    }
    if (used > DAILY_LIMIT) {
      return NextResponse.json(
        {
          error: "daily_limit_reached",
          message: `Free tier limit of ${DAILY_LIMIT} plausibility checks per day reached. Sign up for unlimited.`,
          usage: { used: used - 1, limit: DAILY_LIMIT, resets: "midnight UTC" },
        },
        { status: 429 }
      )
    }
  }

  // Call the existing /api/score logic inline so we don't duplicate it
  const origin = new URL(req.url).origin
  let scoreJson: {
    score: number
    reasoning: string[]
    tier: string
    claimType: string
    nextStep: string
  } | null = null
  try {
    const r = await fetch(`${origin}/api/score`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ claim }),
    })
    if (r.ok) scoreJson = await r.json()
  } catch {}
  if (!scoreJson) {
    return NextResponse.json({ error: "scoring_unavailable" }, { status: 502 })
  }

  // Surface usage in a consistent shape
  const usage = {
    used: authenticated ? 0 : used,
    limit: authenticated ? null : DAILY_LIMIT,
    resets: authenticated ? null : "midnight UTC",
  }

  pingMike({
    event: "public.score",
    headline: `Widget score ${scoreJson.score}% (${scoreJson.claimType})`,
    fields: {
      Claim: claim.slice(0, 240),
      Score: scoreJson.score,
      Tier: scoreJson.tier,
      "Daily use": `${used}/${DAILY_LIMIT}`,
      Authenticated: authenticated ? "yes" : "no",
      IP: ip,
    },
  })

  const res = NextResponse.json({
    ...scoreJson,
    usage,
  })

  // Plant the fingerprint cookie if new
  if (!existingFp) {
    res.cookies.set("vsxo_fp", fp, {
      httpOnly: false,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
    })
  }
  return res
}

export async function GET() {
  // Small liveness / quota introspection — useful for client-side gating
  return NextResponse.json({ limit: DAILY_LIMIT, ok: true })
}
