import Link from "next/link"
import { getCategoryBranch } from "@/app/store/category-helpers"
import { createClient } from "@/lib/supabase/server"
import { ProductSortBoard } from "../components/ProductSortBoard"
import type { Product } from "../types"

type SortableProduct = Pick<
  Product,
  | "id"
  | "name_ar"
  | "description_ar"
  | "brand"
  | "category"
  | "price"
  | "original_price"
  | "stock"
  | "is_featured"
  | "sort_order"
  | "product_images"
> & {
  rating?: number | null
  reviews_count?: number | null
  product_variants?: { stock: number | null }[] | null
}

type StoreSurfaceKey = "store" | "blends" | "offers"

const surfaceConfigs: Record<
  StoreSurfaceKey,
  {
    title: string
    description: string
    boardTitle: string
    boardDescription: string
    emptyLabel: string
    badgeLabel: string
    hint: string
  }
> = {
  store: {
    title: "ترتيب منتجات متجر العطارة (/store)",
    description: "اختر ترتيب ظهور كل منتجات المتجر الرئيسي الموجهة لعملاء التجزئة.",
    boardTitle: "ترتيب منتجات المتجر",
    boardDescription: "اسحب وأفلت لتحديد ترتيب المنتجات في صفحة /store وعلى الواجهة الرئيسية.",
    emptyLabel: "لا توجد منتجات ضمن متجر العطارة حالياً.",
    badgeLabel: "عدد منتجات المتجر:",
    hint: "يشمل كل المنتجات غير الموجهة للجملة (B2B).",
  },
  blends: {
    title: "ترتيب منتجات صفحة الخلطات (/blends)",
    description: "اضبط ترتيب المنتجات التي تظهر داخل صفحة الخلطات والفروع التابعة لها.",
    boardTitle: "ترتيب منتجات الخلطات",
    boardDescription: "اسحب وأفلت لتحديد ترتيب منتجات /blends.",
    emptyLabel: "لا توجد منتجات ضمن الخلطات حالياً.",
    badgeLabel: "عدد الخلطات:",
    hint: "يعتمد على الفئات تحت فرع slug الخلطات.",
  },
  offers: {
    title: "ترتيب منتجات صفحة العروض (/offers)",
    description: "رتب المنتجات التي تحتوي على سعر أصلي لعرضها ضمن قسم العروض.",
    boardTitle: "ترتيب منتجات العروض",
    boardDescription: "اسحب وأفلت لتحديد ترتيب منتجات /offers.",
    emptyLabel: "لا توجد عروض نشطة حالياً.",
    badgeLabel: "عدد العروض:",
    hint: "يظهر فقط المنتجات التي تحتوي على سعر قبل الخصم.",
  },
}

export const dynamic = "force-dynamic"

export default async function ProductOrderPage({ searchParams }: { searchParams: Promise<{ client?: string }> }) {
  const params = await searchParams
  const requestedSurface = params.client as StoreSurfaceKey | undefined
  const selectedSurface = requestedSurface && surfaceConfigs[requestedSurface] ? requestedSurface : null

  if (!selectedSurface) {
    const surfaceKeys: StoreSurfaceKey[] = ["store", "blends", "offers"]
    return (
      <div className="bg-[#F5F1E8] min-h-screen">
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
          <header className="space-y-2">
            <p className="text-sm text-[#8B6F47] uppercase tracking-wide">اختر واجهة الترتيب</p>
            <h1 className="text-2xl md:text-3xl font-bold text-[#2B2520]">لأي واجهة تريد إعادة ترتيب المنتجات؟</h1>
            <p className="text-sm text-[#8B6F47]">
              حدد صفحة المتجر التي تريد ضبط ترتيب المنتجات لها. يمكنك العودة وتغيير الاختيار في أي وقت.
            </p>
          </header>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {surfaceKeys.map((key) => {
              const config = surfaceConfigs[key]
              return (
                <Link
                  key={key}
                  href={`?client=${key}`}
                  className="group rounded-2xl border border-[#E8E2D1] bg-white p-5 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h2 className="text-lg font-bold text-[#2B2520]">{config.title}</h2>
                    <span className="text-xs px-2 py-1 rounded-full bg-[#FFF4E0] text-[#C41E3A] border border-[#E8A835]/40">
                      {config.badgeLabel.replace("عدد ", "").replace(":", "")}
                    </span>
                  </div>
                  <p className="text-sm text-[#8B6F47] mb-3">{config.description}</p>
                  <p className="text-xs text-[#8B6F47] bg-[#FFF8ED] border border-[#E8E2D1] rounded-xl px-3 py-2">
                    {config.hint}
                  </p>
                  <div className="mt-4 inline-flex items-center text-[#E8A835] font-semibold text-sm group-hover:translate-x-1 transition-transform">
                    البدء في الترتيب -&gt;
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  const supabase = await createClient()
  const { data: categoriesData } = await supabase
    .from("categories")
    .select("id, name_ar, parent_id, slug, sort_order")
    .order("sort_order", { ascending: true })

  const categories = categoriesData ?? []

  let productsQuery = supabase
    .from("products")
    .select(
      `
      id,
      name_ar,
      description_ar,
      brand,
      category,
      price,
      original_price,
      stock,
      is_featured,
      rating,
      reviews_count,
      sort_order,
      product_images (
        id,
        image_url,
        is_primary
      ),
      product_variants (
        stock
      )
    `,
    )
    .eq("is_archived", false)

  if (selectedSurface === "store" || selectedSurface === "blends") {
    const { categoryIds } = getCategoryBranch(categories, selectedSurface)
    if (categoryIds.length > 0) {
      productsQuery = productsQuery.in("category_id", categoryIds)
    }
  }

  if (selectedSurface === "store") {
    productsQuery = productsQuery.eq("is_b2b", false)
  } else if (selectedSurface === "offers") {
    productsQuery = productsQuery.not("original_price", "is", null)
  }

  const { data: products } = await productsQuery
    .order("sort_order", { ascending: true })
    .order("is_primary", { referencedTable: "product_images", ascending: false })

  const config = surfaceConfigs[selectedSurface]

  return (
    <div className="bg-[#F5F1E8] min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs text-[#8B6F47] uppercase tracking-wide">إعادة ترتيب المنتجات</p>
            <h1 className="text-2xl font-bold text-[#2B2520]">{config.title}</h1>
            <p className="text-sm text-[#8B6F47]">{config.description}</p>
          </div>
          <Link
            href="/admin/products/order"
            className="inline-flex items-center justify-center rounded-lg border border-[#E8A835] px-4 py-2 text-sm font-semibold text-[#E8A835] bg-white hover:bg-[#FFF8ED] transition-colors"
          >
            تغيير الواجهة
          </Link>
        </div>

        <ProductSortBoard
          initialProducts={products ?? []}
          title={config.boardTitle}
          description={config.boardDescription}
          emptyStateLabel={config.emptyLabel}
          badgeLabel={config.badgeLabel}
        />
      </div>
    </div>
  )
}

