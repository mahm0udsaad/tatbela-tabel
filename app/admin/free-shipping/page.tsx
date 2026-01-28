import { createClient } from "@/lib/supabase/server"
import { FreeShippingAdminClient } from "./free-shipping-admin-client"

export const dynamic = "force-dynamic"

export default async function FreeShippingPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("free_shipping_rules")
    .select("id, threshold_amount, expires_at, is_active")
    .eq("applies_to", "b2c")
    .maybeSingle()

  return (
    <div className="rounded-lg">
      <FreeShippingAdminClient initialRule={data ?? null} />
    </div>
  )
}

