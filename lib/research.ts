/**
 * Claim Research Pipeline — Verify Engine v1 (0nMCP K-layer · `verify`)
 *
 * Flow:
 *   1. Entity extract      — Groq llama-3.1-8b-instant  (fast+cheap)
 *   2. Query plan          — Groq llama-3.1-8b-instant  (3–5 queries)
 *   3. Web search          — Brave Search API (if key) → DuckDuckGo scrape
 *   4. Source fetch        — Top N URLs, strip HTML, trim
 *   5. Synthesis           — CRM Agent Studio KB (25y marketing corpus)
 *                            → Groq llama-3.3-70b-versatile fallback
 *
 * Exposed via:
 *   • verifiedsxo: POST /api/claims/[id]/research
 *   • 0nMCP add0n: POST /api/k/verify
 *
 * Tiering is done by the *caller* — this lib takes a `depth` parameter
 * ('basic' = 3 queries / 3 sources, 'deep' = 6 queries / 8 sources).
 */

export type ResearchDepth = "basic" | "deep"
export type Stance = "supports" | "contradicts" | "unrelated" | "mixed"
export type Verdict = "likely_true" | "likely_false" | "unsupported" | "mixed" | "inconclusive"

export interface Citation {
  url: string
  title?: string
  snippet?: string
  source?: string
  relevance: number   // 0–100
  stance: Stance
  fetched_ok: boolean
}

export interface ResearchResult {
  verdict: Verdict
  confidence: number              // 0–100
  summary: string                 // 1-paragraph natural-language verdict
  reasoning: string[]             // 3–6 bullets
  red_flags: string[]             // things the AI noticed that could invalidate the claim
  entities: ExtractedEntities
  queries: string[]
  citations: Citation[]
  tier: "crm_agent" | "groq" | "fallback"
  depth: ResearchDepth
  duration_ms: number
}

export interface ExtractedEntities {
  brands: string[]
  people: string[]
  dates: string[]
  metrics: string[]       // '$220K ARR', '#1 Google', '10M users'
  category: string        // ranking | traffic | revenue | audience | ...
  assertions: string[]    // testable atomic claims
}

// -----------------------------------------------------------------------
// Environment wiring
// -----------------------------------------------------------------------
const GROQ_KEY = process.env.GROQ_API_KEY || ""
const BRAVE_KEY = process.env.BRAVE_SEARCH_API_KEY || ""

// CRM Agent Studio (used as the K-layer "intelligence" step)
const CRM_API = "https://services.leadconnectorhq.com"
const CRM_VERSION = "2021-07-28"
const AGENCY_PIT = process.env.CRM_AGENCY_PIT || ""
const LOCATION_ID = process.env.CRM_LOCATION_ID || ""
const AGENT_ID = process.env.CRM_AGENT_ID || ""

// -----------------------------------------------------------------------
// PUBLIC ENTRY POINT
// -----------------------------------------------------------------------
export async function researchClaim(
  claim: string,
  opts: {
    clientDomain?: string | null
    clientName?: string | null
    depth?: ResearchDepth
  } = {},
): Promise<ResearchResult> {
  const started = Date.now()
  const depth: ResearchDepth = opts.depth || "basic"
  const maxQueries = depth === "deep" ? 6 : 3
  const maxSources = depth === "deep" ? 8 : 3

  // Step 1 — entity extract
  const entities = await extractEntities(claim).catch(() => emptyEntities(claim))

  // Step 2 — query plan (tighten with client context if present)
  const queries = await planQueries(claim, entities, opts.clientDomain, opts.clientName, maxQueries)
    .catch(() => [claim.slice(0, 120)])

  // Step 3 — web search
  const searchHits = await searchAll(queries, maxSources).catch(() => [])

  // Step 4 — fetch top N for stronger synthesis
  const enriched = await enrichHits(searchHits.slice(0, maxSources)).catch(() => searchHits)

  // Step 5 — synthesise verdict
  const synth = await synthesizeVerdict(claim, entities, enriched)

  return {
    verdict: synth.verdict,
    confidence: synth.confidence,
    summary: synth.summary,
    reasoning: synth.reasoning,
    red_flags: synth.red_flags,
    entities,
    queries,
    citations: synth.citations,
    tier: synth.tier,
    depth,
    duration_ms: Date.now() - started,
  }
}

// -----------------------------------------------------------------------
// Step 1 — Entity extract
// -----------------------------------------------------------------------
async function extractEntities(claim: string): Promise<ExtractedEntities> {
  if (!GROQ_KEY) return emptyEntities(claim)

  const prompt = `You are extracting testable entities from a marketing claim. Output STRICT JSON only.

CLAIM: """${claim.slice(0, 800)}"""

Return:
{
  "brands":     [],   // company or product names mentioned
  "people":     [],   // named humans
  "dates":      [],   // time references ("Q1 2024", "last year", "since 2020")
  "metrics":   [],   // hard numeric assertions ("$220K ARR", "#1 Google", "50M visits")
  "category":   "",   // one of: ranking|traffic|revenue|audience|conversion|output|customer|general
  "assertions": []    // 1–4 standalone testable statements, plain English
}

Rules:
- Be literal. If a brand isn't named, leave brands empty.
- "assertions" should be short (< 20 words each) and each must be independently verifiable.
- Keep arrays small. Empty if not present.`

  const r = await groq(prompt, "llama-3.1-8b-instant", { json: true, max_tokens: 500 })
  const parsed = safeJson(r) as Partial<ExtractedEntities> | null
  if (!parsed) return emptyEntities(claim)

  return {
    brands: arr(parsed.brands),
    people: arr(parsed.people),
    dates: arr(parsed.dates),
    metrics: arr(parsed.metrics),
    category: String(parsed.category || "general").toLowerCase(),
    assertions: arr(parsed.assertions).length ? arr(parsed.assertions) : [claim.slice(0, 160)],
  }
}

function emptyEntities(claim: string): ExtractedEntities {
  return { brands: [], people: [], dates: [], metrics: [], category: "general", assertions: [claim.slice(0, 160)] }
}

// -----------------------------------------------------------------------
// Step 2 — Query plan
// -----------------------------------------------------------------------
async function planQueries(
  claim: string,
  entities: ExtractedEntities,
  clientDomain: string | null | undefined,
  clientName: string | null | undefined,
  maxQueries: number,
): Promise<string[]> {
  if (!GROQ_KEY) {
    return fallbackQueries(claim, entities, clientDomain, clientName, maxQueries)
  }

  const context = [
    clientName ? `Client name: ${clientName}` : null,
    clientDomain ? `Client website: ${clientDomain}` : null,
    entities.brands.length ? `Brands: ${entities.brands.join(", ")}` : null,
    entities.metrics.length ? `Metrics: ${entities.metrics.join(", ")}` : null,
  ].filter(Boolean).join("\n")

  const prompt = `You are designing the best possible google queries to fact-check a marketing claim.

${context ? context + "\n\n" : ""}CLAIM: """${claim.slice(0, 400)}"""

Output JSON: { "queries": [ ... up to ${maxQueries} strings ... ] }

Rules:
- Each query is something a human would actually type — 3 to 12 words, no quotes, no boolean operators unless useful.
- Bias toward queries that surface CORROBORATING or CONTRADICTING evidence (press releases, case studies, LinkedIn, third-party reviews, news).
- If a client domain is present, include at least one "site:domain" query.
- Don't ask questions; use keyword queries.`

  const r = await groq(prompt, "llama-3.1-8b-instant", { json: true, max_tokens: 400 })
  const parsed = safeJson(r) as { queries?: string[] } | null
  const qs = arr<string>(parsed?.queries).map((s) => String(s).trim()).filter(Boolean).slice(0, maxQueries)

  return qs.length ? qs : fallbackQueries(claim, entities, clientDomain, clientName, maxQueries)
}

function fallbackQueries(
  claim: string,
  entities: ExtractedEntities,
  clientDomain: string | null | undefined,
  clientName: string | null | undefined,
  maxQueries: number,
): string[] {
  const out: string[] = []
  const lead = [clientName, entities.brands[0]].filter(Boolean).join(" ").trim()
  if (lead) {
    out.push(`${lead} ${entities.category} case study`)
    out.push(`${lead} reviews`)
  }
  if (clientDomain) out.push(`site:${clientDomain} ${entities.category}`)
  if (entities.metrics[0]) out.push(`${entities.metrics[0]} ${lead || "marketing"}`)
  if (out.length === 0) out.push(claim.slice(0, 120))
  return out.slice(0, maxQueries)
}

// -----------------------------------------------------------------------
// Step 3 — Web search
// -----------------------------------------------------------------------
interface SearchHit {
  url: string
  title?: string
  snippet?: string
  source?: string
}

async function searchAll(queries: string[], maxSources: number): Promise<SearchHit[]> {
  const seen = new Set<string>()
  const merged: SearchHit[] = []

  for (const q of queries) {
    const hits = BRAVE_KEY ? await braveSearch(q) : await duckDuckGoSearch(q)
    for (const h of hits) {
      const key = h.url.split("#")[0].split("?")[0]
      if (seen.has(key)) continue
      seen.add(key)
      merged.push(h)
      if (merged.length >= maxSources * 2) break
    }
    if (merged.length >= maxSources * 2) break
  }

  return merged.slice(0, maxSources * 2)
}

async function braveSearch(q: string): Promise<SearchHit[]> {
  try {
    const r = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(q)}&count=10`, {
      headers: { "x-subscription-token": BRAVE_KEY, "accept": "application/json" },
    })
    if (!r.ok) return []
    const j = await r.json()
    const results = (j?.web?.results || []) as Array<{ url: string; title?: string; description?: string; meta_url?: { hostname?: string } }>
    return results.map((h) => ({
      url: h.url,
      title: h.title,
      snippet: h.description,
      source: h.meta_url?.hostname || hostFromUrl(h.url),
    }))
  } catch { return [] }
}

async function duckDuckGoSearch(q: string): Promise<SearchHit[]> {
  try {
    const r = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}`, {
      headers: { "user-agent": "Mozilla/5.0 (compatible; VerifiedSXO/1.0)" },
    })
    if (!r.ok) return []
    const html = await r.text()
    // Cheap HTML parse — extract result anchors + snippets
    const hits: SearchHit[] = []
    const rx = /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g
    let m: RegExpExecArray | null
    while ((m = rx.exec(html)) !== null && hits.length < 10) {
      const rawUrl = decodeURIComponent(m[1].replace(/^\/\/duckduckgo\.com\/l\/\?.*?uddg=/, "").split("&")[0])
      hits.push({
        url: rawUrl,
        title: stripTags(m[2]).trim(),
        snippet: stripTags(m[3]).trim(),
        source: hostFromUrl(rawUrl),
      })
    }
    return hits
  } catch { return [] }
}

// -----------------------------------------------------------------------
// Step 4 — Fetch + enrich
// -----------------------------------------------------------------------
async function enrichHits(hits: SearchHit[]): Promise<SearchHit[]> {
  const out: SearchHit[] = []
  await Promise.all(hits.map(async (h) => {
    try {
      const r = await fetch(h.url, { signal: AbortSignal.timeout(8000), headers: { "user-agent": "Mozilla/5.0 (compatible; VerifiedSXO/1.0)" } })
      if (!r.ok) { out.push(h); return }
      const html = await r.text()
      const text = stripTags(html).replace(/\s+/g, " ").slice(0, 1500)
      out.push({ ...h, snippet: h.snippet || text.slice(0, 240) })
    } catch {
      out.push(h)
    }
  }))
  return out
}

// -----------------------------------------------------------------------
// Step 5 — Synthesis (CRM Agent Studio → Groq fallback)
// -----------------------------------------------------------------------
interface Synthesis {
  verdict: Verdict
  confidence: number
  summary: string
  reasoning: string[]
  red_flags: string[]
  citations: Citation[]
  tier: "crm_agent" | "groq" | "fallback"
}

async function synthesizeVerdict(
  claim: string,
  entities: ExtractedEntities,
  hits: SearchHit[],
): Promise<Synthesis> {
  const evidenceBlock = hits
    .map((h, i) => `[${i + 1}] ${h.title || h.url}\n    ${h.source || ""}\n    ${(h.snippet || "").slice(0, 400)}`)
    .join("\n\n")

  const prompt = `You are an independent marketing-claims auditor for VerifiedSXO. You have 25 years of marketing data + live web evidence.

CLAIM: """${claim.slice(0, 500)}"""

EXTRACTED ENTITIES:
- category: ${entities.category}
- brands:   ${entities.brands.join(", ") || "—"}
- metrics:  ${entities.metrics.join(", ") || "—"}
- assertions:
${entities.assertions.map((a) => `  • ${a}`).join("\n") || "  — none —"}

WEB EVIDENCE (${hits.length} hits):
${evidenceBlock || "(no external evidence collected)"}

Output STRICT JSON ONLY:
{
  "verdict":    "likely_true | likely_false | unsupported | mixed | inconclusive",
  "confidence": 0-100,
  "summary":    "1–2 sentences, neutral, cites the strongest supporting or contradicting evidence.",
  "reasoning":  ["3–5 bullets explaining the verdict, each referencing evidence by [number] where applicable"],
  "red_flags":  ["things that could invalidate this claim — missing proof, contradictions, generic language"],
  "citations":  [
    { "index": 1, "relevance": 0-100, "stance": "supports|contradicts|unrelated|mixed" }
  ]
}

Rules:
- Never claim 100% without direct first-party evidence.
- If evidence is thin, verdict should be "unsupported" with confidence ≤ 50.
- Be skeptical of vanity claims ("we 10x'd", "#1 in the world") without data.
- Prefer third-party corroboration (press, independent reviews, archives) over first-party.`

  // Tier 1 — CRM Agent Studio KB
  if (AGENCY_PIT && LOCATION_ID && AGENT_ID) {
    try {
      const r = await fetch(`${CRM_API}/agent-studio/public-api/agents/${AGENT_ID}/execute`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${AGENCY_PIT}`,
          Version: CRM_VERSION,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ message: prompt, locationId: LOCATION_ID }),
        signal: AbortSignal.timeout(25000),
      })
      if (r.ok) {
        const j = await r.json()
        const text = extractAgentText(j)
        const parsed = safeJson(text)
        if (parsed) {
          return hydrate(parsed, hits, "crm_agent")
        }
      }
    } catch { /* fall through */ }
  }

  // Tier 2 — Groq
  if (GROQ_KEY) {
    const raw = await groq(prompt, "llama-3.3-70b-versatile", { json: true, max_tokens: 900 })
    const parsed = safeJson(raw)
    if (parsed) return hydrate(parsed, hits, "groq")
  }

  // Tier 3 — heuristic
  return {
    verdict: hits.length > 0 ? "inconclusive" : "unsupported",
    confidence: hits.length > 0 ? 40 : 20,
    summary: hits.length > 0
      ? "Some web signals exist but AI synthesis is unavailable right now. Review the citations below manually."
      : "No external evidence located for this claim and AI synthesis is unavailable.",
    reasoning: [
      hits.length > 0 ? `Collected ${hits.length} web source(s) but could not synthesise a verdict.` : "No web evidence found.",
      "Connect first-party analytics on the claim page to run a full verification.",
    ],
    red_flags: hits.length === 0 ? ["No third-party signal for this claim."] : [],
    citations: hits.map((h) => ({
      url: h.url, title: h.title, snippet: h.snippet, source: h.source,
      relevance: 0, stance: "unrelated" as Stance, fetched_ok: true,
    })),
    tier: "fallback",
  }
}

function hydrate(
  parsed: Record<string, unknown>,
  hits: SearchHit[],
  tier: "crm_agent" | "groq",
): Synthesis {
  const rawCites = arr(parsed.citations) as Array<{ index?: number; relevance?: number; stance?: string }>
  const citations: Citation[] = hits.map((h, i) => {
    const c = rawCites.find((x) => Number(x.index) === i + 1)
    return {
      url: h.url, title: h.title, snippet: h.snippet, source: h.source,
      relevance: clamp(Number(c?.relevance) || 0, 0, 100),
      stance: (["supports", "contradicts", "unrelated", "mixed"].includes(String(c?.stance))
        ? String(c?.stance)
        : "unrelated") as Stance,
      fetched_ok: true,
    }
  })

  const verdict = (["likely_true", "likely_false", "unsupported", "mixed", "inconclusive"] as const)
    .includes(parsed.verdict as Verdict) ? (parsed.verdict as Verdict) : "inconclusive"

  return {
    verdict,
    confidence: clamp(Number(parsed.confidence) || 0, 0, 100),
    summary: String(parsed.summary || "").slice(0, 600),
    reasoning: arr(parsed.reasoning).slice(0, 6).map(String),
    red_flags: arr(parsed.red_flags).slice(0, 6).map(String),
    citations,
    tier,
  }
}

// -----------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------
async function groq(prompt: string, model: string, opts: { json?: boolean; max_tokens?: number } = {}): Promise<string> {
  if (!GROQ_KEY) return ""
  const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "authorization": `Bearer ${GROQ_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      max_tokens: opts.max_tokens || 700,
      response_format: opts.json ? { type: "json_object" } : undefined,
      messages: [{ role: "user", content: prompt }],
    }),
    signal: AbortSignal.timeout(25000),
  })
  if (!r.ok) return ""
  const j = await r.json()
  return j?.choices?.[0]?.message?.content || ""
}

function safeJson(text: string): Record<string, unknown> | null {
  if (!text) return null
  try {
    const trimmed = text.trim()
    if (trimmed.startsWith("{")) return JSON.parse(trimmed)
    const match = trimmed.match(/\{[\s\S]*\}/)
    return match ? JSON.parse(match[0]) : null
  } catch { return null }
}

function extractAgentText(resp: unknown): string {
  if (!resp || typeof resp !== "object") return ""
  const r = resp as Record<string, unknown>
  if (typeof r.response === "string") return r.response
  if (typeof r.message === "string") return r.message
  if (typeof r.output === "string") return r.output
  if (Array.isArray(r.messages)) {
    const last = r.messages[r.messages.length - 1] as Record<string, unknown> | undefined
    if (last && typeof last.content === "string") return last.content
  }
  return JSON.stringify(r)
}

function stripTags(html: string): string {
  return html.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, " ")
}

function hostFromUrl(u: string): string {
  try { return new URL(u).hostname.replace(/^www\./, "") } catch { return "" }
}

function arr<T>(v: unknown): T[] { return Array.isArray(v) ? (v as T[]) : [] }
function clamp(n: number, lo: number, hi: number): number { return Math.max(lo, Math.min(hi, isNaN(n) ? lo : n)) }
