import Stripe from "stripe"

import { createStripeClient } from "@/lib/stripe"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const stripe = createStripeClient()
  const admin = createSupabaseAdminClient()
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  const signature = request.headers.get("stripe-signature")
  if (!stripe || !admin || !webhookSecret || !signature) return Response.json({ error: "Webhook is not configured." }, { status: 503 })

  let event: Stripe.Event
  try {
    const body = await request.text()
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret, undefined, Stripe.createSubtleCryptoProvider())
  } catch {
    return Response.json({ error: "Invalid webhook signature." }, { status: 400 })
  }

  const { data: seen } = await admin.from("stripe_events").select("event_id").eq("event_id", event.id).maybeSingle()
  if (seen) return Response.json({ received: true, duplicate: true })

  try {
    if (["checkout.session.completed", "checkout.session.async_payment_succeeded"].includes(event.type)) {
      const session = event.data.object as Stripe.Checkout.Session
      if (session.payment_status === "paid" && session.metadata?.fixora_order_id) {
        await admin.from("orders").update({ status: "requested", payment_status: "paid", stripe_checkout_session_id: session.id, stripe_payment_intent_id: typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id, paid_at: new Date(event.created * 1000).toISOString() }).eq("id", session.metadata.fixora_order_id).eq("status", "awaiting_payment")
      }
    } else if (event.type === "checkout.session.async_payment_failed") {
      const session = event.data.object as Stripe.Checkout.Session
      if (session.metadata?.fixora_order_id) await admin.from("orders").update({ payment_status: "failed" }).eq("id", session.metadata.fixora_order_id).eq("status", "awaiting_payment")
    } else if (event.type === "checkout.session.expired") {
      const session = event.data.object as Stripe.Checkout.Session
      if (session.metadata?.fixora_order_id) await admin.from("orders").update({ status: "expired", payment_status: "failed" }).eq("id", session.metadata.fixora_order_id).eq("status", "awaiting_payment")
    } else if (event.type === "charge.refunded") {
      const charge = event.data.object as Stripe.Charge
      const paymentIntentId = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id
      if (charge.refunded && paymentIntentId) await admin.from("orders").update({ status: "refunded", payment_status: "refunded", stripe_refund_id: charge.refunds?.data[0]?.id ?? null }).eq("stripe_payment_intent_id", paymentIntentId)
    } else if (event.type === "refund.updated") {
      const refund = event.data.object as Stripe.Refund
      const paymentIntentId = typeof refund.payment_intent === "string" ? refund.payment_intent : refund.payment_intent?.id
      if (refund.status === "succeeded" && paymentIntentId) await admin.from("orders").update({ status: "refunded", payment_status: "refunded", stripe_refund_id: refund.id }).eq("stripe_payment_intent_id", paymentIntentId)
    }
    await admin.from("stripe_events").insert({ event_id: event.id, event_type: event.type, livemode: event.livemode })
    return Response.json({ received: true })
  } catch {
    return Response.json({ error: "Webhook processing failed." }, { status: 500 })
  }
}
