import { NextRequest, NextResponse } from "next/server"
import { getStripe, PLANS, MEMBERSHIP, type PlanId } from "@/lib/stripe"
import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabase/server"

export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const planId = (url.searchParams.get("plan") || "pro") as PlanId

  const plan = planId === "membership" ? MEMBERSHIP : PLANS.find((p) => p.id === planId)
  if (!plan || !plan.priceId) {
    const dest = new URL("/pricing", url.origin)
    dest.searchParams.set("err", "invalid_plan")
    return NextResponse.redirect(dest)
  }

  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    const dest = new URL("/login", url.origin)
    dest.searchParams.set("next", `/api/stripe/checkout?plan=${planId}`)
    return NextResponse.redirect(dest)
  }

  const admin = getSupabaseAdmin()
  const { data: agency } = await admin
    .from("vsxo_agencies")
    .select("id, name, plan, slug")
    .eq("owner_user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle()

  if (!agency) return NextResponse.redirect(new URL("/signup", url.origin))

  const successPath = planId === "membership" ? "/dashboard?membership=active" : `/dashboard?upgraded=${planId}`

  const stripe = getStripe()
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: user.email || undefined,
    line_items: [{ price: plan.priceId, quantity: 1 }],
    success_url: `${url.origin}${successPath}`,
    cancel_url: `${url.origin}/pricing?canceled=1`,
    metadata: {
      vsxo_agency_id: agency.id,
      vsxo_user_id: user.id,
      vsxo_plan: planId,
      vsxo_agency_slug: agency.slug,
    },
    subscription_data: {
      metadata: {
        vsxo_agency_id: agency.id,
        vsxo_plan: planId,
      },
    },
    allow_promotion_codes: true,
  })

  if (!session.url) return NextResponse.redirect(new URL("/pricing?err=session_failed", url.origin))
  return NextResponse.redirect(session.url, 303)
}
