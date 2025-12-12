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

const offerInputSchema = z.object({
  id: z.string().uuid().optional(),
  name_ar: z.string().min(2, "اسم العرض مطلوب"),
  description_ar: z.string().optional().nullable(),
  brand: z.string().min(1, "العلامة التجارية مطلوبة"),
  type: z.string().optional().nullable(),
  price: z.number().nonnegative(),
  price_per_kilo: z.number().nonnegative().optional().nullable(),
  pricing_mode: z.enum(["unit", "per_kilo"]).default("unit"),
  original_price: z.number().nonnegative().optional().nullable(),
  stock: z.number().int().nonnegative(),
  is_featured: z.boolean().default(false),
})

const variantInputSchema = z.object({
  id: z.string().uuid().optional(),
  offer_id: z.string().uuid(),
  sku: z.string().optional().nullable(),
  weight: numberOrNull.optional(),
  size: z.string().optional().nullable(),
  variant_type: z.string().optional().nullable(),
  price: numberOrNull.optional(),
  stock: z.number().int().nonnegative(),
})

function revalidateOffersPaths() {
  revalidatePath("/admin/offers")
  revalidatePath("/offers")
}

export async function upsertOfferAction(input: {
  id?: string
  name_ar: string
  description_ar?: string | null
  brand: string
  type?: string | null
  price: number
  price_per_kilo?: number | null
  pricing_mode?: "unit" | "per_kilo"
  original_price?: number | null
  stock: number
  is_featured?: boolean
}) {
  const supabase = await createClient()
  const payload = offerInputSchema.parse(input)
  const normalizedOriginalPrice =
    typeof payload.original_price === "number" && payload.original_price > payload.price
      ? payload.original_price
      : null

  const mutation = {
    id: payload.id,
    name_ar: payload.name_ar,
    description_ar: payload.description_ar,
    brand: payload.brand,
    type: payload.type,
    price: payload.price,
    price_per_kilo: payload.price_per_kilo ?? null,
    pricing_mode: payload.pricing_mode ?? "unit",
    original_price: normalizedOriginalPrice,
    stock: payload.stock,
    name: payload.name_ar,
    is_featured: payload.is_featured ?? false,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from("offers")
    .upsert(mutation, { onConflict: "id" })
    .select("id")
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  revalidateOffersPaths()
  return { success: true, offerId: data.id }
}

export async function deleteOfferAction(offerId: string) {
  const supabase = await createClient()
  
  // Check if offer has any order items referencing it (if we link offers to orders in future)
  // For now, we'll just soft delete (archive)
  const { error: archiveError } = await supabase
    .from("offers")
    .update({ is_archived: true })
    .eq("id", offerId)

  if (archiveError) {
    return { success: false, error: archiveError.message }
  }

  revalidateOffersPaths()
  return { success: true, archived: true, message: "تم أرشفة العرض" }
}

export async function upsertOfferVariantAction(input: {
  id?: string
  offer_id: string
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
    .from("offer_variants")
    .upsert(mutation, { onConflict: "id" })
    .select("id")
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  revalidateOffersPaths()
  return { success: true, variantId: data.id }
}

export async function deleteOfferVariantAction(variantId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("offer_variants").delete().eq("id", variantId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidateOffersPaths()
  return { success: true }
}

export async function uploadOfferImageAction(formData: FormData) {
  const offerId = formData.get("offerId")?.toString()
  const isPrimaryFlag = formData.get("isPrimary")?.toString() === "true"
  const file = formData.get("file")

  if (!offerId || !(file instanceof File)) {
    return { success: false, error: "ملف الصورة أو معرف العرض غير موجود" }
  }

  const supabase = await createClient()
  const fileExt = file.name.split(".").pop()
  const fileName = `${crypto.randomUUID()}.${fileExt || "webp"}`
  const storagePath = `offers/${offerId}/${fileName}`

  const { error: uploadError } = await supabase.storage.from("product-images").upload(storagePath, file, {
    cacheControl: "3600",
    upsert: false,
  })

  if (uploadError) {
    return { success: false, error: uploadError.message }
  }

  const { data: publicUrlData } = supabase.storage.from("product-images").getPublicUrl(storagePath)

  if (isPrimaryFlag) {
    await supabase.from("offer_images").update({ is_primary: false }).eq("offer_id", offerId)
  }

  const { error: insertError } = await supabase.from("offer_images").insert({
    offer_id: offerId,
    image_url: publicUrlData.publicUrl,
    storage_path: storagePath,
    is_primary: isPrimaryFlag,
  })

  if (insertError) {
    return { success: false, error: insertError.message }
  }

  revalidateOffersPaths()
  return { success: true }
}

export async function setPrimaryOfferImageAction(imageId: string, offerId: string) {
  const supabase = await createClient()
  await supabase.from("offer_images").update({ is_primary: false }).eq("offer_id", offerId)
  const { error } = await supabase.from("offer_images").update({ is_primary: true }).eq("id", imageId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidateOffersPaths()
  return { success: true }
}

export async function deleteOfferImageAction(imageId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.from("offer_images").select("storage_path, offer_id").eq("id", imageId).single()

  if (error || !data) {
    return { success: false, error: error?.message || "تعذر العثور على الصورة" }
  }

  if (data.storage_path) {
    await supabase.storage.from("product-images").remove([data.storage_path])
  }

  const { error: deleteError } = await supabase.from("offer_images").delete().eq("id", imageId)

  if (deleteError) {
    return { success: false, error: deleteError.message }
  }

  revalidateOffersPaths()
  return { success: true }
}

export async function updateOffersSortOrderAction(
  updates: { id: string; sort_order: number }[]
) {
  const supabase = await createClient()
  
  const results = await Promise.all(
    updates.map(({ id, sort_order }) =>
      supabase.from("offers").update({ sort_order }).eq("id", id)
    )
  )

  const hasError = results.some((r) => r.error)
  if (hasError) {
    return { success: false, error: "تعذر تحديث ترتيب العروض" }
  }

  revalidateOffersPaths()
  return { success: true }
}

