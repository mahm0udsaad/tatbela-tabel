"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

const numberOrNull = z
  .union([z.string().trim().length(0), z.number(), z.null()])
  .transform((value) => {
    if (typeof value === "number") return value
    if (value === null) return null
    return value === "" ? null : Number(value)
  })

const productInputSchema = z.object({
  id: z.string().uuid().optional(),
  name_ar: z.string().min(2, "اسم المنتج مطلوب"),
  description_ar: z.string().optional().nullable(),
  brand: z.string().min(1, "العلامة التجارية مطلوبة"),
  type: z.string().min(1, "نوع المنتج مطلوب"),
  price: z.number().nonnegative(),
  original_price: z.number().nonnegative().optional().nullable(),
  stock: z.number().int().nonnegative(),
  category: z.string().min(1, "الفئة مطلوبة"),
  category_id: z.string().uuid().optional().nullable(),
})

const variantInputSchema = z.object({
  id: z.string().uuid().optional(),
  product_id: z.string().uuid(),
  sku: z.string().optional().nullable(),
  weight: numberOrNull.optional(),
  size: z.string().optional().nullable(),
  variant_type: z.string().optional().nullable(),
  price: numberOrNull.optional(),
  stock: z.number().int().nonnegative(),
})

function revalidateCommercePaths() {
  revalidatePath("/admin/products")
  revalidatePath("/store")
  revalidatePath("/product")
}

export async function upsertProductAction(input: {
  id?: string
  name_ar: string
  description_ar?: string | null
  brand: string
  type: string
  price: number
  original_price?: number | null
  stock: number
  category: string
  category_id?: string | null
}) {
  const supabase = await createClient()
  const payload = productInputSchema.parse(input)

  const mutation = {
    ...payload,
    name: payload.name_ar,
    updated_at: new Date().toISOString(),
  }

  if (!mutation.original_price) {
    mutation.original_price = null
  }

  const { data, error } = await supabase
    .from("products")
    .upsert(mutation, { onConflict: "id" })
    .select("id")
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  revalidateCommercePaths()
  return { success: true, productId: data.id }
}

export async function deleteProductAction(productId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("products").delete().eq("id", productId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidateCommercePaths()
  return { success: true }
}

export async function upsertVariantAction(input: {
  id?: string
  product_id: string
  sku?: string | null
  weight?: number | null
  size?: string | null
  variant_type?: string | null
  price?: number | null
  stock: number
}) {
  const supabase = await createClient()
  const payload = variantInputSchema.parse(input)
  const mutation = {
    ...payload,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from("product_variants")
    .upsert(mutation, { onConflict: "id" })
    .select("id")
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  revalidateCommercePaths()
  return { success: true, variantId: data.id }
}

export async function deleteVariantAction(variantId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("product_variants").delete().eq("id", variantId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidateCommercePaths()
  return { success: true }
}

export async function uploadProductImageAction(formData: FormData) {
  const productId = formData.get("productId")?.toString()
  const isPrimaryFlag = formData.get("isPrimary")?.toString() === "true"
  const file = formData.get("file")

  if (!productId || !(file instanceof File)) {
    return { success: false, error: "ملف الصورة أو معرف المنتج غير موجود" }
  }

  const supabase = await createClient()
  const fileExt = file.name.split(".").pop()
  const fileName = `${crypto.randomUUID()}.${fileExt || "webp"}`
  const storagePath = `products/${productId}/${fileName}`

  const { error: uploadError } = await supabase.storage.from("product-images").upload(storagePath, file, {
    cacheControl: "3600",
    upsert: false,
  })

  if (uploadError) {
    return { success: false, error: uploadError.message }
  }

  const { data: publicUrlData } = supabase.storage.from("product-images").getPublicUrl(storagePath)

  if (isPrimaryFlag) {
    await supabase.from("product_images").update({ is_primary: false }).eq("product_id", productId)
  }

  const { error: insertError } = await supabase.from("product_images").insert({
    product_id: productId,
    image_url: publicUrlData.publicUrl,
    storage_path: storagePath,
    is_primary: isPrimaryFlag,
  })

  if (insertError) {
    return { success: false, error: insertError.message }
  }

  revalidateCommercePaths()
  return { success: true }
}

export async function setPrimaryImageAction(imageId: string, productId: string) {
  const supabase = await createClient()
  await supabase.from("product_images").update({ is_primary: false }).eq("product_id", productId)
  const { error } = await supabase.from("product_images").update({ is_primary: true }).eq("id", imageId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidateCommercePaths()
  return { success: true }
}

export async function deleteProductImageAction(imageId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.from("product_images").select("storage_path, product_id").eq("id", imageId).single()

  if (error || !data) {
    return { success: false, error: error?.message || "تعذر العثور على الصورة" }
  }

  if (data.storage_path) {
    await supabase.storage.from("product-images").remove([data.storage_path])
  }

  const { error: deleteError } = await supabase.from("product_images").delete().eq("id", imageId)

  if (deleteError) {
    return { success: false, error: deleteError.message }
  }

  revalidateCommercePaths()
  return { success: true }
}

