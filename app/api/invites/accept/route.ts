import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabase/server"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const token: string = body?.token || ""
  const name: string = (body?.name || "").trim() || "Client"
  if (!token) return NextResponse.json({ error: "token required" }, { status: 400 })

  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "unauthorised" }, { status: 401 })

  const admin = getSupabaseAdmin()

  // Find the invited client row
  const { data: client } = await admin
    .from("vsxo_agency_clients")
    .select("id, agency_id, email, status")
    .eq("invite_token", token)
    .maybeSingle()

  if (!client) return NextResponse.json({ error: "invite not found" }, { status: 404 })
  if (client.status === "active" && client.invite_accepted_at)
    return NextResponse.json({ error: "already accepted" }, { status: 409 })

  // Link the auth user to the client row + mark active
  const { error: upErr } = await admin
    .from("vsxo_agency_clients")
    .update({
      user_id: user.id,
      status: "active",
      invite_accepted_at: new Date().toISOString(),
      name,
    })
    .eq("id", client.id)

  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })

  return NextResponse.json({ ok: true, clientId: client.id, agencyId: client.agency_id })
}
