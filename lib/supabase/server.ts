import "server-only"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/env"

export async function createSupabaseServerClient() {
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) return null

  const cookieStore = await cookies()

  return createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // Server Components cannot always set cookies. proxy.ts refreshes the session.
        }
      },
    },
  })
}
