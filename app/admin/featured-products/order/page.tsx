import { createClient } from "@/lib/supabase/server"
import { ProductSortBoard } from "../../products/components/ProductSortBoard"
import type { Product } from "../../products/types"

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

export default async function FeaturedProductOrderPage() {
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
    .eq("is_featured", true)
    .eq("is_archived", false)
    .eq("is_b2b", false)
    .order("sort_order", { ascending: true })
    .order("is_primary", { referencedTable: "product_images", ascending: false })

  return (
    <div className="bg-[#F5F1E8] rounded-lg">
      <ProductSortBoard
        initialProducts={products ?? []}
        title="ترتيب أبرز المنتجات"
        description="اسحب وأفلت لترتيب منتجات Tatbeelah & Tabel المميزة كما ستظهر في الصفحة الرئيسية."
        emptyStateLabel="لا توجد منتجات مميزة حالياً."
        badgeLabel="المنتجات المميزة:"
      />
    </div>
  )
}

