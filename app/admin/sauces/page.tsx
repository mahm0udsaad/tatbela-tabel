import { createClient } from "@/lib/supabase/server"
import { SaucesSettingsClient } from "./sauces-settings-client"

export const dynamic = "force-dynamic"

export default async function AdminSaucesPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("page_settings")
    .select("is_active, payload")
    .eq("key", "sauces_page")
    .single()

  return (
    <div className="bg-[#F5F1E8] rounded-lg">
      <SaucesSettingsClient initialSettings={data ?? null} />
    </div>
  )
}

