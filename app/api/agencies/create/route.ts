import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabase/server"
import { upsertContact } from "@/lib/crm"
import { pingMike } from "@/lib/notify-mike"

export const runtime = "nodejs"

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40)
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

  // Resolve referral attribution from cookie
  const refCookie = req.cookies.get("vsxo_ref")?.value?.toLowerCase()
  let referredBy: string | null = null
  if (refCookie && /^[a-z0-9][a-z0-9-]{1,40}$/.test(refCookie)) {
    const { data: ref } = await admin
      .from("vsxo_agencies")
      .select("id")
      .eq("referral_code", refCookie)
      .maybeSingle()
    referredBy = ref?.id || null
  }

  // Upsert CRM contact in parallel with agency row
  const userName = user.user_metadata?.full_name || user.email || "there"
  const [crmResult, { data: agency, error }] = await Promise.all([
    upsertContact({
      email: user.email || "",
      firstName: userName.split(" ")[0] || userName,
      lastName: userName.split(" ").slice(1).join(" ") || "",
      source: "VerifiedSXO Agency Signup",
      tags: ["Agency", "verifiedsxo", `agency:${slugify(name)}`],
    }),
    admin
      .from("vsxo_agencies")
      .insert({
        owner_user_id: user.id,
        name,
        slug,
        referral_code: slug,
        referred_by_agency_id: referredBy,
        referred_at: referredBy ? new Date().toISOString() : null,
      })
      .select("id, slug")
      .single(),
  ])
  const crmContactId = crmResult.id

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

  pingMike({
    event: "agency.signup",
    headline: `New agency: ${name}`,
    fields: {
      Agency: name,
      Slug: agency.slug,
      Owner: user.email || user.id,
      "CRM contact": crmContactId || "(not created)",
    },
    link: `https://verifiedsxo.com/dashboard`,
  })

  return NextResponse.json({ id: agency.id, slug: agency.slug, crmContactId })
}
