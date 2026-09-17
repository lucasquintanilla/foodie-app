"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { CircleUserRound, LogIn } from "lucide-react"

import { Button } from "@/components/ui/button"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"

export function AccountButton() {
  const [signedIn, setSignedIn] = useState(false)

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()
    if (!supabase) return
    void supabase.auth.getUser().then(({ data }) => setSignedIn(Boolean(data.user)))
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setSignedIn(Boolean(session?.user)))
    return () => data.subscription.unsubscribe()
  }, [])

  return (
    <Button asChild variant="ghost" className="rounded-full bg-white/10 text-white hover:bg-white/20 hover:text-white">
      <Link href={signedIn ? "/account" : "/login"}>
        {signedIn ? <CircleUserRound className="mr-2 h-4 w-4" /> : <LogIn className="mr-2 h-4 w-4" />}
        {signedIn ? "Account" : "Sign in"}
      </Link>
    </Button>
  )
}
