/**
 * POST /api/agency/settings — update agency name, tagline, description, website.
 * When website changes (or `?action=verify_domain`), re-run domain verification.
 * Only the agency owner can patch.
 */

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabase/server"
import { refreshAgencyDomainVerification, normalizeDomain } from "@/lib/domain-verify"

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
    .select("id, owner_user_id, website")
    .eq("id", agencyId)
    .maybeSingle()
  if (!agency || agency.owner_user_id !== user.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  const action: string = String(body?.action || "update")

  // --- Action: verify_domain ---------------------------------------------
  if (action === "verify_domain") {
    const result = await refreshAgencyDomainVerification(agencyId)
    return NextResponse.json({ ok: true, domain: result })
  }

  // --- Action: update (default) ------------------------------------------
  const patch: Record<string, string | boolean | null> = {}
  if (typeof body.name === "string" && body.name.trim().length >= 2) patch.name = body.name.trim()
  if (typeof body.tagline === "string") patch.tagline = body.tagline.slice(0, 160)
  if (typeof body.description === "string") patch.description = body.description.slice(0, 2000)
  if (typeof body.public_profile_enabled === "boolean") patch.public_profile_enabled = body.public_profile_enabled

  let websiteChanged = false
  if (typeof body.website === "string") {
    const w = body.website.trim()
    const normalized = w ? normalizeDomain(w) : null
    patch.website = w ? (normalized || w.slice(0, 255)) : null
    websiteChanged = patch.website !== agency.website
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "nothing to update" }, { status: 400 })
  }

  const { error } = await admin.from("vsxo_agencies").update(patch).eq("id", agencyId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Auto re-verify domain if website was changed
  let domain = null
  if (websiteChanged) {
    domain = await refreshAgencyDomainVerification(agencyId)
  }

  return NextResponse.json({ ok: true, domain })
}
