import { createClient } from "@/lib/supabase/server"
import { B2BSettingsClient } from "./settings-client"

export const dynamic = "force-dynamic"

export default async function B2BSettingsPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("b2b_settings")
    .select("id, price_hidden, contact_label, contact_url")
    .maybeSingle()

  return (
    <div className="bg-[#F5F1E8] rounded-lg">
      <B2BSettingsClient initialSettings={data ?? null} />
    </div>
  )
}

