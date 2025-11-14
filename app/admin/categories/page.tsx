import { AdminSidebar } from "../sidebar"
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
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 bg-[#F5F1E8] p-6">
        <CategoryManager initialCategories={categories ?? []} />
      </main>
    </div>
  )
}

