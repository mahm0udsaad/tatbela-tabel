import { createClient } from "@/lib/supabase/server"
import { OfferManager } from "./offer-manager"

export const dynamic = "force-dynamic"

export default async function AdminOffersPage() {
  const supabase = await createClient()

  const { data: offers, error: offersError } = await supabase
    .from("offers")
    .select(
      `
      id,
      name_ar,
      description_ar,
      brand,
      type,
      price,
      price_per_kilo,
      pricing_mode,
      original_price,
      stock,
      is_featured,
      is_archived,
      sort_order,
      offer_images (
        id,
        image_url,
        is_primary,
        sort_order
      ),
      offer_variants (
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
    .order("sort_order", { ascending: true })
    .order("sort_order", { referencedTable: "offer_images", ascending: true })
    .order("is_primary", { referencedTable: "offer_images", ascending: false })

  if (offersError) {
    console.error("Failed to load offers:", offersError)
  }

  return (
    <div className="rounded-lg">
      <OfferManager initialOffers={offers ?? []} />
    </div>
  )
}

