import { createClient } from "@/lib/supabase/server"
import { ShippingAdminClient } from "./shipping-admin-client"

export const dynamic = "force-dynamic"

export default async function ShippingAdminPage() {
  const supabase = await createClient()
  const [{ data: zones }, { data: freeShippingRule }] = await Promise.all([
    supabase
      .from("shipping_zones")
      .select("id, governorate, base_rate, per_kg_rate, estimated_days, sort_order")
      .order("sort_order", { ascending: true, nullsFirst: true })
      .order("governorate", { ascending: true }),
    supabase
      .from("free_shipping_rules")
      .select("id, threshold_amount, expires_at, is_active")
      .eq("applies_to", "b2c")
      .maybeSingle(),
  ])

  return (
    <div className="bg-[#F5F1E8] rounded-lg">
      <ShippingAdminClient initialZones={zones ?? []} initialFreeShippingRule={freeShippingRule ?? null} />
    </div>
  )
}

