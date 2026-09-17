"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { createStripeClient } from "@/lib/stripe"
import { requireAdmin } from "@/lib/supabase/auth"

const allowedStatuses = ["requested", "confirmed", "in_progress", "completed", "cancellation_requested", "cancelled"] as const

export async function updateOrderAction(formData: FormData) {
  const { admin } = await requireAdmin()
  const parsed = z.object({ id: z.uuid(), status: z.enum(allowedStatuses), confirmedTotal: z.string(), confirmedStart: z.string().optional(), assignedStaff: z.string().max(160).optional(), internalNotes: z.string().max(5000).optional() }).safeParse(Object.fromEntries(formData))
  if (!parsed.success) return
  const confirmedTotalCents = Math.round(Number(parsed.data.confirmedTotal) * 100)
  if (!Number.isInteger(confirmedTotalCents) || confirmedTotalCents < 0) return
  const now = new Date()
  await admin.from("orders").update({ status: parsed.data.status, confirmed_total_cents: confirmedTotalCents, confirmed_start_at: parsed.data.confirmedStart ? new Date(parsed.data.confirmedStart).toISOString() : null, assigned_staff: parsed.data.assignedStaff || null, internal_notes: parsed.data.internalNotes || null, completed_at: parsed.data.status === "completed" ? now.toISOString() : null }).eq("id", parsed.data.id)
  if (parsed.data.status === "completed") await admin.from("order_photos").update({ delete_after: new Date(now.getTime() + 90 * 86_400_000).toISOString() }).eq("order_id", parsed.data.id)
  revalidatePath("/admin")
  revalidatePath(`/account/bookings/${parsed.data.id}`)
}

export async function refundOrderAction(formData: FormData) {
  const { admin } = await requireAdmin()
  const stripe = createStripeClient()
  const id = String(formData.get("id") ?? "")
  if (!stripe || !z.uuid().safeParse(id).success) return
  const { data: order } = await admin.from("orders").select("id,stripe_payment_intent_id,payment_status").eq("id", id).maybeSingle()
  if (!order?.stripe_payment_intent_id || order.payment_status !== "paid") return
  await stripe.refunds.create({ payment_intent: order.stripe_payment_intent_id, amount: 1000, metadata: { fixora_order_id: order.id } }, { idempotencyKey: `fixora_refund_${order.id}` })
  await admin.from("orders").update({ status: "cancellation_requested" }).eq("id", id)
  revalidatePath("/admin")
}
