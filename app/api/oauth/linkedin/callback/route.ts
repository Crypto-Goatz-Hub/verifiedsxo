import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabase/server"
import { exchangeLinkedInCode, fetchLinkedInUserinfo } from "@/lib/linkedin/oauth"
import { encrypt } from "@/lib/crypto"
import { pingMike } from "@/lib/notify-mike"

export const runtime = "nodejs"

function errorRedirect(url: URL, code: string): NextResponse {
  const dest = new URL("/client", url.origin)
  dest.searchParams.set("li", "error")
  dest.searchParams.set("reason", code)
  return NextResponse.redirect(dest)
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const code = url.searchParams.get("code") || ""
  const state = url.searchParams.get("state") || ""
  const err = url.searchParams.get("error")

  if (err) return errorRedirect(url, err)
  if (!code || !state) return errorRedirect(url, "missing_params")

  let parsed: { nonce: string; clientId: string }
  try {
    parsed = JSON.parse(Buffer.from(state, "base64url").toString("utf8"))
  } catch {
    return errorRedirect(url, "bad_state")
  }

  const cookieNonce = req.cookies.get("vsxo_li_nonce")?.value
  if (!cookieNonce || cookieNonce !== parsed.nonce) return errorRedirect(url, "nonce_mismatch")

  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return errorRedirect(url, "not_signed_in")

  const admin = getSupabaseAdmin()
  const { data: client } = await admin
    .from("vsxo_agency_clients")
    .select("id, user_id")
    .eq("id", parsed.clientId)
    .maybeSingle()
  if (!client || client.user_id !== user.id) return errorRedirect(url, "forbidden")

  let tokens: Awaited<ReturnType<typeof exchangeLinkedInCode>>
  try {
    tokens = await exchangeLinkedInCode(code)
  } catch {
    return errorRedirect(url, "exchange_failed")
  }

  let profile: Awaited<ReturnType<typeof fetchLinkedInUserinfo>> | null = null
  try {
    profile = await fetchLinkedInUserinfo(tokens.access_token)
  } catch {
    profile = null
  }

  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()
  const accountLabel = profile?.email || profile?.name || profile?.sub || "linkedin"

  const { error: upsertErr } = await admin
    .from("vsxo_data_connections")
    .upsert(
      {
        client_id: client.id,
        provider: "linkedin",
        account_label: accountLabel,
        access_token_enc: encrypt(tokens.access_token),
        refresh_token_enc: tokens.refresh_token ? encrypt(tokens.refresh_token) : null,
        expires_at: expiresAt,
        scope: tokens.scope,
        status: "connected",
      },
      { onConflict: "client_id,provider,account_label" }
    )

  if (upsertErr) return errorRedirect(url, "store_failed")

  pingMike({
    event: "public.score", // closest enum available
    headline: `LinkedIn connected: ${accountLabel}`,
    fields: {
      "Client ID": client.id,
      "LinkedIn sub": profile?.sub || "—",
      Name: profile?.name || "—",
      Email: profile?.email || "—",
      "Email verified": profile?.email_verified ? "yes" : "no",
      Scope: tokens.scope,
    },
    link: `https://verifiedsxo.com/client`,
  })

  const dest = new URL("/client", url.origin)
  dest.searchParams.set("li", "connected")
  const res = NextResponse.redirect(dest)
  res.cookies.delete("vsxo_li_nonce")
  return res
}
