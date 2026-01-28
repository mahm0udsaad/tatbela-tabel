import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Check if user is authenticated (optional: add admin check)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { id, price_hidden, contact_label, contact_url } = body

    const payload = {
      id,
      price_hidden: Boolean(price_hidden),
      contact_label: contact_label || "تواصل مع المبيعات",
      contact_url: contact_url || "/contact",
    }

    const { data, error } = await supabase
      .from("b2b_settings")
      .upsert(payload)
      .select()
      .maybeSingle()

    if (error) {
      console.error("Failed to save B2B settings", error)
      return NextResponse.json({ error: "Failed to save settings" }, { status: 500 })
    }

    // Revalidate all B2B pages to clear cache
    revalidatePath("/b2b", "layout")
    revalidatePath("/b2b")
    revalidatePath("/b2b/product/[id]", "page")

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error in B2B settings API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
