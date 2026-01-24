import { createClient } from "@/lib/supabase/server"
import { SiteContentAdminClient } from "./site-content-admin-client"

export const dynamic = "force-dynamic"

type PageSettingsRow = {
  key: string
  is_active: boolean
  payload: unknown
  updated_at?: string | null
}

export default async function AdminSiteContentPage() {
  const supabase = await createClient()

  const keys = ["footer", "contact_page", "about_page", "privacy_policy", "terms", "shipping_policy", "refund_policy"]

  const { data, error } = await supabase
    .from("page_settings")
    .select("key, is_active, payload, updated_at")
    .in("key", keys)

  if (error) {
    console.error("Failed to load site content settings", error)
  }

  const rows = (data ?? []) as PageSettingsRow[]
  const byKey = rows.reduce<Record<string, PageSettingsRow>>((acc, row) => {
    acc[row.key] = row
    return acc
  }, {})

  return (
    <div className="bg-[#F5F1E8] rounded-lg">
      <SiteContentAdminClient initialSettings={byKey} />
    </div>
  )
}


