import { notFound } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { createClient } from "@/lib/supabase/server"
import { ProductDetailClient } from "./product-detail-client"

export const dynamic = "force-dynamic"

export default async function ProductDetailPage({ params }: { params: { id: string } }) {
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
        product_images (id, image_url, is_primary),
        product_variants (id, sku, size, weight, variant_type, price, stock)
      `,
      )
      .eq("id", params.id)
      .single(),
    supabase
      .from("product_reviews")
      .select("id, rating, title, content, created_at")
      .eq("product_id", params.id)
      .eq("status", "approved")
      .order("created_at", { ascending: false }),
  ])

  if (error || !product) {
    return notFound()
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <ProductDetailClient product={product} reviews={reviews ?? []} canReview={Boolean(user)} />
      <Footer />
    </main>
  )
}
