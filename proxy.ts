import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/env"

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) return response

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  })

  const { data } = await supabase.auth.getUser()
  if (data.user || request.nextUrl.pathname.startsWith("/account") || request.nextUrl.pathname.startsWith("/admin")) {
    response.headers.set("Cache-Control", "private, no-store, max-age=0")
    response.headers.set("Vary", "Cookie")
  }
  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|icon.png|fixora-mark.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
