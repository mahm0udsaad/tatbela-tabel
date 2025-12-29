import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ProductDetailClient } from "@/app/product/[id]/product-detail-client"
import { fetchB2BApprovedReviews, fetchB2BProductById, fetchB2BSimilarProducts } from "@/lib/b2b/products"

export const dynamic = "force-dynamic"

export default async function B2BProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  let product: any = null
  let reviews: any[] = []
  try {
    ;[product, reviews] = await Promise.all([fetchB2BProductById(id), fetchB2BApprovedReviews(id)])
  } catch {
    // handled below as notFound
  }

  const [{ data: b2bSettings }] = await Promise.all([
    supabase.from("b2b_settings").select("price_hidden, contact_label, contact_url").maybeSingle(),
  ])

  const similarProducts = product?.category_id
    ? await fetchB2BSimilarProducts({ categoryId: product.category_id, excludeId: id, limit: 8 })
    : []

  if (!product) {
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

