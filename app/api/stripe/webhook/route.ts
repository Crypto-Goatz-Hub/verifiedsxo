import { NextRequest, NextResponse } from "next/server"
import type Stripe from "stripe"
import { getStripe } from "@/lib/stripe"
import { getSupabaseAdmin } from "@/lib/supabase/server"
import { pingMike } from "@/lib/notify-mike"

export const runtime = "nodejs"
// Disable built-in body parsing so we can access the raw body for signature verify
export const dynamic = "force-dynamic"

async function readBody(req: NextRequest): Promise<string> {
  return await req.text()
}

function mapPriceToPlan(priceId: string | null | undefined): "free" | "starter" | "pro" | "scale" {
  if (!priceId) return "free"
  if (priceId === process.env.STRIPE_PRICE_VERIFIED_PRO) return "pro"
  return "pro" // default non-free assumption
}

async function applySubscription(agencyId: string | null, plan: string, statusSource: string, subId?: string) {
  if (!agencyId) return
  const admin = getSupabaseAdmin()
  await admin
    .from("vsxo_agencies")
    .update({ plan, updated_at: new Date().toISOString() })
    .eq("id", agencyId)
  pingMike({
    event: plan === "free" ? "client.invite_accepted" : "agency.signup",
    headline: `Plan updated → ${plan} (${statusSource})`,
    fields: {
      "Agency ID": agencyId,
      Plan: plan,
      "Stripe sub": subId || "—",
      Source: statusSource,
    },
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
    return NextResponse.json({ error: `signature verification failed: ${err instanceof Error ? err.message : "unknown"}` }, { status: 400 })
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session
      const agencyId = (session.metadata?.vsxo_agency_id as string | undefined) || null
      const plan = (session.metadata?.vsxo_plan as string | undefined) || "pro"
      await applySubscription(agencyId, plan, "checkout.session.completed", String(session.subscription || ""))
      break
    }
    case "customer.subscription.updated":
    case "customer.subscription.created": {
      const sub = event.data.object as Stripe.Subscription
      const agencyId = (sub.metadata?.vsxo_agency_id as string | undefined) || null
      const priceId = sub.items?.data?.[0]?.price?.id
      const plan = sub.status === "active" || sub.status === "trialing"
        ? mapPriceToPlan(priceId)
        : "free"
      await applySubscription(agencyId, plan, event.type, sub.id)
      break
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription
      const agencyId = (sub.metadata?.vsxo_agency_id as string | undefined) || null
      await applySubscription(agencyId, "free", "subscription.deleted", sub.id)
      break
    }
    default:
      // ignore other events
      break
  }

  return NextResponse.json({ received: true })
}
