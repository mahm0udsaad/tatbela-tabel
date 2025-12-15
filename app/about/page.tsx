import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { DEFAULT_ABOUT_PAGE } from "@/lib/site-content/defaults"
import { aboutPagePayloadSchema, coerceAboutPagePayload } from "@/lib/site-content/schemas"

export const metadata: Metadata = {
  title: "من نحن | Tatbeelah & Tabel",
  description: "تعرف على قصة تتبيلة وتابل، قيمنا، وشركائنا في صناعة التوابل المصرية الأصيلة.",
}

export const dynamic = "force-dynamic"

type AboutSettingsRow = {
  is_active: boolean
  payload: unknown
}

export default async function AboutPage() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("page_settings")
    .select("is_active, payload")
    .eq("key", "about_page")
    .maybeSingle()

  if (error) {
    console.error("Failed to load about page settings", error)
  }

  const row = (data ?? null) as AboutSettingsRow | null
  const isActive = row ? Boolean(row.is_active) : true
  const payload = coerceAboutPagePayload(row?.payload, DEFAULT_ABOUT_PAGE)

  if (!isActive) {
    return (
      <main className="min-h-screen">
        <section className="py-24 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-4xl font-bold text-[#2B2520] mb-4">من نحن</h1>
            <p className="text-lg text-[#8B6F47]">هذه الصفحة غير متاحة حالياً.</p>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-screen">
      <section className="py-12 md:py-16">
        <div className="max-w-3xl mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-[#2B2520] leading-tight">{payload.title}</h1>
            <div className="mt-4 h-1 w-16 rounded-full bg-[#E8A835]" />
          </div>

          <article className="rounded-2xl border border-[#E8E2D1] bg-white p-6 md:p-8">
            <div className="space-y-5 text-[#5C5347] leading-8">
              {payload.content
                .split(/\n\s*\n/g)
                .map((para) => para.trim())
                .filter(Boolean)
                .map((para, idx) => (
                  <p key={idx} className="text-base md:text-lg">
                    {para.split("\n").map((line, j, arr) => (
                      <span key={j}>
                        {line}
                        {j < arr.length - 1 ? <br /> : null}
                      </span>
                    ))}
                  </p>
                ))}
            </div>
          </article>
        </div>
      </section>
    </main>
  )
}

