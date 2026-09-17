import "server-only"

import { createClient } from "@supabase/supabase-js"

import { SUPABASE_URL } from "@/lib/env"

export function createSupabaseAdminClient() {
  const secretKey = process.env.SUPABASE_SECRET_KEY
  if (!SUPABASE_URL || !secretKey) return null

  return createClient(SUPABASE_URL, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
