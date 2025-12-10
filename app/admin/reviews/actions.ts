"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

const deleteSchema = z.object({
  reviewId: z.string().uuid(),
  productId: z.string().uuid(),
})

export async function deleteReviewAction(input: { reviewId: string; productId: string }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "غير مصرح" }
  }

  const payload = deleteSchema.parse(input)

  const { error } = await supabase.from("product_reviews").delete().eq("id", payload.reviewId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath(`/product/${payload.productId}`)
  return { success: true }
}

