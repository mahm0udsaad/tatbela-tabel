import { createClient } from "@/lib/supabase/server"
import { ShippingAdminClient } from "./shipping-admin-client"

export const dynamic = "force-dynamic"

export default async function ShippingAdminPage() {
  const supabase = await createClient()
  const { data: zones } = await supabase
    .from("shipping_zones")
    .select("id, governorate, base_rate, per_kg_rate, estimated_days, sort_order")
    .order("sort_order", { ascending: true, nullsFirst: true })
    .order("governorate", { ascending: true })

  return (
    <div className="bg-[#F5F1E8] rounded-lg">
      <ShippingAdminClient initialZones={zones ?? []} />
    </div>
  )
}

