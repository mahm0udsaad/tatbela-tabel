import { createClient } from "@/lib/supabase/server"
import { StoreClient } from "../store/store-client"

export const dynamic = "force-dynamic"

export default async function B2BStorePage({ searchParams }: { searchParams: Promise<{ search?: string }> }) {
  const supabase = await createClient()
  const params = await searchParams

  const [{ data: products }, { data: categories }, { data: b2bSettings }] = await Promise.all([
    supabase
      .from("products")
      .select(
        `
        id,
        name_ar,
        description_ar,
        brand,
        type,
        price,
        original_price,
        rating,
        reviews_count,
        stock,
        category_id,
        created_at,
        is_featured,
        is_b2b,
        b2b_price_hidden,
        product_images (image_url, is_primary),
        product_variants (stock)
      `,
      )
      .eq("is_archived", false)
      .eq("is_b2b", true)
      .order("sort_order", { ascending: true }),
    supabase.from("categories").select("id, name_ar, parent_id, slug, sort_order").order("sort_order", { ascending: true }),
    supabase.from("b2b_settings").select("price_hidden, contact_label, contact_url").maybeSingle(),
  ])

  const priceHidden = b2bSettings?.price_hidden ?? false
  const contactLabel = b2bSettings?.contact_label ?? "تواصل مع المبيعات"
  const contactUrl = b2bSettings?.contact_url ?? "/contact"

  return (
    <main className="min-h-screen">
      <section className="border-y border-[#E8E2D1] bg-[#FFF9F0]">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="flex flex-col md:flex-row items-start justify-between gap-6">
            <div>
              <p className="text-sm text-[#8B6F47] uppercase tracking-wider mb-2">B2B •</p>
              <h1 className="text-4xl font-bold text-[#2B2520] mb-4"> منتجات الجملة</h1>
              <p className="text-lg text-[#8B6F47] max-w-2xl">
                  تشكيلة منتجات الجملة مع نفس الجودة والموثوقية. استكشف الفئات واطلب بسهولة.
              </p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-md p-4 w-full md:w-auto flex items-center gap-4">
              <div>
                <p className="text-xs text-[#8B6F47] uppercase tracking-wider">منتجات الجملة</p>
                <h2 className="text-3xl font-bold text-[#2B2520]">{products?.length ?? 0} منتج</h2>
              </div>
              <div className="w-px h-12 bg-[#E8E2D1]" />
              <div>
                <p className="text-xs text-[#8B6F47] uppercase tracking-wider">التواصل</p>
                <h2 className="text-3xl font-bold text-[#2B2520]">{contactLabel}</h2>
              </div>
            </div>
          </div>
        </div>
      </section>

      <StoreClient
        initialProducts={products ?? []}
        categories={categories ?? []}
        initialSearch={params.search ?? ""}
        mode="b2b"
        priceHidden={priceHidden}
        contactLabel={contactLabel}
        contactUrl={contactUrl}
      />
    </main>
  )
}

