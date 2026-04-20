/**
 * POST /api/k/verify — the Verify Engine, exposed as a 0nMCP K-layer add0n.
 *
 * Auth:
 *   Bearer <K_LAYER_API_KEY>   (set in env, shared with 0nMCP clients)
 *
 * Body:
 *   {
 *     "claim": "We ranked #1 on Google for our primary keyword in 90 days.",
 *     "client_domain": "northwind.com",   // optional
 *     "client_name":   "Northwind",       // optional
 *     "depth":         "basic" | "deep"   // default "basic"; "deep" requires an entitled key
 *   }
 *
 * Response: ResearchResult (see lib/research.ts) with a `k_layer: "verify"` tag.
 *
 * Rate limit: crude per-key token bucket in-memory (fine for v1; upgrade to Redis later).
 */

import { NextRequest, NextResponse } from "next/server"
import { researchClaim, type ResearchDepth } from "@/lib/research"

export const runtime = "nodejs"
export const maxDuration = 60

interface KeyEntitlement {
  label: string
  allowDeep: boolean
  perMinute: number
}

function parseEntitlements(): Record<string, KeyEntitlement> {
  // Format: K_LAYER_KEYS="key1:label=basic:30,key2:label=deep:120"
  // Or leave K_LAYER_API_KEY as a single master key (full entitlements)
  const out: Record<string, KeyEntitlement> = {}
  const master = process.env.K_LAYER_API_KEY
  if (master) out[master] = { label: "master", allowDeep: true, perMinute: 120 }

  const multi = process.env.K_LAYER_KEYS
  if (multi) {
    for (const entry of multi.split(",").map((s) => s.trim()).filter(Boolean)) {
      // key:label=tier:rate
      const [key, rest] = entry.split(":")
      if (!key || !rest) continue
      const [labelPart, tier, rateStr] = rest.split(/[=:]/)
      out[key] = {
        label: labelPart || "tenant",
        allowDeep: tier === "deep",
        perMinute: Number(rateStr) || 30,
      }
    }
  }
  return out
}

const BUCKETS = new Map<string, { tokens: number; last: number; rate: number }>()

function takeToken(key: string, perMinute: number): boolean {
  const now = Date.now()
  const existing = BUCKETS.get(key)
  const rate = perMinute / 60000
  if (!existing) {
    BUCKETS.set(key, { tokens: perMinute - 1, last: now, rate })
    return true
  }
  const elapsed = now - existing.last
  const refill = elapsed * rate
  existing.tokens = Math.min(perMinute, existing.tokens + refill)
  existing.last = now
  if (existing.tokens < 1) return false
  existing.tokens -= 1
  return true
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization") || ""
  const key = auth.startsWith("Bearer ") ? auth.slice(7).trim() : ""
  if (!key) return NextResponse.json({ error: "missing_bearer_token" }, { status: 401 })

  const entitlements = parseEntitlements()
  const entitlement = entitlements[key]
  if (!entitlement) return NextResponse.json({ error: "invalid_key" }, { status: 403 })

  if (!takeToken(key, entitlement.perMinute)) {
    return NextResponse.json({
      error: "rate_limited",
      message: `Exceeded ${entitlement.perMinute} calls/min for this key.`,
    }, { status: 429 })
  }

  const body = await req.json().catch(() => ({}))
  const claim = String(body?.claim || "").trim()
  const clientDomain = body?.client_domain ? String(body.client_domain) : null
  const clientName = body?.client_name ? String(body.client_name) : null
  const requestedDepth: ResearchDepth = body?.depth === "deep" ? "deep" : "basic"
  const depth: ResearchDepth = requestedDepth === "deep" && entitlement.allowDeep ? "deep" : "basic"

  if (claim.length < 10) {
    return NextResponse.json({ error: "claim_too_short", message: "claim must be at least 10 chars" }, { status: 400 })
  }
  if (claim.length > 2000) {
    return NextResponse.json({ error: "claim_too_long", message: "claim must be ≤ 2000 chars" }, { status: 400 })
  }

  try {
    const result = await researchClaim(claim, { clientDomain, clientName, depth })
    return NextResponse.json({
      ok: true,
      k_layer: "verify",
      version: "1.0",
      tenant: entitlement.label,
      depth,
      result,
    })
  } catch (e) {
    return NextResponse.json({
      error: "research_failed",
      message: e instanceof Error ? e.message : "unknown",
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    k_layer: "verify",
    version: "1.0",
    description: "AI research pipeline for marketing claims. Entity extract → web search → cross-source synthesis.",
    endpoints: {
      verify: "POST /api/k/verify",
    },
    auth: "Bearer <K_LAYER_API_KEY>",
    depths: ["basic", "deep"],
    docs: "https://verifiedsxo.com/how-it-works",
  })
}
