/**
 * POST /api/score
 * Plausibility scorer. Tier-1 = CRM Agent Studio (0nIntel), Tier-2 = Groq fallback.
 * Input:  { claim: string }
 * Output: { score, reasoning[], tier, claimType, nextStep }
 */

import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const maxDuration = 30

interface ScoreResult {
  score: number
  reasoning: string[]
  tier: "agent" | "groq" | "fallback"
  claimType: string
  nextStep: "connect_data" | "verified_already" | "insufficient_evidence"
}

const CRM_API = "https://services.leadconnectorhq.com"
const CRM_VERSION = "2021-07-28"
const AGENCY_PIT = process.env.CRM_AGENCY_PIT || ""
const LOCATION_ID = process.env.CRM_LOCATION_ID || ""
const AGENT_ID = process.env.CRM_AGENT_ID || ""

const GROQ_KEY = process.env.GROQ_API_KEY || ""

function detectClaimType(claim: string): string {
  const c = claim.toLowerCase()
  if (/\$[\d,.]+|revenue|arr|mrr|earned|made/.test(c)) return "revenue"
  if (/visitor|traffic|pageview|session|user/.test(c)) return "traffic"
  if (/rank|position|#1|top 3|top 10|serp/.test(c)) return "ranking"
  if (/follower|subscriber|audience|list/.test(c)) return "audience"
  if (/conversion|close rate|convert/.test(c)) return "conversion"
  if (/built|shipped|launched|apps?|product/.test(c)) return "output"
  if (/customer|client|user signed up/.test(c)) return "customer"
  return "general"
}

function systemPrompt(): string {
  return `You are a marketing-claim plausibility analyst. A user posts a claim from social media.
Judge how likely it is to be true, using 25 years of marketing benchmarks as your prior.

Output STRICT JSON with this schema:
{ "score": <0-100 integer>, "reasoning": ["reason 1", "reason 2", "reason 3"] }

Scoring rules:
- 80-100: claim falls within normal ranges for comparable businesses
- 50-79: plausible but outlier — would need specific context
- 20-49: unlikely without either significant prior success or misleading framing
- 0-19: near impossible / strongly suggests misleading framing or outright fabrication

Be skeptical. "I made $100K last week" is ~5% without 2-3 years of documented runway.
"Built 5 SaaS apps in a week" is ~1% without heavy AI automation + prior infrastructure.
Call out specific numbers that don't add up. Keep reasoning concrete, 1 sentence each, no filler.
Return ONLY the JSON object.`
}

async function scoreWithCrmAgent(claim: string, claimType: string): Promise<Omit<ScoreResult, "claimType" | "nextStep"> | null> {
  if (!AGENCY_PIT || !LOCATION_ID || !AGENT_ID) return null
  const body = {
    message: `Score this marketing claim for plausibility (0-100) with 3 reasons. Claim type: ${claimType}.\n\nClaim: "${claim}"\n\nReturn JSON: {"score": N, "reasoning": ["...","...","..."]}`,
    locationId: LOCATION_ID,
  }
  try {
    const res = await fetch(`${CRM_API}/agent-studio/public-api/agents/${AGENT_ID}/execute`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AGENCY_PIT}`,
        "Content-Type": "application/json",
        Version: CRM_VERSION,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return null
    const data = await res.json()
    const text: string = data?.response || data?.output || data?.message || ""
    const parsed = extractJson(text)
    if (!parsed) return null
    return { score: clampScore(parsed.score), reasoning: arr(parsed.reasoning), tier: "agent" }
  } catch {
    return null
  }
}

async function scoreWithGroq(claim: string, claimType: string): Promise<Omit<ScoreResult, "claimType" | "nextStep"> | null> {
  if (!GROQ_KEY) return null
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        temperature: 0.3,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt() },
          { role: "user", content: `Claim type: ${claimType}. Claim: "${claim}"` },
        ],
      }),
      signal: AbortSignal.timeout(12000),
    })
    if (!res.ok) return null
    const data = await res.json()
    const text: string = data?.choices?.[0]?.message?.content || ""
    const parsed = extractJson(text)
    if (!parsed) return null
    return { score: clampScore(parsed.score), reasoning: arr(parsed.reasoning), tier: "groq" }
  } catch {
    return null
  }
}

function fallbackScore(claim: string, claimType: string): Omit<ScoreResult, "claimType" | "nextStep"> {
  const c = claim.toLowerCase()
  let score = 50
  if (/\$\d{3,4}k|\$\d+m/.test(c)) score -= 25
  if (/last week|in a week|overnight|in a day/.test(c)) score -= 15
  if (/5 (saas|apps?|products?)/.test(c)) score -= 20
  if (/million|1m|100x/.test(c)) score -= 10
  if (/ai|automated/.test(c) && claimType === "output") score += 10
  score = Math.max(0, Math.min(100, score))
  return {
    score,
    reasoning: [
      "Heuristic score — authoritative scorer unavailable.",
      `Claim type inferred as "${claimType}".`,
      "Connect your real data to get a definitive verified result.",
    ],
    tier: "fallback",
  }
}

function clampScore(n: unknown): number {
  const x = Number(n)
  if (!Number.isFinite(x)) return 50
  return Math.max(0, Math.min(100, Math.round(x)))
}

function arr(x: unknown): string[] {
  if (Array.isArray(x)) return x.map(String).slice(0, 5)
  if (typeof x === "string") return [x]
  return []
}

function extractJson(text: string): any {
  if (!text) return null
  const m = text.match(/\{[\s\S]*\}/)
  if (!m) return null
  try { return JSON.parse(m[0]) } catch { return null }
}

export async function POST(req: NextRequest) {
  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: "invalid json" }, { status: 400 }) }
  const claim: string = typeof body?.claim === "string" ? body.claim.trim() : ""
  if (claim.length < 10) return NextResponse.json({ error: "claim too short" }, { status: 400 })
  if (claim.length > 800) return NextResponse.json({ error: "claim too long" }, { status: 400 })

  const claimType = detectClaimType(claim)

  const scored =
    (await scoreWithCrmAgent(claim, claimType)) ||
    (await scoreWithGroq(claim, claimType)) ||
    fallbackScore(claim, claimType)

  const nextStep: ScoreResult["nextStep"] =
    scored.score >= 80 ? "verified_already" : "connect_data"

  return NextResponse.json({
    ...scored,
    claimType,
    nextStep,
  })
}
