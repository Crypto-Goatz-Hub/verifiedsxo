/**
 * GET /api/stripe/portal
 * Redirects the signed-in agency owner to Stripe's Billing Portal for
 * self-serve subscription management (update card, change plan, view
 * invoices, cancel). Requires the agency to have at least one
 * recognisable Stripe customer — discovered by looking up any live
 * subscription metadata tagged with this agency_id.
 */

import { NextRequest, NextResponse } from "next/server"
import { getStripe } from "@/lib/stripe"
import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabase/server"

export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    const dest = new URL("/login", url.origin)
    dest.searchParams.set("next", "/account")
    return NextResponse.redirect(dest)
  }

  const admin = getSupabaseAdmin()
  const { data: agency } = await admin
    .from("vsxo_agencies")
    .select("id, name, plan, membership_stripe_sub_id")
    .eq("owner_user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle()

  if (!agency) return NextResponse.redirect(new URL("/signup", url.origin))

  const stripe = getStripe()

  // Find customer id. We try subscriptions we stored on the agency first.
  let customerId: string | null = null

  if (agency.membership_stripe_sub_id) {
    try {
      const sub = await stripe.subscriptions.retrieve(agency.membership_stripe_sub_id)
      customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id
    } catch {}
  }

  // Fallback: search by metadata tag
  if (!customerId) {
    try {
      const search = await stripe.subscriptions.search({
        query: `metadata['vsxo_agency_id']:'${agency.id}' AND status:'active'`,
        limit: 1,
      })
      if (search.data[0]) {
        customerId = typeof search.data[0].customer === "string"
          ? search.data[0].customer
          : search.data[0].customer.id
      }
    } catch {}
  }

  // Fallback: customer lookup by email
  if (!customerId && user.email) {
    try {
      const list = await stripe.customers.list({ email: user.email, limit: 1 })
      if (list.data[0]) customerId = list.data[0].id
    } catch {}
  }

  if (!customerId) {
    const dest = new URL("/pricing", url.origin)
    dest.searchParams.set("err", "no_subscription")
    return NextResponse.redirect(dest)
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${url.origin}/account`,
  })
  return NextResponse.redirect(session.url, 303)
}
