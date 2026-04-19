/**
 * Per-user Search Console client. Uses OAuth tokens stored in
 * vsxo_data_connections (encrypted with DATA_ENCRYPTION_KEY).
 *
 * This is separate from the service-account client used by rocketopp.com
 * for its own property — here the customer grants us access to theirs.
 */

import { getSupabaseAdmin } from "@/lib/supabase/server"
import { decrypt, encrypt } from "@/lib/crypto"
import { refreshAccessToken, GSC_SCOPE } from "./oauth"

const API = "https://searchconsole.googleapis.com/webmasters/v3"

interface GscConnection {
  id: string
  client_id: string
  access_token: string
  refresh_token: string | null
  expires_at: string | null
}

async function loadConnection(clientId: string): Promise<GscConnection | null> {
  const admin = getSupabaseAdmin()
  const { data } = await admin
    .from("vsxo_data_connections")
    .select("id, client_id, access_token_enc, refresh_token_enc, expires_at, status")
    .eq("client_id", clientId)
    .eq("provider", "gsc")
    .eq("status", "connected")
    .order("connected_at", { ascending: false })
    .limit(1)
    .maybeSingle()
  if (!data) return null
  try {
    return {
      id: data.id,
      client_id: data.client_id,
      access_token: decrypt(data.access_token_enc),
      refresh_token: data.refresh_token_enc ? decrypt(data.refresh_token_enc) : null,
      expires_at: data.expires_at,
    }
  } catch {
    return null
  }
}

async function ensureFresh(conn: GscConnection): Promise<string> {
  const exp = conn.expires_at ? new Date(conn.expires_at).getTime() : 0
  if (exp > Date.now() + 60_000) return conn.access_token
  if (!conn.refresh_token) return conn.access_token
  const fresh = await refreshAccessToken(conn.refresh_token)
  const newExp = new Date(Date.now() + fresh.expires_in * 1000).toISOString()
  const admin = getSupabaseAdmin()
  await admin
    .from("vsxo_data_connections")
    .update({
      access_token_enc: encrypt(fresh.access_token),
      ...(fresh.refresh_token ? { refresh_token_enc: encrypt(fresh.refresh_token) } : {}),
      expires_at: newExp,
      scope: fresh.scope || GSC_SCOPE,
    })
    .eq("id", conn.id)
  return fresh.access_token
}

async function call<T>(token: string, path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`gsc ${res.status}: ${text.slice(0, 300)}`)
  return JSON.parse(text) as T
}

export async function listSites(clientId: string): Promise<string[]> {
  const conn = await loadConnection(clientId)
  if (!conn) throw new Error("no_connection")
  const token = await ensureFresh(conn)
  const data = await call<{ siteEntry?: Array<{ siteUrl: string; permissionLevel: string }> }>(
    token,
    `/sites`
  )
  return (data.siteEntry || [])
    .filter((s) => /Owner|FullUser/.test(s.permissionLevel))
    .map((s) => s.siteUrl)
}

export interface SearchAnalyticsOpts {
  site: string
  startDate: string // YYYY-MM-DD
  endDate: string
  dimensions?: Array<"query" | "page" | "country" | "device" | "date">
  rowLimit?: number
  filter?: { dimension: string; operator?: string; expression: string }
}

export interface SearchAnalyticsRow {
  keys: string[]
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export async function searchAnalytics(
  clientId: string,
  opts: SearchAnalyticsOpts
): Promise<SearchAnalyticsRow[]> {
  const conn = await loadConnection(clientId)
  if (!conn) throw new Error("no_connection")
  const token = await ensureFresh(conn)

  const body: Record<string, unknown> = {
    startDate: opts.startDate,
    endDate: opts.endDate,
    dimensions: opts.dimensions || ["query"],
    rowLimit: opts.rowLimit ?? 100,
  }
  if (opts.filter) {
    body.dimensionFilterGroups = [{
      filters: [{
        dimension: opts.filter.dimension,
        operator: opts.filter.operator || "equals",
        expression: opts.filter.expression,
      }],
    }]
  }

  const data = await call<{ rows?: SearchAnalyticsRow[] }>(
    token,
    `/sites/${encodeURIComponent(opts.site)}/searchAnalytics/query`,
    { method: "POST", body: JSON.stringify(body) }
  )
  return data.rows || []
}

export async function hasConnection(clientId: string): Promise<boolean> {
  const admin = getSupabaseAdmin()
  const { data } = await admin
    .from("vsxo_data_connections")
    .select("id")
    .eq("client_id", clientId)
    .eq("provider", "gsc")
    .eq("status", "connected")
    .maybeSingle()
  return !!data
}
