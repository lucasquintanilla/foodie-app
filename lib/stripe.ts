import "server-only"

import Stripe from "stripe"

export function createStripeClient() {
  const key = process.env.STRIPE_RESTRICTED_KEY
  if (!key) return null
  return new Stripe(key)
}
