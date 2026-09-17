import { z } from "zod"

import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { createSupabaseServerClient } from "@/lib/supabase/server"

const cancelSchema = z.object({ reason: z.string().trim().max(2000).optional() })

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!z.uuid().safeParse(id).success) return Response.json({ error: "Invalid booking." }, { status: 400 })
  const parsed = cancelSchema.safeParse(await request.json().catch(() => ({})))
  if (!parsed.success) return Response.json({ error: "Invalid cancellation request." }, { status: 400 })
  const supabase = await createSupabaseServerClient()
  const admin = createSupabaseAdminClient()
  if (!supabase || !admin) return Response.json({ error: "Account services are not configured." }, { status: 503 })
  const { data } = await supabase.auth.getUser()
  if (!data.user) return Response.json({ error: "Sign in required." }, { status: 401 })

  const { data: order } = await admin.from("orders").select("id,status,payment_status").eq("id", id).eq("user_id", data.user.id).maybeSingle()
  if (!order) return Response.json({ error: "Booking not found." }, { status: 404 })
  if (["in_progress", "completed", "cancelled", "expired", "refunded"].includes(order.status)) return Response.json({ error: "This booking can no longer be cancelled online." }, { status: 409 })
  const nextStatus = order.payment_status === "paid" ? "cancellation_requested" : "cancelled"
  const { error } = await admin.from("orders").update({ status: nextStatus, cancellation_requested_at: new Date().toISOString(), cancellation_reason: parsed.data.reason || null }).eq("id", id).eq("user_id", data.user.id)
  if (error) return Response.json({ error: "Cancellation could not be recorded." }, { status: 500 })
  return Response.json({ status: nextStatus }, { headers: { "Cache-Control": "no-store" } })
}
