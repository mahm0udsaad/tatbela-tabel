import { createClient } from "@/lib/supabase/server"
import { OffersClient } from "./offers-client"

export const dynamic = "force-dynamic"

export default async function OffersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; brand?: string }>
}) {
  const supabase = await createClient()
  const params = await searchParams

  const normalizedBrand =
    params.brand === "Tabel" || params.brand === "Tatbeelah" ? params.brand : ""

  // Query dedicated offers
  let offersQuery = supabase
    .from("offers")
    .select(
      `
      id,
      name_ar,
      description_ar,
      brand,
      type,
      price,
      original_price,
      rating,
      reviews_count,
      stock,
      created_at,
      is_featured,
      has_tax,
      offer_images (image_url, is_primary),
      offer_variants (stock)
    `,
    )
    .eq("is_archived", false)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })

  if (normalizedBrand) {
    offersQuery = offersQuery.eq("brand", normalizedBrand)
  }

  const { data: offers } = await offersQuery

  // Query products with discounts (where original_price > price)
  // Only B2C products (exclude B2B)
  let productsQuery = supabase
    .from("products")
    .select(
      `
      id,
      name_ar,
      description_ar,
      brand,
      type,
      price,
      original_price,
      rating,
      reviews_count,
      stock,
      created_at,
      is_featured,
      has_tax,
      product_images (image_url, is_primary),
      product_variants (stock)
    `,
    )
    .eq("is_archived", false)
    .eq("is_b2b", false)
    .not("original_price", "is", null)
    .gt("original_price", 0)
    .order("created_at", { ascending: false })

  if (normalizedBrand) {
    productsQuery = productsQuery.eq("brand", normalizedBrand)
  }

  const { data: products } = await productsQuery

  // Filter products to only include those with actual discounts (original_price > price)
  const discountedProducts = (products || []).filter(
    (product) => product.original_price && product.original_price > product.price
  )

  // Combine offers and discounted products
  const allOffers = [
    ...(offers || []).map(offer => ({
      ...offer,
      images: offer.offer_images,
      variants: offer.offer_variants,
      source: 'offer' as const
    })),
    ...discountedProducts.map(product => ({
      ...product,
      images: product.product_images,
      variants: product.product_variants,
      source: 'product' as const
    }))
  ]

  return (
    <main className="min-h-screen">
      <section className="border-y border-[#E8E2D1]">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="flex flex-col md:flex-row items-start justify-between gap-6">
            <div>
              <p className="text-sm text-[#8B6F47] uppercase tracking-wider mb-2">Tatbeelah & Tabel</p>
              <h1 className="text-4xl font-bold text-[#2B2520] mb-4">العروض والخصومات</h1>
              <p className="text-lg text-[#8B6F47] max-w-2xl">
                استفد من أفضل العروض والخصومات الحصرية على منتجاتنا المميزة. تسوق الآن واحصل على أفضل الأسعار!
              </p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-md p-4 w-full md:w-auto flex items-center gap-4">
              <div>
                <p className="text-xs text-[#8B6F47] uppercase tracking-wider">عدد العروض</p>
                <h2 className="text-3xl font-bold text-[#2B2520]">{allOffers.length} عرض</h2>
              </div>
            </div>
          </div>
        </div>
      </section>

      <OffersClient
        initialOffers={allOffers}
        initialSearch={params.search ?? ""}
        initialBrand={normalizedBrand}
      />
    </main>
  )
}

