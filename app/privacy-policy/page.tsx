import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { DEFAULT_PRIVACY_POLICY } from "@/lib/site-content/defaults"
import { policyPagePayloadSchema } from "@/lib/site-content/schemas"

export const metadata: Metadata = {
  title: "سياسة الخصوصية | تتبيلة & تابل",
  description: "سياسة الخصوصية وحماية البيانات لمتجر تتبيلة وتابل.",
}

export const dynamic = "force-dynamic"

type PolicySettingsRow = {
  is_active: boolean
  payload: unknown
}

export default async function PrivacyPolicyPage() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("page_settings")
    .select("is_active, payload")
    .eq("key", "privacy_policy")
    .maybeSingle()

  if (error) {
    console.error("Failed to load privacy policy settings", error)
  }

  const row = (data ?? null) as PolicySettingsRow | null
  const isActive = row ? Boolean(row.is_active) : true
  const parsed = policyPagePayloadSchema.safeParse(row?.payload)
  const payload = parsed.success ? parsed.data : DEFAULT_PRIVACY_POLICY

  if (!isActive) {
    return (
      <main className="min-h-screen">
        <section className="py-24 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-4xl font-bold text-[#2B2520] mb-4">سياسة الخصوصية</h1>
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
          <div className="mb-8 text-right">
            <h1 className="text-4xl md:text-5xl font-bold text-[#2B2520] leading-tight">{payload.title}</h1>
            <div className="mt-4 h-1 w-16 rounded-full bg-[#E8A835]" />
          </div>

          <article className="rounded-2xl border border-[#E8E2D1] bg-white p-6 md:p-8">
            <div className="space-y-6 text-[#5C5347] leading-8 text-right">
              {payload.sections.map((section, idx) => (
                <section key={idx}>
                  <h2 className="text-2xl font-bold text-[#2B2520] mb-3">{idx + 1}. {section.heading}</h2>
                  <div className="whitespace-pre-line">{section.content}</div>
                </section>
              ))}

              {payload.footer && (
                <div className="pt-6 border-t border-[#E8E2D1] mt-8">
                  <p className="font-bold">تواصل معنا:</p>
                  <p>{payload.footer}</p>
                </div>
              )}
            </div>
          </article>
        </div>
      </section>
    </main>
  )
}
