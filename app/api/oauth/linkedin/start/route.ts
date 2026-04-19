import { NextRequest, NextResponse } from "next/server"
import { randomBytes } from "node:crypto"
import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabase/server"
import { buildLinkedInAuthUrl } from "@/lib/linkedin/oauth"

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

  const nonce = randomBytes(16).toString("base64url")
  const state = Buffer.from(JSON.stringify({ nonce, clientId: client.id })).toString("base64url")

  const res = NextResponse.redirect(buildLinkedInAuthUrl(state))
  res.cookies.set("vsxo_li_nonce", nonce, {
    httpOnly: true, secure: true, sameSite: "lax", path: "/",
    maxAge: 10 * 60,
  })
  return res
}
