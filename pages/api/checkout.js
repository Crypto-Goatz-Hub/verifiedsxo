// VerifiedSXO — Stripe Checkout for Pro subscription ($8/mo)
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '')

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email, userId } = req.body

  try {
    const sessionParams = {
      mode: 'subscription',
      line_items: [{
        price: process.env.STRIPE_PRICE_VERIFIED_PRO,
        quantity: 1,
      }],
      success_url: `${process.env.NEXTAUTH_URL || 'https://verifiedsxo.com'}?upgraded=true`,
      cancel_url: `${process.env.NEXTAUTH_URL || 'https://verifiedsxo.com'}?canceled=true`,
      metadata: {
        app: 'verifiedsxo',
        userId: userId || '',
      },
    }

    if (email) {
      sessionParams.customer_email = email
    }

    const session = await stripe.checkout.sessions.create(sessionParams)

    return res.status(200).json({ url: session.url, sessionId: session.id })
  } catch (error) {
    console.error('Checkout error:', error)
    return res.status(500).json({ error: 'Failed to create checkout session' })
  }
}
