import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { ProductSortBoard } from "@/app/admin/products/components/ProductSortBoard"
import type { Product } from "@/app/admin/products/types"

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

export const dynamic = "force-dynamic"

export default async function B2BProductOrderPage() {
  const supabase = await createClient()

  const { data: products } = await supabase
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
    .eq("is_b2b", true)
    .order("sort_order", { ascending: true })
    .order("is_primary", { referencedTable: "product_images", ascending: false })

  const initialProducts = (products ?? []) as SortableProduct[]

  return (
    <div className="bg-[#F5F1E8] min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

          <Link
            href="/admin/b2b"
            className="inline-flex items-center justify-center rounded-lg border border-[#E8A835] px-4 py-2 text-sm font-semibold text-[#E8A835] bg-white hover:bg-[#FFF8ED] transition-colors"
          >
            العودة لإعدادات الجملة
          </Link>
        </div>

        <ProductSortBoard
          initialProducts={initialProducts}
          title="ترتيب منتجات الجملة"
          description="اسحب وأفلت لتحديد ترتيب منتجات الجملة في صفحة /b2b."
          emptyStateLabel="لا توجد منتجات جملة حالياً."
          badgeLabel="عدد منتجات الجملة:"
        />
      </div>
    </div>
  )
}


