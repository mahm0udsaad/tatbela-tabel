"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Loader2, RefreshCw, Save } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase"
import { Switch } from "@/components/ui/switch"

type PromotionRecord = {
  id: string
  tagline: string | null
  title: string
  description: string | null
  cta_label: string | null
  cta_url: string | null
  background_from: string | null
  background_via: string | null
  background_to: string | null
  is_active: boolean
}

type PromotionFormState = {
  tagline: string
  title: string
  description: string
  cta_label: string
  cta_url: string
  background_from: string
  background_via: string
  background_to: string
  is_active: boolean
}

const DEFAULT_FORM_STATE: PromotionFormState = {
  tagline: "عرض حصري محدود",
  title: "خصم 10% على كل المنتجات",
  description: "استمتع بأفضل التوابل المصرية الأصلية بسعر خاص. العرض محدود الوقت فقط!",
  cta_label: "اغتنم العرض الآن",
  cta_url: "/store",
  background_from: "#1A4D2E",
  background_via: "#0F2F1F",
  background_to: "#1A4D2E",
  is_active: true,
}

export default function PromoBannerAdminPage() {
  const supabase = getSupabaseClient()
  const [formState, setFormState] = useState<PromotionFormState>(DEFAULT_FORM_STATE)
  const [recordId, setRecordId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPromotion = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    const { data, error: fetchError } = await supabase
      .from("homepage_promotions")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(1)

    if (fetchError) {
      console.error("فشل في جلب بيانات قسم العروض", fetchError)
      setError("تعذر تحميل البيانات. حاول مجدداً.")
      setRecordId(null)
      setFormState({ ...DEFAULT_FORM_STATE })
    } else if (data && data.length > 0) {
      hydrateFormState(data[0])
    } else {
      setRecordId(null)
      setFormState({ ...DEFAULT_FORM_STATE })
    }
    setIsLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchPromotion()
  }, [fetchPromotion])

  const hydrateFormState = (record: PromotionRecord) => {
    setRecordId(record.id)
    setFormState({
      tagline: record.tagline ?? "",
      title: record.title ?? "",
      description: record.description ?? "",
      cta_label: record.cta_label ?? "",
      cta_url: record.cta_url ?? "",
      background_from: record.background_from ?? DEFAULT_FORM_STATE.background_from,
      background_via: record.background_via ?? DEFAULT_FORM_STATE.background_via,
      background_to: record.background_to ?? DEFAULT_FORM_STATE.background_to,
      is_active: record.is_active,
    })
  }

  const handleInputChange = (field: keyof PromotionFormState, value: string | boolean) => {
    setFormState((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSaving(true)
    setError(null)

    const payload = {
      tagline: formState.tagline.trim() || null,
      title: formState.title.trim() || DEFAULT_FORM_STATE.title,
      description: formState.description.trim() || null,
      cta_label: formState.cta_label.trim() || null,
      cta_url: formState.cta_url.trim() || null,
      background_from: formState.background_from || DEFAULT_FORM_STATE.background_from,
      background_via: formState.background_via || DEFAULT_FORM_STATE.background_via,
      background_to: formState.background_to || DEFAULT_FORM_STATE.background_to,
      is_active: formState.is_active,
      updated_at: new Date().toISOString(),
    }

    try {
      if (recordId) {
        const { error: updateError } = await supabase.from("homepage_promotions").update(payload).eq("id", recordId)
        if (updateError) throw updateError
      } else {
        const { data, error: insertError } = await supabase
          .from("homepage_promotions")
          .insert([payload])
          .select("*")
          .single()
        if (insertError) throw insertError
        if (data) {
          hydrateFormState(data as PromotionRecord)
        }
      }
      fetchPromotion()
    } catch (saveError) {
      console.error("فشل في حفظ قسم العروض", saveError)
      setError("تعذر حفظ التغييرات. حاول مجدداً.")
    } finally {
      setIsSaving(false)
    }
  }

  const previewGradient = useMemo(() => {
    return `linear-gradient(90deg, ${formState.background_from}, ${formState.background_via}, ${formState.background_to})`
  }, [formState.background_from, formState.background_via, formState.background_to])

  return (
    <div className="rounded-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <p className="text-sm text-[#8B6F47] mb-1">القسم الترويجي</p>
            <h1 className="text-3xl font-bold text-[#2B2520]">إدارة قسم العرض الخاص</h1>
            <p className="text-sm text-[#8B6F47]">تحكم في النصوص، أزرار الدعوة، وألوان الخلفية مع إمكانية الإخفاء.</p>
          </div>
          <button
            type="button"
            onClick={() => fetchPromotion()}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#E8A835] px-4 py-2 text-sm font-semibold text-[#E8A835] hover:bg-[#FFF7E6]"
          >
            <RefreshCw size={16} />
            تحديث البيانات
          </button>
        </div>

        {error && <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-red-600">{error}</div>}

        <div className="grid gap-6 lg:grid-cols-2">
          <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-lg font-semibold text-[#2B2520]">تفاصيل النص</p>
              <div className="flex items-center gap-3 text-sm text-[#8B6F47]">
                <span>{formState.is_active ? "ظاهر على الصفحة" : "مخفي حالياً"}</span>
                <Switch
                  checked={formState.is_active}
                  onCheckedChange={(checked) => handleInputChange("is_active", checked)}
                  aria-label="تفعيل أو إخفاء القسم"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#2B2520]">الشارة العلوية</label>
                <input
                  type="text"
                  value={formState.tagline}
                  onChange={(event) => handleInputChange("tagline", event.target.value)}
                  className="w-full rounded-lg border border-[#D9D4C8] px-4 py-3 focus:border-[#E8A835] focus:outline-none"
                  placeholder="مثال: عرض حصري محدود"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#2B2520]">العنوان الرئيسي</label>
                <input
                  type="text"
                  value={formState.title}
                  onChange={(event) => handleInputChange("title", event.target.value)}
                  required
                  className="w-full rounded-lg border border-[#D9D4C8] px-4 py-3 focus:border-[#E8A835] focus:outline-none"
                  placeholder="خصم 10% على كل المنتجات"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#2B2520]">الوصف</label>
                <textarea
                  value={formState.description}
                  onChange={(event) => handleInputChange("description", event.target.value)}
                  className="h-32 w-full rounded-lg border border-[#D9D4C8] px-4 py-3 focus:border-[#E8A835] focus:outline-none"
                  placeholder="قدّم وصفاً قصيراً للعرض"
                />
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-lg font-semibold text-[#2B2520]">زر الدعوة للإجراء</p>
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#2B2520]">نص الزر</label>
                <input
                  type="text"
                  value={formState.cta_label}
                  onChange={(event) => handleInputChange("cta_label", event.target.value)}
                  className="w-full rounded-lg border border-[#D9D4C8] px-4 py-3 focus:border-[#E8A835] focus:outline-none"
                  placeholder="اغتنم العرض الآن"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#2B2520]">رابط الزر</label>
                <input
                  type="text"
                  value={formState.cta_url}
                  onChange={(event) => handleInputChange("cta_url", event.target.value)}
                  className="w-full rounded-lg border border-[#D9D4C8] px-4 py-3 focus:border-[#E8A835] focus:outline-none"
                  placeholder="/store"
                />
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-lg font-semibold text-[#2B2520]">ألوان التدرّج</p>
              <div className="grid gap-4 sm:grid-cols-3">
                {(["background_from", "background_via", "background_to"] as const).map((field, index) => (
                  <div key={field} className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-[#2B2520]">
                      {index === 0 ? "بداية اللون" : index === 1 ? "وسط التدرّج" : "نهاية التدرّج"}
                    </label>
                    <input
                      type="color"
                      value={formState[field]}
                      onChange={(event) => handleInputChange(field, event.target.value)}
                      className="h-12 w-full rounded-lg border border-[#D9D4C8] bg-white"
                    />
                    <input
                      type="text"
                      value={formState[field]}
                      onChange={(event) => handleInputChange(field, event.target.value)}
                      className="w-full rounded-lg border border-[#D9D4C8] px-3 py-2 text-sm focus:border-[#E8A835] focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#E8A835] py-3 text-base font-semibold text-white transition hover:bg-[#D9941E] disabled:opacity-60"
            >
              {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              حفظ التغييرات
            </button>
          </form>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="mb-4 text-lg font-semibold text-[#2B2520]">معاينة فورية</p>
            <div
              className="rounded-2xl px-4 py-12 text-center text-white"
              style={{ backgroundImage: previewGradient }}
            >
              <div className="mb-6 inline-block rounded-full bg-white/20 px-5 py-1 text-sm font-semibold">
                {formState.tagline || "الشارة العلوية"}
              </div>
              <h2 className="mb-4 text-3xl font-bold md:text-4xl">
                {formState.title || "أضف عنوان العرض هنا"}
              </h2>
              <p className="mx-auto mb-8 max-w-2xl text-base md:text-lg text-white/90">
                {formState.description || "أضف وصفاً موجزاً لعرضك التسويقي."}
              </p>
              {formState.cta_url && (
                <span className="inline-block rounded-lg bg-white px-8 py-3 text-base font-bold text-[#C41E3A]">
                  {formState.cta_label || "زر الدعوة"}
                </span>
              )}
            </div>
            {isLoading && (
              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-[#8B6F47]">
                <Loader2 className="animate-spin" size={16} />
                يتم تحميل البيانات الحالية...
              </div>
            )}
          </div>
        </div>
    </div>
  )
}


