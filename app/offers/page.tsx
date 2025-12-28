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
                <h2 className="text-3xl font-bold text-[#2B2520]">{offers?.length ?? 0} عرض</h2>
              </div>
            </div>
          </div>
        </div>
      </section>

      <OffersClient
        initialOffers={offers ?? []}
        initialSearch={params.search ?? ""}
        initialBrand={normalizedBrand}
      />
    </main>
  )
}

