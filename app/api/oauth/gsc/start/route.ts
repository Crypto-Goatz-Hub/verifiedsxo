import { NextRequest, NextResponse } from "next/server"
import { randomBytes } from "node:crypto"
import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabase/server"
import { buildAuthUrl, GSC_SCOPE } from "@/lib/google/oauth"

export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    const url = new URL("/login", req.url)
    url.searchParams.set("next", "/client")
    return NextResponse.redirect(url)
  }

  const admin = getSupabaseAdmin()
  const { data: client } = await admin
    .from("vsxo_agency_clients")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle()
  if (!client) return NextResponse.json({ error: "no client record — accept an invite first" }, { status: 403 })

  // Nonce = random token; store in cookie + state so callback can validate
  const nonce = randomBytes(16).toString("base64url")
  const state = Buffer.from(JSON.stringify({ nonce, clientId: client.id })).toString("base64url")

  const authUrl = buildAuthUrl({
    scope: GSC_SCOPE,
    state,
    loginHint: user.email || undefined,
  })

  const res = NextResponse.redirect(authUrl)
  res.cookies.set("vsxo_oauth_nonce", nonce, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60, // 10 minutes
  })
  return res
}
