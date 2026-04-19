import { NextRequest, NextResponse } from "next/server"
import type Stripe from "stripe"
import { getStripe, mapPriceToPlan } from "@/lib/stripe"
import { getSupabaseAdmin } from "@/lib/supabase/server"
import { pingMike } from "@/lib/notify-mike"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

async function readBody(req: NextRequest): Promise<string> {
  return await req.text()
}

async function applyAgencyTier(agencyId: string | null, plan: string, source: string, subId?: string) {
  if (!agencyId) return
  const admin = getSupabaseAdmin()
  await admin
    .from("vsxo_agencies")
    .update({ plan, updated_at: new Date().toISOString() })
    .eq("id", agencyId)
  pingMike({
    event: "agency.signup",
    headline: `Plan → ${plan} (${source})`,
    fields: { "Agency ID": agencyId, Plan: plan, "Stripe sub": subId || "—", Source: source },
    link: `https://verifiedsxo.com/dashboard`,
  })
}

async function applyMembership(
  agencyId: string | null,
  status: "active" | "past_due" | "canceled",
  sub?: Stripe.Subscription,
  source?: string,
) {
  if (!agencyId) return
  const admin = getSupabaseAdmin()
  const periodEnd = sub?.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null
  await admin
    .from("vsxo_agencies")
    .update({
      membership_status: status,
      membership_stripe_sub_id: sub?.id || null,
      membership_current_period_end: periodEnd,
      public_profile_enabled: status === "active",
      updated_at: new Date().toISOString(),
    })
    .eq("id", agencyId)
  pingMike({
    event: "agency.signup",
    headline: `Membership → ${status} (${source || "?"})`,
    fields: { "Agency ID": agencyId, Status: status, "Stripe sub": sub?.id || "—", "Period end": periodEnd || "—" },
    link: `https://verifiedsxo.com/dashboard`,
  })
}

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature") || ""
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) return NextResponse.json({ error: "webhook not configured" }, { status: 500 })

  const body = await readBody(req)
  const stripe = getStripe()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret)
  } catch (err) {
    return NextResponse.json(
      { error: `signature verification failed: ${err instanceof Error ? err.message : "unknown"}` },
      { status: 400 }
    )
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session
      const agencyId = (session.metadata?.vsxo_agency_id as string | undefined) || null
      const plan = (session.metadata?.vsxo_plan as string | undefined) || "pro"
      const subId = typeof session.subscription === "string" ? session.subscription : null
      if (plan === "membership") {
        const sub = subId ? await stripe.subscriptions.retrieve(subId) : undefined
        await applyMembership(agencyId, "active", sub, "checkout.session.completed")
      } else {
        await applyAgencyTier(agencyId, plan, "checkout.session.completed", subId || undefined)
      }
      break
    }
    case "customer.subscription.updated":
    case "customer.subscription.created": {
      const sub = event.data.object as Stripe.Subscription
      const agencyId = (sub.metadata?.vsxo_agency_id as string | undefined) || null
      const planMeta = (sub.metadata?.vsxo_plan as string | undefined) || ""
      const priceId = sub.items?.data?.[0]?.price?.id
      const inferredPlan = mapPriceToPlan(priceId)

      if (planMeta === "membership" || inferredPlan === "membership") {
        const status = sub.status === "active" || sub.status === "trialing" ? "active"
          : sub.status === "past_due" ? "past_due"
          : "canceled"
        await applyMembership(agencyId, status, sub, event.type)
      } else {
        const plan =
          sub.status === "active" || sub.status === "trialing" ? inferredPlan : "free"
        await applyAgencyTier(agencyId, plan, event.type, sub.id)
      }
      break
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription
      const agencyId = (sub.metadata?.vsxo_agency_id as string | undefined) || null
      const planMeta = (sub.metadata?.vsxo_plan as string | undefined) || ""
      const priceId = sub.items?.data?.[0]?.price?.id
      if (planMeta === "membership" || mapPriceToPlan(priceId) === "membership") {
        await applyMembership(agencyId, "canceled", sub, "subscription.deleted")
      } else {
        await applyAgencyTier(agencyId, "free", "subscription.deleted", sub.id)
      }
      break
    }
    default:
      break
  }

  return NextResponse.json({ received: true })
}
