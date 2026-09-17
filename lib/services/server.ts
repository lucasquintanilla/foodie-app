import "server-only"

import { createClient } from "@supabase/supabase-js"

import { hasPublicSupabaseConfig, SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/env"
import { FALLBACK_SERVICES } from "@/lib/services/catalogue"
import type { ServiceItem } from "@/types"

type ServiceRow = {
  id: string
  slug: string
  name: string
  description: string
  category: string
  image_url: string
  base_estimate_cents: number
  currency: "EUR"
  is_active: boolean
  is_add_on: boolean
  intake_schema: ServiceItem["intakeSchema"]
}

function mapService(row: ServiceRow): ServiceItem {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    category: row.category,
    imageUrl: row.image_url,
    baseEstimateCents: row.base_estimate_cents,
    currency: row.currency,
    isActive: row.is_active,
    isAddOn: row.is_add_on,
    intakeSchema: row.intake_schema,
  }
}

export async function getActiveServices(): Promise<{ services: ServiceItem[]; isFallback: boolean }> {
  if (!hasPublicSupabaseConfig()) return { services: FALLBACK_SERVICES, isFallback: true }

  const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data, error } = await supabase
    .from("services")
    .select("id,slug,name,description,category,image_url,base_estimate_cents,currency,is_active,is_add_on,intake_schema")
    .eq("is_active", true)
    .order("sort_order")

  if (error || !data?.length) return { services: FALLBACK_SERVICES, isFallback: true }
  return { services: (data as ServiceRow[]).map(mapService), isFallback: false }
}
