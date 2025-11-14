"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

const reviewSchema = z.object({
  productId: z.string().uuid(),
  rating: z.number().min(1).max(5),
  title: z.string().trim().max(120).optional(),
  content: z.string().trim().min(10).max(800),
})

export async function submitReviewAction(input: {
  productId: string
  rating: number
  title?: string
  content: string
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "يجب تسجيل الدخول لإضافة تقييم" }
  }

  const payload = reviewSchema.parse(input)

  const { data: existing } = await supabase
    .from("product_reviews")
    .select("id")
    .eq("product_id", payload.productId)
    .eq("user_id", user.id)
    .limit(1)

  if (existing && existing.length > 0) {
    return { success: false, error: "لقد قمت بكتابة تقييم لهذا المنتج بالفعل" }
  }

  const { error } = await supabase.from("product_reviews").insert({
    product_id: payload.productId,
    user_id: user.id,
    rating: payload.rating,
    title: payload.title || null,
    content: payload.content,
    status: "pending",
  })

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath(`/product/${payload.productId}`)
  return { success: true }
}

