import { createClient } from "@/lib/supabase/server"

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
  const settings = await getSaucesSettings()
  const isComingSoon = settings ? settings.is_active : true
  const message = settings?.payload?.message ?? DEFAULT_MESSAGE

  if (!isComingSoon) {
    return (
      <main className="min-h-screen bg-[#FAFAF8] bg-[url('/pattern-bg.svg')] bg-repeat bg-[length:400px_400px]">
        <section className="py-24 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-4xl font-bold text-[#2B2520] mb-4">الصوصات</h1>
            <p className="text-lg text-[#8B6F47]">تم إخفاء هذه الصفحة مؤقتاً لحين نشر المنتجات.</p>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#FAFAF8] bg-[url('/pattern-bg.svg')] bg-repeat bg-[length:400px_400px]">
      <section className="bg-[#F5F1E8] border-y border-[#E8E2D1]">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="flex flex-col md:flex-row items-start justify-between gap-6">
            <div>
              <p className="text-sm text-[#8B6F47] uppercase tracking-wider mb-2">Tatbeelah & Tabel</p>
              <h1 className="text-4xl font-bold text-[#2B2520] mb-4">الصوصات</h1>
              <p className="text-lg text-[#8B6F47] max-w-2xl">
                {message}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Coming Soon Section */}
      <section className="py-24 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-28 h-28 rounded-full bg-gradient-to-br from-[#F5F1E8] to-[#E8E2D1] shadow-lg">
              <span className="text-6xl">🍲</span>
            </div>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-[#2B2520] mb-6 leading-tight">
            قريباً...
          </h2>
          <p className="text-2xl md:text-3xl font-bold text-[#C41E3A] mb-4">
            {message}
          </p>
          <p className="text-lg text-[#8B6F47] mb-12 max-w-md mx-auto">
            نعمل على تقديم تشكيلة مميزة من الصوصات الشهية التي ستضيف نكهة استثنائية لأطباقك
          </p>

          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="w-16 h-0.5 bg-gradient-to-r from-transparent to-[#E8A835]"></div>
            <span className="text-2xl">✨</span>
            <div className="w-16 h-0.5 bg-gradient-to-l from-transparent to-[#E8A835]"></div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <span className="px-4 py-2 rounded-full bg-[#F5F1E8] text-[#8B6F47] text-sm font-medium">
              مكونات طبيعية 100%
            </span>
            <span className="px-4 py-2 rounded-full bg-[#F5F1E8] text-[#8B6F47] text-sm font-medium">
              وصفات أصلية
            </span>
            <span className="px-4 py-2 rounded-full bg-[#F5F1E8] text-[#8B6F47] text-sm font-medium">
              جودة عالية
            </span>
          </div>
        </div>
      </section>
    </main>
  )
}
