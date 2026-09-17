import { AccountShell } from "@/components/account/account-shell"
import { ProfileForm } from "@/components/account/profile-form"
import { requireUser } from "@/lib/supabase/auth"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export default async function AccountPage() {
  const user = await requireUser("/account")
  const supabase = await createSupabaseServerClient()
  const { data } = supabase ? await supabase.from("profiles").select("id,full_name,phone,address_line_1,address_line_2,city,county,eircode").eq("id", user.id).maybeSingle() : { data: null }
  const profile = { id: user.id, email: user.email ?? "", full_name: data?.full_name ?? (user.user_metadata.full_name as string | undefined) ?? null, phone: data?.phone ?? null, address_line_1: data?.address_line_1 ?? null, address_line_2: data?.address_line_2 ?? null, city: data?.city ?? null, county: data?.county ?? null, eircode: data?.eircode ?? null }
  return <AccountShell title="Your account"><ProfileForm profile={profile} /></AccountShell>
}
