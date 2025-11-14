"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

const categorySchema = z.object({
  id: z.string().uuid().optional(),
  name_ar: z.string().min(2, "اسم الفئة مطلوب"),
  slug: z.string().min(2, "المسار مطلوب").regex(/^[a-z0-9-]+$/, "استخدم حروفاً لاتينية وأرقاماً وشرطات"),
  parent_id: z.string().uuid().optional().nullable(),
})

const reorderSchema = z.object({
  id: z.string().uuid(),
  parentId: z.string().uuid().nullable(),
  position: z.number().int().nonnegative(),
})

function revalidateCategoryPaths() {
  revalidatePath("/admin/categories")
  revalidatePath("/admin/products")
  revalidatePath("/store")
  revalidatePath("/")
}

function applyParentFilter(query: any, parentId: string | null) {
  if (parentId) {
    return query.eq("parent_id", parentId)
  }
  return query.is("parent_id", null)
}

export async function createCategoryAction(input: {
  name_ar: string
  slug: string
  parent_id?: string | null
}) {
  const supabase = await createClient()
  const payload = categorySchema.parse(input)

  const maxOrderQuery = applyParentFilter(
    supabase.from("categories").select("sort_order").order("sort_order", { ascending: false }).limit(1),
    payload.parent_id ?? null,
  )
  const { data: maxRow } = await maxOrderQuery
  const nextOrder = ((maxRow?.[0]?.sort_order as number | undefined) ?? 0) + 100

  const { error } = await supabase.from("categories").insert({
    name_ar: payload.name_ar,
    name: payload.name_ar,
    slug: payload.slug,
    parent_id: payload.parent_id ?? null,
    sort_order: nextOrder,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  revalidateCategoryPaths()
  return { success: true }
}

export async function updateCategoryAction(input: {
  id: string
  name_ar: string
  slug: string
  parent_id?: string | null
}) {
  const supabase = await createClient()
  const payload = categorySchema.parse(input)

  const { error } = await supabase
    .from("categories")
    .update({
      name_ar: payload.name_ar,
      name: payload.name_ar,
      slug: payload.slug,
      parent_id: payload.parent_id ?? null,
    })
    .eq("id", payload.id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidateCategoryPaths()
  return { success: true }
}

export async function deleteCategoryAction(categoryId: string) {
  const supabase = await createClient()

  await supabase
    .from("categories")
    .update({ parent_id: null })
    .eq("parent_id", categoryId)

  const { error } = await supabase.from("categories").delete().eq("id", categoryId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidateCategoryPaths()
  return { success: true }
}

export async function reorderCategoriesAction(payload: { id: string; parentId: string | null; position: number }) {
  const supabase = await createClient()
  const { id, parentId, position } = reorderSchema.parse(payload)

  const { data: currentCategory, error: currentError } = await supabase
    .from("categories")
    .select("parent_id")
    .eq("id", id)
    .single()

  if (currentError) {
    return { success: false, error: currentError.message }
  }

  const oldParentId = currentCategory?.parent_id ?? null

  const siblingsQuery = applyParentFilter(
    supabase.from("categories").select("id, sort_order").order("sort_order", { ascending: true }),
    parentId ?? null,
  )

  const { data: siblings, error: siblingsError } = await siblingsQuery

  if (siblingsError) {
    return { success: false, error: siblingsError.message }
  }

  const filtered = (siblings ?? []).filter((sibling) => sibling.id !== id)
  const clampedPosition = Math.min(Math.max(position, 0), filtered.length)
  filtered.splice(clampedPosition, 0, { id, sort_order: clampedPosition * 100 })

  const updates = filtered.map((sibling, index) => ({
    id: sibling.id,
    sort_order: index * 100,
  }))

  const { error: updateError } = await supabase.from("categories").upsert(updates)
  if (updateError) {
    return { success: false, error: updateError.message }
  }

  const { error: parentError } = await supabase
    .from("categories")
    .update({ parent_id: parentId ?? null })
    .eq("id", id)

  if (parentError) {
    return { success: false, error: parentError.message }
  }

  if (oldParentId !== parentId) {
    const oldQuery = applyParentFilter(
      supabase.from("categories").select("id").order("sort_order", { ascending: true }),
      oldParentId,
    )
    const { data: oldSiblings } = await oldQuery
    if (oldSiblings) {
      const oldUpdates = oldSiblings.map((sibling, index) => ({
        id: sibling.id,
        sort_order: index * 100,
      }))
      await supabase.from("categories").upsert(oldUpdates)
    }
  }

  revalidateCategoryPaths()
  return { success: true }
}

