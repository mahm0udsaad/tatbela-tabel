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

export const dynamic = "force-dynamic"

export default async function ProductOrderPage() {
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
    .order("sort_order", { ascending: true })
    .order("is_primary", { referencedTable: "product_images", ascending: false })

  return (
    <div className="bg-[#F5F1E8] rounded-lg">
      <ProductSortBoard initialProducts={products ?? []} />
    </div>
  )
}

