import { createClient } from "@/lib/supabase/server"
import { CategoryManager } from "./category-manager"

export const dynamic = "force-dynamic"

export default async function AdminCategoriesPage() {
  const supabase = await createClient()
  const { data: categories, error } = await supabase
    .from("categories")
    .select("id, name_ar, slug, parent_id, sort_order")
    .order("sort_order", { ascending: true })

  if (error) {
    console.error("Failed to load categories:", error)
  }

  return (
    <div className="rounded-lg">
      <CategoryManager initialCategories={categories ?? []} />
    </div>
  )
}

