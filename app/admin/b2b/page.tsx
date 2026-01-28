import { createClient } from "@/lib/supabase/server"
import { B2BSettingsClient } from "./settings-client"

export const dynamic = "force-dynamic"

export default async function B2BSettingsPage() {
  const supabase = await createClient()
  const [{ data: settings }, { data: categories }] = await Promise.all([
    supabase
      .from("b2b_settings")
      .select("id, price_hidden, contact_label, contact_url")
      .maybeSingle(),
    supabase
      .from("categories")
      .select("id, name_ar, sort_order")
      .order("sort_order", { ascending: true, nullsFirst: true }),
  ])

  return (
    <div className="rounded-lg">
      <B2BSettingsClient initialSettings={settings ?? null} initialCategories={categories ?? []} />
    </div>
  )
}

