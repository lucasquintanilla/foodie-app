import type { EmailOtpType } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const tokenHash = url.searchParams.get("token_hash")
  const type = url.searchParams.get("type") as EmailOtpType | null
  const supabase = await createSupabaseServerClient()
  if (tokenHash && type && supabase) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
    if (!error) return NextResponse.redirect(new URL("/account", url.origin))
  }
  return NextResponse.redirect(new URL("/login?error=confirmation", url.origin))
}
