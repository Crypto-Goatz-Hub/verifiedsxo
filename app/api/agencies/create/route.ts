import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabase/server"

export const runtime = "nodejs"

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40)
}

const CRM_API = "https://services.leadconnectorhq.com"
const CRM_VERSION = "2021-07-28"

async function upsertCrmContact(email: string, name: string, agencyName: string): Promise<string | null> {
  const pit = process.env.CRM_AGENCY_PIT || ""
  const locationId = process.env.CRM_LOCATION_ID || ""
  if (!pit || !locationId) return null
  try {
    const res = await fetch(`${CRM_API}/contacts/upsert`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${pit}`,
        "Content-Type": "application/json",
        Version: CRM_VERSION,
      },
      body: JSON.stringify({
        locationId,
        email,
        firstName: name.split(" ")[0] || name,
        lastName: name.split(" ").slice(1).join(" ") || "",
        source: "VerifiedSXO Agency Signup",
        tags: ["Agency", "verifiedsxo", `agency:${slugify(agencyName)}`],
      }),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data?.contact?.id || data?.id || null
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const name: string = typeof body?.name === "string" ? body.name.trim() : ""
  if (name.length < 2) return NextResponse.json({ error: "name too short" }, { status: 400 })

  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "unauthorised" }, { status: 401 })

  const admin = getSupabaseAdmin()

  // Generate unique slug
  const base = slugify(name) || `agency-${Date.now()}`
  let slug = base
  for (let i = 0; i < 10; i++) {
    const { data: existing } = await admin.from("vsxo_agencies").select("id").eq("slug", slug).maybeSingle()
    if (!existing) break
    slug = `${base}-${Math.random().toString(36).slice(2, 6)}`
  }

  // Upsert CRM contact in parallel with agency row
  const [crmContactId, { data: agency, error }] = await Promise.all([
    upsertCrmContact(user.email || "", user.user_metadata?.full_name || user.email || "there", name),
    admin
      .from("vsxo_agencies")
      .insert({
        owner_user_id: user.id,
        name,
        slug,
      })
      .select("id, slug")
      .single(),
  ])

  if (error || !agency) {
    return NextResponse.json({ error: error?.message || "insert failed" }, { status: 500 })
  }

  // Add owner as a member
  await admin.from("vsxo_agency_members").insert({
    agency_id: agency.id,
    user_id: user.id,
    role: "owner",
  })

  // Patch CRM contact id if we got one
  if (crmContactId) {
    await admin.from("vsxo_agencies").update({ crm_contact_id: crmContactId }).eq("id", agency.id)
  }

  return NextResponse.json({ id: agency.id, slug: agency.slug, crmContactId })
}
