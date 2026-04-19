import Stripe from "stripe"

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (_stripe) return _stripe
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error("STRIPE_SECRET_KEY not set")
  _stripe = new Stripe(key, { apiVersion: "2024-12-18.acacia" as Stripe.LatestApiVersion })
  return _stripe
}

export type PlanId = "free" | "pro" | "scale"

export interface Plan {
  id: PlanId
  name: string
  priceId?: string
  priceUsd: number | "custom"
  billing: "forever" | "month" | "custom"
  tagline: string
  features: string[]
  cta: string
  href: string
  featured?: boolean
}

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    priceUsd: 0,
    billing: "forever",
    tagline: "Score + verify one client's stats.",
    features: [
      "1 client seat",
      "3 verifications per month",
      "Google Search Console connection",
      "Public verification pages",
      "Embed badge",
    ],
    cta: "Start free",
    href: "/signup",
  },
  {
    id: "pro",
    name: "Pro",
    priceId: process.env.STRIPE_PRICE_VERIFIED_PRO || "",
    priceUsd: 99,
    billing: "month",
    tagline: "For agencies compounding with 5-20 clients.",
    featured: true,
    features: [
      "Unlimited client seats",
      "Unlimited verifications",
      "GSC + GA4 + Ads + Stripe connectors",
      "Incentive bank (v2)",
      "Automated review flow (v3)",
      "White-label badge (coming)",
      "Priority support",
    ],
    cta: "Upgrade to Pro",
    href: "/api/stripe/checkout?plan=pro",
  },
  {
    id: "scale",
    name: "Scale",
    priceUsd: "custom",
    billing: "custom",
    tagline: "For 50+ clients, networks, and white-label.",
    features: [
      "Everything in Pro",
      "Full white-label + custom domain",
      "Dedicated CS engineer",
      "SSO / SAML",
      "Bulk verification API",
      "Custom data connectors",
      "Priority roadmap influence",
    ],
    cta: "Talk to us",
    href: "/contact?topic=enterprise",
  },
]
