// ============================================================
// verifiedsxo — Google (via 0n / pwu) sign-in callback
// ============================================================
// verifiedsxo already authenticates against pwu (the 0n master
// identity), so this is a plain Supabase code exchange — the session
// IS the pwu session, no bridging. For a brand-new Google user we
// auto-provision a minimal agency so the dashboard doesn't bounce them
// to /signup (where the password form would conflict with their
// already-authenticated Google account).
// ============================================================

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40)
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const code = url.searchParams.get("code")
  const nextParam = url.searchParams.get("next")
  const next = nextParam && nextParam.startsWith("/") ? nextParam : "/dashboard"
  const oauthError = url.searchParams.get("error")

  if (oauthError) return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(oauthError)}`, url.origin))
  if (!code) return NextResponse.redirect(new URL("/login?error=missing_code", url.origin))

  const supabase = await getSupabaseServer()
  const { data: xchg, error } = await supabase.auth.exchangeCodeForSession(code)
  if (error || !xchg?.user) {
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error?.message || "exchange_failed")}`, url.origin))
  }

  // Ensure the new Google user has an agency (existing users already do).
  try {
    const user = xchg.user
    const admin = getSupabaseAdmin()

    const { data: owned } = await admin.from("vsxo_agencies").select("id").eq("owner_user_id", user.id).limit(1).maybeSingle()
    const { data: member } = owned ? { data: null } : await admin.from("vsxo_agency_members").select("id").eq("user_id", user.id).limit(1).maybeSingle()
    const { data: client } = owned || member ? { data: null } : await admin.from("vsxo_agency_clients").select("id").eq("user_id", user.id).limit(1).maybeSingle()

    if (!owned && !member && !client) {
      const displayName =
        (user.user_metadata?.full_name as string) ||
        (user.user_metadata?.name as string) ||
        (user.email ? user.email.split("@")[0] : "My Agency")
      const name = `${displayName.split(" ")[0]}'s Agency`.slice(0, 60)

      const base = slugify(name) || `agency-${user.id.slice(0, 8)}`
      let slug = base
      for (let i = 0; i < 6; i++) {
        const { data: exists } = await admin.from("vsxo_agencies").select("id").eq("slug", slug).maybeSingle()
        if (!exists) break
        slug = `${base}-${user.id.slice(0, 4)}${i}`
      }

      const { data: agency } = await admin
        .from("vsxo_agencies")
        .insert({ owner_user_id: user.id, name, slug, referral_code: slug })
        .select("id")
        .single()
      if (agency) {
        await admin.from("vsxo_agency_members").insert({ agency_id: agency.id, user_id: user.id, role: "owner" })
      }
    }
  } catch {
    // Non-fatal — user is signed in; dashboard will route them to /signup if provisioning missed.
  }

  return NextResponse.redirect(new URL(next, url.origin))
}
