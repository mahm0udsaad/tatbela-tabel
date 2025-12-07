import { createClient } from "@/lib/supabase/server"
import { ProductManager } from "./product-manager"

export const dynamic = "force-dynamic"

export default async function AdminProductsPage() {
  const supabase = await createClient()

  const [{ data: products, error: productsError }, { data: categories }] = await Promise.all([
    supabase
      .from("products")
      .select(
        `
        id,
        name_ar,
        description_ar,
        brand,
        category,
        type,
        price,
        price_per_kilo,
        pricing_mode,
        original_price,
        stock,
        is_featured,
        category_id,
        is_archived,
        sort_order,
        product_images (
          id,
          image_url,
          is_primary,
          sort_order
        ),
        product_variants (
          id,
          sku,
          weight,
          size,
          variant_type,
          price,
          stock
        )
      `,
      )
      .eq("is_archived", false) // Exclude archived products
      .order("sort_order", { ascending: true })
      .order("sort_order", { referencedTable: "product_images", ascending: true })
      .order("is_primary", { referencedTable: "product_images", ascending: false }),
    supabase.from("categories").select("id, name_ar, parent_id").order("sort_order", { ascending: true }),
  ])

  if (productsError) {
    console.error("Failed to load products:", productsError)
  }

  return (
    <div className="bg-[#F5F1E8] rounded-lg">
      <ProductManager initialProducts={products ?? []} categories={categories ?? []} />
    </div>
  )
}
