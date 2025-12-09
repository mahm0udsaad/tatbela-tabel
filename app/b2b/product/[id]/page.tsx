import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ProductDetailClient } from "@/app/product/[id]/product-detail-client"

export const dynamic = "force-dynamic"

export default async function B2BProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: product, error }, { data: b2bSettings }, { data: reviews }] = await Promise.all([
    supabase
      .from("products")
      .select(
        `
        id,
        name_ar,
        description_ar,
        brand,
        price,
        price_per_kilo,
        pricing_mode,
        original_price,
        rating,
        reviews_count,
        stock,
        category_id,
        is_featured,
        b2b_price_hidden,
        product_images (id, image_url, is_primary),
        product_variants (id, sku, size, weight, variant_type, price, stock)
      `,
      )
      .eq("id", id)
      .eq("is_b2b", true)
      .single(),
    supabase.from("b2b_settings").select("price_hidden, contact_label, contact_url").maybeSingle(),
    supabase
      .from("product_reviews")
      .select("id, rating, title, content, created_at")
      .eq("product_id", id)
      .eq("status", "approved")
      .order("created_at", { ascending: false }),
  ])

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
          b2b_price_hidden,
          product_images (id, image_url, is_primary),
          product_variants (id, sku, size, weight, variant_type, price, stock)
        `,
        )
        .eq("category_id", product.category_id)
        .eq("is_archived", false)
        .eq("is_b2b", true)
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

  const priceHidden = (b2bSettings?.price_hidden ?? false) || Boolean(product.b2b_price_hidden)
  const contactLabel = b2bSettings?.contact_label ?? "تواصل مع المبيعات"
  const contactUrl = b2bSettings?.contact_url ?? "/contact"

  return (
    <main className="min-h-screen bg-white w-[95%] mx-auto rounded-2xl">
      <ProductDetailClient
        product={product}
        reviews={reviews ?? []}
        canReview={Boolean(user)}
        similarProducts={similarProducts ?? []}
        mode="b2b"
        priceHidden={priceHidden}
        contactLabel={contactLabel}
        contactUrl={contactUrl}
      />
    </main>
  )
}

