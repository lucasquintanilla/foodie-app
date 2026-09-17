import type Stripe from "stripe"

import { appUrl } from "@/lib/env"
import { createStripeClient } from "@/lib/stripe"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { checkoutRequestSchema, isWithinCoolingOffPeriod } from "@/lib/validation/checkout"
import type { ServiceIntakeQuestion } from "@/types"

export const runtime = "nodejs"

type ServiceRow = {
  id: string
  name: string
  category: string
  base_estimate_cents: number
  is_add_on: boolean
  is_active: boolean
  intake_schema: ServiceIntakeQuestion[]
}

function jsonError(error: string, status: number) {
  return Response.json({ error }, { status, headers: { "Cache-Control": "no-store" } })
}

export async function POST(request: Request) {
  const parsed = checkoutRequestSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message || "Invalid booking details.", 400)

  const payload = parsed.data
  const today = new Date().toISOString().slice(0, 10)
  if (payload.preferredDate < today) return jsonError("The preferred date must be today or later.", 400)
  const insideCoolingOffPeriod = isWithinCoolingOffPeriod(payload.preferredDate)
  if (insideCoolingOffPeriod && (!payload.earlyPerformanceRequested || !payload.earlyPerformanceAcknowledged)) return jsonError("Early-performance consent is required for a date within 14 days.", 400)

  const [supabase, admin] = await Promise.all([createSupabaseServerClient(), Promise.resolve(createSupabaseAdminClient())])
  const stripe = createStripeClient()
  const priceId = process.env.STRIPE_BOOKING_FEE_PRICE_ID
  if (!supabase || !admin || !stripe || !priceId) return jsonError("Secure checkout is still being configured for this private preview.", 503)

  const { data: authData } = await supabase.auth.getUser()
  const user = authData.user
  if (!user?.email) return jsonError("Sign in before starting checkout.", 401)

  const { data: existing } = await admin.from("orders").select("id,stripe_checkout_session_id").eq("user_id", user.id).eq("idempotency_key", payload.idempotencyKey).maybeSingle()
  if (existing?.stripe_checkout_session_id) {
    const session = await stripe.checkout.sessions.retrieve(existing.stripe_checkout_session_id)
    if (session.url) return Response.json({ url: session.url }, { headers: { "Cache-Control": "no-store" } })
  }

  const requestedIds = [...new Set(payload.lines.map((line) => line.serviceId))]
  if (requestedIds.length !== payload.lines.length) return jsonError("Each service may appear only once in the tray.", 400)
  const { data: serviceData, error: servicesError } = await admin.from("services").select("id,name,category,base_estimate_cents,is_add_on,is_active,intake_schema").in("id", requestedIds)
  if (servicesError || serviceData?.length !== requestedIds.length) return jsonError("One or more services are no longer available.", 400)

  const services = serviceData as ServiceRow[]
  if (services.some((service) => !service.is_active)) return jsonError("One or more services are no longer available.", 400)
  if (services.every((service) => service.is_add_on)) return jsonError("An add-on cannot be booked without a main service.", 400)
  const answerMap = new Map(payload.answers.map((answer) => [`${answer.serviceId}:${answer.questionId}`, answer.answer.trim()]))
  for (const service of services) {
    for (const question of service.intake_schema) {
      if (question.required && !answerMap.get(`${service.id}:${question.id}`)) return jsonError(`Answer the required question for ${service.name}: ${question.label}`, 400)
    }
  }

  const serviceById = new Map(services.map((service) => [service.id, service]))
  const estimatedTotalCents = payload.lines.reduce((sum, line) => sum + (serviceById.get(line.serviceId)?.base_estimate_cents ?? 0) * line.quantity, 0)
  const photoRows: Array<{ storage_path: string; mime_type: string; size_bytes: number }> = []
  for (const path of payload.photoPaths) {
    if (!path.startsWith(`${user.id}/`)) return jsonError("A photo path does not belong to this account.", 403)
    const filename = path.slice(user.id.length + 1)
    const { data: files, error } = await admin.storage.from("job-photos").list(user.id, { search: filename, limit: 2 })
    const file = files?.find((entry) => entry.name === filename)
    const mime = String(file?.metadata?.mimetype ?? "")
    const size = Number(file?.metadata?.size ?? 0)
    if (error || !file || !["image/jpeg", "image/png", "image/webp"].includes(mime) || size < 1 || size > 5 * 1024 * 1024) return jsonError("A photo failed server-side validation.", 400)
    photoRows.push({ storage_path: path, mime_type: mime, size_bytes: size })
  }

  const legalAcceptedAt = new Date().toISOString()
  const orderInsert = {
    user_id: user.id,
    environment: process.env.APP_ENV === "production" ? "production" : "staging",
    contact_name: payload.customer.fullName,
    contact_email: user.email,
    contact_phone: payload.customer.phone,
    address_line_1: payload.customer.addressLine1,
    address_line_2: payload.customer.addressLine2 || null,
    city: payload.customer.city,
    county: payload.customer.county,
    eircode: payload.customer.eircode || null,
    preferred_date: payload.preferredDate,
    preferred_time: payload.preferredTime,
    notes: payload.notes || null,
    estimated_total_cents: estimatedTotalCents,
    terms_version: payload.legalVersion,
    terms_accepted_at: legalAcceptedAt,
    early_performance_requested: payload.earlyPerformanceRequested,
    early_performance_acknowledged: payload.earlyPerformanceAcknowledged,
    early_performance_accepted_at: payload.earlyPerformanceAcknowledged ? legalAcceptedAt : null,
    idempotency_key: payload.idempotencyKey,
  }
  const { data: order, error: orderError } = await admin.from("orders").insert(orderInsert).select("id").single()
  if (orderError || !order) return jsonError("The booking could not be created. Please retry once.", orderError?.code === "23505" ? 409 : 500)

  try {
    const itemRows = payload.lines.map((line) => {
      const service = serviceById.get(line.serviceId)!
      return { order_id: order.id, service_id: service.id, service_name: service.name, category: service.category, unit_estimate_cents: service.base_estimate_cents, quantity: line.quantity }
    })
    const answerRows = payload.answers.flatMap((answer) => {
      const service = serviceById.get(answer.serviceId)
      const question = service?.intake_schema.find((item) => item.id === answer.questionId)
      return service && question && answer.answer.trim() ? [{ order_id: order.id, service_id: service.id, question_id: question.id, question_label: question.label, answer: answer.answer.trim() }] : []
    })
    const writes = [admin.from("order_items").insert(itemRows)]
    if (answerRows.length) writes.push(admin.from("order_answers").insert(answerRows))
    if (photoRows.length) writes.push(admin.from("order_photos").insert(photoRows.map((photo) => ({ ...photo, order_id: order.id, user_id: user.id }))))
    const results = await Promise.all(writes)
    const childError = results.find((result) => result.error)?.error
    if (childError) throw childError

    await admin.from("profiles").upsert({ id: user.id, full_name: payload.customer.fullName, phone: payload.customer.phone, address_line_1: payload.customer.addressLine1, address_line_2: payload.customer.addressLine2 || null, city: payload.customer.city, county: payload.customer.county, eircode: payload.customer.eircode || null, updated_at: legalAcceptedAt })

    const metadata: Stripe.MetadataParam = { fixora_order_id: order.id, user_id: user.id, environment: orderInsert.environment }
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: user.email,
      client_reference_id: order.id,
      submit_type: "book",
      success_url: `${appUrl()}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl()}/?checkout=cancelled`,
      invoice_creation: { enabled: true },
      metadata,
      payment_intent_data: { metadata, receipt_email: user.email },
      integration_identifier: "fixora_mvp_qzjtvkna",
    }, { idempotencyKey: `fixora_${payload.idempotencyKey}` })
    if (!session.url) throw new Error("Stripe did not return a hosted checkout URL.")
    await admin.from("orders").update({ stripe_checkout_session_id: session.id }).eq("id", order.id)
    return Response.json({ url: session.url }, { headers: { "Cache-Control": "no-store" } })
  } catch {
    await admin.from("orders").update({ payment_status: "failed" }).eq("id", order.id)
    return jsonError("Secure checkout could not be started. Your card was not charged.", 502)
  }
}
