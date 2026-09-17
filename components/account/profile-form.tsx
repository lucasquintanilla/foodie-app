"use client"

import { type FormEvent, useState } from "react"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"

type Profile = { id: string; email: string; full_name: string | null; phone: string | null; address_line_1: string | null; address_line_2: string | null; city: string | null; county: string | null; eircode: string | null }

export function ProfileForm({ profile }: { profile: Profile }) {
  const [values, setValues] = useState(profile)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")

  async function submit(event: FormEvent) {
    event.preventDefault()
    const supabase = createSupabaseBrowserClient()
    if (!supabase) return setMessage("Account services are not configured.")
    setBusy(true)
    const { error } = await supabase.from("profiles").update({ full_name: values.full_name, phone: values.phone, address_line_1: values.address_line_1, address_line_2: values.address_line_2, city: values.city, county: values.county, eircode: values.eircode, updated_at: new Date().toISOString() }).eq("id", profile.id)
    setMessage(error ? error.message : "Profile saved.")
    setBusy(false)
  }

  return <form onSubmit={submit} className="grid max-w-2xl gap-4 rounded-3xl bg-white p-6 shadow-sm sm:grid-cols-2">{([ ["full_name", "Full name"], ["phone", "Telephone"], ["address_line_1", "Address line 1"], ["address_line_2", "Address line 2"], ["city", "City"], ["county", "County"], ["eircode", "Eircode"] ] as const).map(([key, label]) => <div key={key} className={key.startsWith("address") ? "space-y-2 sm:col-span-2" : "space-y-2"}><Label htmlFor={key}>{label}</Label><Input id={key} value={values[key] ?? ""} onChange={(event) => setValues((current) => ({ ...current, [key]: event.target.value }))} className="h-11 rounded-xl" /></div>)}<div className="space-y-2 sm:col-span-2"><Label>Email</Label><Input value={profile.email} disabled className="h-11 rounded-xl" /></div>{message ? <p role="status" className="text-sm text-slate-600 sm:col-span-2">{message}</p> : null}<Button disabled={busy} className="h-11 rounded-full bg-[#072d3b] sm:col-span-2 sm:w-fit">{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Save details</Button></form>
}
