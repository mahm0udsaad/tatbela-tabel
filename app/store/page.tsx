import { createClient } from "@/lib/supabase/server"
import { StoreClient } from "./store-client"
import { getCategoryBranch } from "./category-helpers"

export const dynamic = "force-dynamic"

export default async function StorePage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; category?: string }>
}) {
  const supabase = await createClient()
  const params = await searchParams
  const targetSlug = params.category ?? "store"
  const { data: categoriesData } = await supabase
    .from("categories")
    .select("id, name_ar, parent_id, slug, sort_order")
    .order("sort_order", { ascending: true })

  const allCategories = categoriesData ?? []
  let { rootCategory, categoryIds } = getCategoryBranch(allCategories, targetSlug)
  if (!rootCategory && targetSlug !== "store") {
    ;({ rootCategory, categoryIds } = getCategoryBranch(allCategories, "store"))
  }
  const initialSelectedCategories = rootCategory ? [rootCategory.id] : []

  // Use enhanced search if search term exists, otherwise load products normally
  let products: any[] = []
  
  if (params.search?.trim()) {
    // Use the enhanced search function - search across ALL categories when searching
    const { data: searchResults } = await supabase.rpc('search_products_enhanced', {
      search_query: params.search.trim(),
      category_ids: null, // Don't restrict by category when searching
      brand_filter: null,
      price_min: null,
      price_max: null,
      b2b_mode: false,
      limit_count: 100,
      offset_count: 0,
      sort_by: 'relevance'
    })
    products = searchResults || []
  } else {
    // Load products normally
    let productsQuery = supabase
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
      .eq("is_b2b", false)
      .order("sort_order", { ascending: true })

    if (categoryIds.length > 0) {
      productsQuery = productsQuery.in("category_id", categoryIds)
    }

    const { data } = await productsQuery
    products = data || []
  }
  const categoryTitle = params.search 
    ? `نتائج البحث عن: ${params.search}` 
    : (rootCategory?.name_ar ?? "استكشف مجموعتنا الكاملة")

  return (
    <main className="min-h-screen">
      <section className="border-y border-[#E8E2D1]">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="flex flex-col md:flex-row items-start justify-between gap-6">
            <div>
              <p className="text-sm text-[#8B6F47] uppercase tracking-wider mb-2">Tatbeelah & Tabel</p>
              <h1 className="text-4xl font-bold text-[#2B2520] mb-4">{categoryTitle}</h1>
              <p className="text-lg text-[#8B6F47] max-w-2xl">
                {params.search 
                  ? `وجدنا ${products?.length ?? 0} منتج مطابق لبحثك`
                  : "تشكيلة واسعة من التوابل المصرية والخلطات الأصلية والصوصات المميزة، مختارة بعناية لتضيف طعمًا فريدًا لكل وجبة."
                }
              </p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-md p-4 w-full md:w-auto flex items-center gap-4">
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
        key={targetSlug}
        initialProducts={products ?? []}
        categories={allCategories}
        initialSearch={params.search ?? ""}
        initialSelectedCategories={params.search ? [] : initialSelectedCategories}
        categoryScopeIds={params.search ? [] : categoryIds}
      />
    </main>
  )
}
