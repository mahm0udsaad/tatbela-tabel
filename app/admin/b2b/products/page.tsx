import { createClient } from "@/lib/supabase/server"
import { B2BProductManager } from "./b2b-product-manager"

export const dynamic = "force-dynamic"

export default async function B2BProductsPage() {
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
        is_b2b,
        b2b_price_hidden,
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
      .eq("is_archived", false)
      .eq("is_b2b", true) // Only B2B products
      .order("sort_order", { ascending: true })
      .order("sort_order", { referencedTable: "product_images", ascending: true })
      .order("is_primary", { referencedTable: "product_images", ascending: false }),
    supabase.from("categories").select("id, name_ar, parent_id").order("sort_order", { ascending: true }),
  ])

  if (productsError) {
    console.error("Failed to load B2B products:", productsError)
  }

  return (
    <div className="rounded-lg">
      <B2BProductManager initialProducts={products ?? []} categories={categories ?? []} />
    </div>
  )
}

