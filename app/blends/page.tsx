import { createClient } from "@/lib/supabase/server"
import { StoreClient } from "../store/store-client"

export const dynamic = "force-dynamic"

type CategoryRecord = {
  id: string
  name_ar: string
  parent_id: string | null
  slug: string
  sort_order: number | null
}

export default async function BlendsPage({ searchParams }: { searchParams: Promise<{ search?: string }> }) {
  const supabase = await createClient()
  const params = await searchParams

  const { data: categoriesData } = await supabase
    .from("categories")
    .select("id, name_ar, parent_id, slug, sort_order")
    .order("sort_order", { ascending: true })

  const categories = categoriesData ?? []
  const blendsCategoryIds = collectCategoryIds(categories, "blends")

  const productsQuery = supabase
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
        product_images (image_url, is_primary),
        product_variants (stock)
      `,
    )
    .eq("is_archived", false)
    .order("created_at", { ascending: false })

  const { data: productsData } =
    blendsCategoryIds.length > 0 ? await productsQuery.in("category_id", blendsCategoryIds) : await productsQuery

  const products = productsData ?? []

  return (
    <main className="min-h-screen bg-white">
      <section className="bg-[#F5F1E8] border-y border-[#E8E2D1]">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="flex flex-col md:flex-row items-start justify-between gap-6">
            <div>
              <p className="text-sm text-[#8B6F47] uppercase tracking-wider mb-2">Tatbeelah & Tabel</p>
              <h1 className="text-4xl font-bold text-[#2B2520] mb-4">الخلطات</h1>
              <p className="text-lg text-[#8B6F47] max-w-2xl">
                اكتشف مجموعتنا المميزة من الخلطات المصرية الأصيلة، مصنوعة بعناية من أفضل التوابل الطبيعية لتضيف نكهة فريدة لأطباقك.
              </p>
            </div>
            <div className="bg-white rounded-2xl shadow-md p-4 w-full md:w-auto flex items-center gap-4">
              <div>
                <p className="text-xs text-[#8B6F47] uppercase tracking-wider">عدد الخلطات</p>
                <h2 className="text-3xl font-bold text-[#2B2520]">{products.length} خلطة</h2>
              </div>
            </div>
          </div>
        </div>
      </section>

      <StoreClient initialProducts={products} categories={categories} initialSearch={params.search ?? ""} />
    </main>
  )
}

function collectCategoryIds(categories: CategoryRecord[], slug: string) {
  const root = categories.find((category) => category.slug === slug)
  if (!root) return []

  const childrenMap = categories.reduce<Map<string, string[]>>((acc, category) => {
    if (!category.parent_id) return acc
    if (!acc.has(category.parent_id)) {
      acc.set(category.parent_id, [])
    }
    acc.get(category.parent_id)!.push(category.id)
    return acc
  }, new Map())

  const ids: string[] = [root.id]
  const queue: string[] = [root.id]

  while (queue.length > 0) {
    const current = queue.shift()!
    const children = childrenMap.get(current) ?? []
    children.forEach((childId) => {
      ids.push(childId)
      queue.push(childId)
    })
  }

  return ids
}

