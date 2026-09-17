"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { type FormEvent, useState } from "react"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { appUrl } from "@/lib/env"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"

type Mode = "sign-in" | "sign-up" | "recovery" | "update"

export function LoginForm({ initialMode, nextPath, initialError }: { initialMode: Mode; nextPath: string; initialError?: string }) {
  const googleAuthEnabled = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true"
  const router = useRouter()
  const [mode, setMode] = useState<Mode>(initialMode)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [message, setMessage] = useState(initialError ?? "")
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    const supabase = createSupabaseBrowserClient()
    if (!supabase) return setMessage("Account services are being configured for this preview.")
    setBusy(true)
    setMessage("")

    if (mode === "sign-in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setMessage(error.message)
      else router.push(nextPath)
    } else if (mode === "sign-up") {
      const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName }, emailRedirectTo: `${appUrl()}/auth/callback?next=${encodeURIComponent(nextPath)}` } })
      setMessage(error ? error.message : "Check your email to verify your account, then return to sign in.")
    } else if (mode === "recovery") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${appUrl()}/auth/callback?next=${encodeURIComponent("/login?mode=update")}` })
      setMessage(error ? error.message : "If an account exists, a password reset link has been sent.")
    } else {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) setMessage(error.message)
      else router.push("/account")
    }
    setBusy(false)
  }

  async function signInWithGoogle() {
    const supabase = createSupabaseBrowserClient()
    if (!supabase) return setMessage("Account services are being configured for this preview.")
    setBusy(true)
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${appUrl()}/auth/callback?next=${encodeURIComponent(nextPath)}`, scopes: "openid email profile" } })
    if (error) {
      setMessage(error.message)
      setBusy(false)
    }
  }

  const title = mode === "sign-up" ? "Create your account" : mode === "recovery" ? "Reset your password" : mode === "update" ? "Choose a new password" : "Welcome back"

  return (
    <div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-8">
      <h1 className="text-3xl font-semibold tracking-tight text-[#072d3b]">{title}</h1>
      <p className="mt-2 text-sm leading-6 text-slate-500">Use your account to pay booking fees and keep all service requests together.</p>
      <form className="mt-7 space-y-4" onSubmit={submit}>
        {mode === "sign-up" ? <div className="space-y-2"><Label htmlFor="full-name">Full name</Label><Input id="full-name" autoComplete="name" required value={fullName} onChange={(event) => setFullName(event.target.value)} className="h-11 rounded-xl" /></div> : null}
        {mode !== "update" ? <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="h-11 rounded-xl" /></div> : null}
        {mode !== "recovery" ? <div className="space-y-2"><Label htmlFor="password">{mode === "update" ? "New password" : "Password"}</Label><Input id="password" type="password" autoComplete={mode === "sign-in" ? "current-password" : "new-password"} required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} className="h-11 rounded-xl" /></div> : null}
        {message ? <p role="status" className="rounded-xl bg-slate-100 p-3 text-sm leading-5 text-slate-700">{message}</p> : null}
        <Button type="submit" disabled={busy} className="h-12 w-full rounded-full bg-[#072d3b]">{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}{mode === "sign-up" ? "Create account" : mode === "recovery" ? "Send reset link" : mode === "update" ? "Save new password" : "Sign in"}</Button>
      </form>
      {(mode === "sign-in" || mode === "sign-up") && googleAuthEnabled ? <><div className="my-5 flex items-center gap-3 text-xs text-slate-400"><span className="h-px flex-1 bg-slate-200" />or<span className="h-px flex-1 bg-slate-200" /></div><Button variant="outline" disabled={busy} className="h-12 w-full rounded-full" onClick={() => void signInWithGoogle()}>Continue with Google</Button></> : null}
      <div className="mt-6 flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm">
        {mode !== "sign-in" ? <button className="text-[#0b776a] underline" onClick={() => { setMode("sign-in"); setMessage("") }}>Sign in</button> : null}
        {mode === "sign-in" ? <button className="text-[#0b776a] underline" onClick={() => { setMode("sign-up"); setMessage("") }}>Create account</button> : null}
        {mode === "sign-in" ? <button className="text-slate-500 underline" onClick={() => { setMode("recovery"); setMessage("") }}>Forgot password?</button> : null}
      </div>
      <p className="mt-6 text-center text-xs leading-5 text-slate-400">By creating an account, you agree to the <Link href="/legal/terms" className="underline">Terms</Link> and acknowledge the <Link href="/legal/privacy" className="underline">Privacy Notice</Link>.</p>
    </div>
  )
}
