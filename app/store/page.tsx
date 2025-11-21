import { createClient } from "@/lib/supabase/server"
import { StoreClient } from "./store-client"

export const dynamic = "force-dynamic"

export default async function StorePage({ searchParams }: { searchParams: Promise<{ search?: string }> }) {
  const supabase = await createClient()
  const params = await searchParams
  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase
      .from("products")
      .select(
        `
        id,
        name_ar,
        description_ar,
        brand,
        price,
        original_price,
        rating,
        reviews_count,
        stock,
        category_id,
        created_at,
        product_images (image_url, is_primary),
        product_variants (stock)
      `,
      )
      .order("created_at", { ascending: false }),
    supabase.from("categories").select("id, name_ar, parent_id, slug, sort_order").order("sort_order", { ascending: true }),
  ])

  return (
    <main className="min-h-screen bg-white">
      <section className="bg-[#F5F1E8] border-y border-[#E8E2D1]">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="flex flex-col md:flex-row items-start justify-between gap-6">
            <div>
              <p className="text-sm text-[#8B6F47] uppercase tracking-wider mb-2">Tatbeelah & Tabel</p>
              <h1 className="text-4xl font-bold text-[#2B2520] mb-4">استكشف مجموعتنا الكاملة</h1>
              <p className="text-lg text-[#8B6F47] max-w-2xl">
                تشكيلة واسعة من التوابل المصرية والخلطات الأصلية والصوصات المميزة، مختارة بعناية لتضيف طعمًا فريدًا لكل وجبة.
              </p>
            </div>
            <div className="bg-white rounded-2xl shadow-md p-4 w-full md:w-auto flex items-center gap-4">
              <div>
                <p className="text-xs text-[#8B6F47] uppercase tracking-wider">أكثر من</p>
                <h2 className="text-3xl font-bold text-[#2B2520]">{products?.length ?? 0} منتج</h2>
              </div>
              <div className="w-px h-12 bg-[#E8E2D1]" />
              <div>
                <p className="text-xs text-[#8B6F47] uppercase tracking-wider">خدمة العملاء</p>
                <h2 className="text-3xl font-bold text-[#2B2520]">24/7</h2>
              </div>
            </div>
          </div>
        </div>
      </section>

      <StoreClient
        initialProducts={products ?? []}
        categories={categories ?? []}
        initialSearch={params.search ?? ""}
      />
    </main>
  )
}
