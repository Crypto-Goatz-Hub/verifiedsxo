/**
 * AI elevation — read a claim's prior verification + uploaded evidence
 * documents, reason about whether the combined case justifies promoting
 * the claim from "verified" → "elevated 100%".
 *
 * v1 extraction pipeline:
 *   - text/csv/json/txt content read up to 30KB each
 *   - other MIME types described by filename + user description only
 *   - downstream model: Groq llama-3.3-70b-versatile with response_format json
 */

import { getSupabaseAdmin } from "@/lib/supabase/server"
import { issueCertificateAndTag } from "@/lib/crm-cert"

const GROQ_KEY = process.env.GROQ_API_KEY || ""
const MAX_DOC_BYTES = 30_000
const TEXTUAL_MIME = ["text/plain", "text/csv", "application/json"]

interface LoadedClaim {
  id: string
  client_id: string
  agency_id: string
  claim_text: string
  claim_type: string
  plausibility_score: number | null
  plausibility_reasoning: string[] | null
  target_metric: Record<string, unknown> | null
}

export interface ElevationResult {
  elevated: boolean
  elevation_score: number // 0-100
  synthesis: string // human-readable 1-3 sentence summary
  highlights: string[] // key evidence bullets
  unresolved_gaps: string[] // what would still prevent elevation (empty when elevated)
  model: string
}

function safeParse<T = unknown>(raw: string): T | null {
  const m = raw.match(/\{[\s\S]*\}/)
  if (!m) return null
  try { return JSON.parse(m[0]) as T } catch { return null }
}

function systemPrompt(): string {
  return `You are an evidence review analyst for VerifiedSXO, a marketing-claim verification platform.

A marketing claim has already been verified against the client's live analytics (Google Search Console or similar). The client has now uploaded supplementary evidence documents and is requesting ELEVATION to a 100% verified status.

Your job: decide whether the combined body of evidence (live-API verification + uploaded documents) is overwhelming enough to justify elevating the claim.

Return STRICT JSON with this schema and nothing else:
{
  "elevated": <boolean>,
  "elevation_score": <integer 0-100>,
  "synthesis": "<1-3 sentence plain-English narrative of what the evidence proves>",
  "highlights": ["<evidence bullet 1>", "..."],
  "unresolved_gaps": ["<gap 1>", "..."]
}

Guidance:
- Elevate only when the documentary evidence meaningfully corroborates or extends the live-API verification. Do NOT elevate merely because documents exist; they must be congruent.
- elevation_score reflects total confidence including both prior + new evidence.
- If the new documents contradict the original verification, return elevated=false and list the contradictions in unresolved_gaps.
- Keep synthesis concrete — reference specific numbers when you can.
- Max 5 highlights, max 5 gaps.
- Return only the JSON object.`
}

function buildUserPrompt(claim: LoadedClaim, verifications: Array<Record<string, unknown>>, docs: Array<{ file_name: string; mime_type: string | null; size_bytes: number | null; description: string | null; content?: string | null }>): string {
  const parts: string[] = []
  parts.push(`CLAIM: "${claim.claim_text}"`)
  parts.push(`CLAIM TYPE: ${claim.claim_type}`)
  parts.push(`INITIAL PLAUSIBILITY: ${claim.plausibility_score ?? "—"}%`)
  if (Array.isArray(claim.plausibility_reasoning)) {
    parts.push(`PLAUSIBILITY REASONING:\n- ${claim.plausibility_reasoning.join("\n- ")}`)
  }
  if (claim.target_metric) {
    parts.push(`TARGET METRIC: ${JSON.stringify(claim.target_metric)}`)
  }
  parts.push("")
  parts.push("PRIOR AUTOMATED VERIFICATIONS:")
  for (const v of verifications) {
    parts.push(`- provider=${v.provider} passed=${v.passed} confidence=${v.confidence}% evidence=${JSON.stringify(v.evidence).slice(0, 600)}`)
  }
  parts.push("")
  parts.push(`UPLOADED EVIDENCE DOCUMENTS (${docs.length}):`)
  for (const d of docs) {
    const size = d.size_bytes ? `${Math.round(d.size_bytes / 1024)}KB` : "?"
    parts.push(`— ${d.file_name} (${d.mime_type || "unknown"}, ${size})`)
    if (d.description) parts.push(`  description: ${d.description}`)
    if (d.content) {
      const snippet = d.content.slice(0, MAX_DOC_BYTES)
      parts.push(`  content (truncated to ${MAX_DOC_BYTES} bytes):\n"""\n${snippet}\n"""`)
    }
  }
  parts.push("")
  parts.push("Return the JSON decision now.")
  return parts.join("\n")
}

async function callGroq(user: string): Promise<ElevationResult | null> {
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
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt() },
          { role: "user", content: user },
        ],
      }),
      signal: AbortSignal.timeout(30_000),
    })
    if (!res.ok) return null
    const data = await res.json()
    const text = data?.choices?.[0]?.message?.content || ""
    const parsed = safeParse<Partial<ElevationResult>>(text)
    if (!parsed) return null
    return {
      elevated: Boolean(parsed.elevated),
      elevation_score: Math.max(0, Math.min(100, Math.round(Number(parsed.elevation_score) || 0))),
      synthesis: String(parsed.synthesis || "").slice(0, 600),
      highlights: Array.isArray(parsed.highlights) ? parsed.highlights.map(String).slice(0, 5) : [],
      unresolved_gaps: Array.isArray(parsed.unresolved_gaps) ? parsed.unresolved_gaps.map(String).slice(0, 5) : [],
      model: "groq/llama-3.3-70b",
    }
  } catch {
    return null
  }
}

function fallbackHeuristic(claim: LoadedClaim, verifications: Array<Record<string, unknown>>, docCount: number): ElevationResult {
  const passed = verifications.some((v) => Boolean(v.passed))
  const score = passed ? Math.min(92, 70 + docCount * 4) : 40
  return {
    elevated: passed && docCount >= 1,
    elevation_score: score,
    synthesis: passed
      ? `Prior automated verification passed and ${docCount} supporting document${docCount === 1 ? "" : "s"} were provided. Heuristic elevation — manual review recommended.`
      : "Prior verification did not pass; elevation not granted.",
    highlights: [],
    unresolved_gaps: passed ? [] : ["Automated verification did not pass."],
    model: "heuristic-fallback",
  }
}

export async function runElevation(claimId: string): Promise<ElevationResult> {
  const admin = getSupabaseAdmin()

  const { data: claim } = await admin
    .from("vsxo_claims")
    .select("id, client_id, agency_id, claim_text, claim_type, plausibility_score, plausibility_reasoning, target_metric, status")
    .eq("id", claimId)
    .maybeSingle()
  if (!claim) throw new Error("claim_not_found")

  const { data: verifications } = await admin
    .from("vsxo_verifications")
    .select("id, provider, evidence, passed, confidence, verified_at")
    .eq("claim_id", claimId)

  const { data: docRows } = await admin
    .from("vsxo_claim_documents")
    .select("id, storage_path, file_name, mime_type, size_bytes, description")
    .eq("claim_id", claimId)

  if (!docRows || docRows.length === 0) throw new Error("no_documents")

  // Download + extract text for textual files
  const docs = await Promise.all(
    docRows.map(async (d) => {
      let content: string | null = null
      if (d.mime_type && TEXTUAL_MIME.includes(d.mime_type)) {
        try {
          const { data, error } = await admin.storage
            .from("vsxo-evidence")
            .download(d.storage_path)
          if (!error && data) {
            const buf = await data.arrayBuffer()
            content = new TextDecoder("utf-8", { fatal: false }).decode(buf).slice(0, MAX_DOC_BYTES)
          }
        } catch {}
      }
      return {
        file_name: d.file_name,
        mime_type: d.mime_type,
        size_bytes: d.size_bytes,
        description: d.description,
        content,
      }
    })
  )

  const userPrompt = buildUserPrompt(
    claim as LoadedClaim,
    (verifications || []) as Array<Record<string, unknown>>,
    docs
  )

  const result =
    (await callGroq(userPrompt)) ||
    fallbackHeuristic(claim as LoadedClaim, (verifications || []) as Array<Record<string, unknown>>, docs.length)

  // Persist a new verification row marking the elevation attempt
  await admin.from("vsxo_verifications").insert({
    claim_id: claim.id,
    provider: "ai_elevation",
    evidence: {
      summary: result.synthesis,
      highlights: result.highlights,
      unresolved_gaps: result.unresolved_gaps,
      model: result.model,
      doc_count: docs.length,
    },
    passed: result.elevated,
    confidence: result.elevation_score,
  })

  const now = new Date().toISOString()
  if (result.elevated) {
    await admin
      .from("vsxo_claims")
      .update({ status: "elevated", elevated_at: now })
      .eq("id", claim.id)
    // Refresh badge's last_verified_at if one exists
    await admin
      .from("vsxo_badges")
      .update({ last_verified_at: now })
      .eq("claim_id", claim.id)
    // Fire-and-forget CRM tag upgrade
    issueCertificateAndTag({ claimId: claim.id, elevated: true }).catch(() => {})
  } else {
    // Park in pending_review if we were verified; otherwise leave the status alone
    if (claim.status === "verified" || claim.status === "pending_review") {
      await admin.from("vsxo_claims").update({ status: "pending_review" }).eq("id", claim.id)
    }
  }

  return result
}
