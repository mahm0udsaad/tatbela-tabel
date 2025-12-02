import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ProductDetailClient } from "./product-detail-client"

export const dynamic = "force-dynamic"

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: product, error }, { data: reviews }] = await Promise.all([
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
        is_featured,
        product_images (id, image_url, is_primary),
        product_variants (id, sku, size, weight, variant_type, price, stock)
      `,
      )
      .eq("id", id)
      .single(),
    supabase
      .from("product_reviews")
      .select("id, rating, title, content, created_at")
      .eq("product_id", id)
      .eq("status", "approved")
      .order("created_at", { ascending: false }),
  ])

  // Fetch similar products after we have the product's category_id
  const { data: similarProducts } = product?.category_id
    ? await supabase
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
          is_featured,
          product_images (id, image_url, is_primary),
          product_variants (id, sku, size, weight, variant_type, price, stock)
        `,
        )
        .eq("category_id", product.category_id)
        .eq("is_archived", false)
        .neq("id", id)
        .limit(8)
        .order("created_at", { ascending: false })
    : { data: null }

  if (error || !product) {
    return notFound()
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <main className="min-h-screen bg-white">
      <ProductDetailClient
        product={product}
        reviews={reviews ?? []}
        canReview={Boolean(user)}
        similarProducts={similarProducts ?? []}
      />
    </main>
  )
}
