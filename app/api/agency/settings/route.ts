/**
 * POST /api/agency/settings — update agency name, tagline, description.
 * Only the agency owner can patch.
 */

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabase/server"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "unauthorised" }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const agencyId = String(body?.agencyId || "")
  if (!agencyId) return NextResponse.json({ error: "agencyId required" }, { status: 400 })

  const admin = getSupabaseAdmin()
  const { data: agency } = await admin
    .from("vsxo_agencies")
    .select("id, owner_user_id")
    .eq("id", agencyId)
    .maybeSingle()
  if (!agency || agency.owner_user_id !== user.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  const patch: Record<string, string | boolean> = {}
  if (typeof body.name === "string" && body.name.trim().length >= 2) patch.name = body.name.trim()
  if (typeof body.tagline === "string") patch.tagline = body.tagline.slice(0, 160)
  if (typeof body.description === "string") patch.description = body.description.slice(0, 2000)
  if (typeof body.public_profile_enabled === "boolean") patch.public_profile_enabled = body.public_profile_enabled

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "nothing to update" }, { status: 400 })
  }

  const { error } = await admin.from("vsxo_agencies").update(patch).eq("id", agencyId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
