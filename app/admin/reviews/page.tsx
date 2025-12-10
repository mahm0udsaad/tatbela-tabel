import { createClient } from "@/lib/supabase/server"
import { ReviewsAdminClient } from "./reviews-client"

export const dynamic = "force-dynamic"

export default async function ReviewsPage() {
  const supabase = await createClient()

  const { data: reviews } = await supabase
    .from("product_reviews")
    .select(
      `
      id,
      product_id,
      rating,
      title,
      content,
      created_at,
      products (
        id,
        name_ar,
        brand
      )
    `,
    )
    .order("created_at", { ascending: false })

  return (
    <div className="bg-[#F5F1E8] rounded-lg">
      <ReviewsAdminClient reviews={reviews ?? []} />
    </div>
  )
}

