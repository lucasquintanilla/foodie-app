import "server-only"

import { redirect } from "next/navigation"
import { connection } from "next/server"

import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function getCurrentUser() {
  await connection()
  const supabase = await createSupabaseServerClient()
  if (!supabase) return null
  const { data } = await supabase.auth.getUser()
  return data.user ?? null
}

export async function requireUser(next = "/account") {
  const user = await getCurrentUser()
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`)
  return user
}

export async function requireAdmin() {
  const user = await requireUser("/admin")
  const admin = createSupabaseAdminClient()
  if (!admin) redirect("/?configuration=required")
  const { data } = await admin.from("admin_users").select("user_id").eq("user_id", user.id).maybeSingle()
  if (!data) redirect("/account?error=not-authorised")
  return { user, admin }
}
