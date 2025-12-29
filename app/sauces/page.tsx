import { createClient } from "@/lib/supabase/server"
import { ComingSoon } from "@/components/coming-soon"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

type SaucesSettings = {
  is_active: boolean
  payload: { message?: string } | null
}

const DEFAULT_MESSAGE = "قريبا أقوى أنواع الصوصات"

async function getSaucesSettings(): Promise<SaucesSettings | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("page_settings")
    .select("is_active, payload")
    .eq("key", "sauces_page")
    .single()

  if (error) {
    console.error("Failed to load sauces settings", error)
    return null
  }
  return data as SaucesSettings
}

export default async function SaucesPage() {
  const supabase = await createClient()
  const settings = await getSaucesSettings()
  // Desired behavior:
  // - is_active = true  => visible normally (send user to store listing)
  // - is_active = false => hidden => show Coming Soon component
  const isHidden = settings ? !settings.is_active : false
  const message = settings?.payload?.message ?? DEFAULT_MESSAGE

  // Get category name from database
  const { data: saucesCategory } = await supabase
    .from("categories")
    .select("name_ar")
    .eq("slug", "sauces")
    .single()

  const categoryTitle = saucesCategory?.name_ar ?? "الصوصات"

  if (!isHidden) {
    redirect("/store?category=sauces")
  }

  return (
    <main className="min-h-screen">
      <section className="border-y border-[#E8E2D1]">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="flex flex-col md:flex-row items-start justify-between gap-6">
            <div>
              <p className="text-sm text-[#8B6F47] uppercase tracking-wider mb-2">Tatbeelah & Tabel</p>
              <h1 className="text-4xl font-bold text-[#2B2520] mb-4">{categoryTitle}</h1>
              <p className="text-lg text-[#8B6F47] max-w-2xl">
                {message}
              </p>
            </div>
          </div>
        </div>
      </section>

      <ComingSoon 
        message={message}
        description="نعمل على تقديم تشكيلة مميزة من الصوصات الشهية التي ستضيف نكهة استثنائية لأطباقك"
      />
    </main>
  )
}
