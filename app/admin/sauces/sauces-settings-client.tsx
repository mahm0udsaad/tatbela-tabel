"use client"

import { useState } from "react"
import Link from "next/link"
import { Loader2, Save, EyeOff, Eye } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase"

type SettingsRecord = {
  is_active: boolean
  payload: { message?: string } | null
}

export function SaucesSettingsClient({ initialSettings }: { initialSettings: SettingsRecord | null }) {
  const supabase = getSupabaseClient()
  // Desired meaning:
  // - is_active = true  => visible normally (no special "coming soon" override)
  // - is_active = false => hidden => show "coming soon" message on store sauces category
  const [isActive, setIsActive] = useState<boolean>(initialSettings?.is_active ?? true)
  const [message, setMessage] = useState<string>(initialSettings?.payload?.message ?? "قريبا أقوى أنواع الصوصات")
  const [isSaving, setIsSaving] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    setIsSaving(true)
    setStatus(null)
    setError(null)

    const { error: upsertError } = await supabase.from("page_settings").upsert({
      key: "sauces_page",
      is_active: isActive,
      payload: { message: message.trim() || "قريبا أقوى أنواع الصوصات" },
      updated_at: new Date().toISOString(),
    })

    if (upsertError) {
      console.error("Failed to save sauces settings", upsertError)
      setError("تعذر حفظ الإعدادات")
    } else {
      setStatus("تم حفظ إعدادات صفحة الصوصات")
    }
    setIsSaving(false)
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <p className="text-sm text-[#8B6F47] mb-2">إدارة صفحة الصوصات</p>
        <h1 className="text-3xl font-bold text-[#2B2520]">التحكم في إظهار/إخفاء صفحة الصوصات</h1>
        <p className="text-sm text-[#8B6F47]">اضبط حالة الصفحة ورسالة \"قريباً\" الظاهرة للعملاء.</p>
      </div>

      {status && <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-700">{status}</div>}
      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</div>}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-[#2B2520]">حالة الصفحة</p>
              <p className="text-xs text-[#8B6F47]">
                {isActive ? "ظاهرة للعملاء (عرض المنتجات بشكل طبيعي)" : "مخفية (سيظهر تنبيه: قريباً) بدل المنتجات"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsActive((prev) => !prev)}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold border ${
                isActive ? "bg-[#E8A835] text-white border-[#E8A835]" : "bg-white text-[#2B2520] border-[#D9D4C8]"
              }`}
            >
              {isActive ? <Eye size={16} /> : <EyeOff size={16} />}
              {isActive ? "حالة: ظاهر" : "حالة: مخفي (قريباً)"}
            </button>
          </div>

          <div className="rounded-xl border border-[#E8E2D1] bg-[#FFF8ED] px-4 py-3">
            <p className="text-sm font-semibold text-[#2B2520] mb-1">ترتيب منتجات الصوصات</p>
            <p className="text-xs text-[#8B6F47] mb-3">
              إذا كانت منتجات الصوصات موجودة ضمن فئة slug: sauces، يمكنك ترتيبها بسحب وإفلات.
            </p>
            <Link
              href="/admin/products/order?client=sauces"
              className="inline-flex items-center justify-center rounded-lg border border-[#E8A835] px-4 py-2 text-sm font-semibold text-[#E8A835] bg-white hover:bg-[#FFF8ED] transition-colors"
            >
              فتح صفحة ترتيب الصوصات
            </Link>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#2B2520]">نص رسالة \"قريباً\" (تظهر فقط عند الإخفاء)</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full rounded-lg border border-[#D9D4C8] px-4 py-3 h-28 focus:border-[#E8A835] focus:outline-none"
              placeholder="قريبا أقوى أنواع الصوصات"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-lg bg-[#E8A835] text-white px-6 py-3 font-semibold hover:bg-[#D9941E] disabled:opacity-60"
          >
            {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            حفظ التغييرات
          </button>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-[#2B2520] mb-4">معاينة الصفحة للعملاء</p>
          <div className="rounded-xl border border-[#E8E2D1] bg-[#F5F1E8] p-6 space-y-3 text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-white shadow">
              <span className="text-5xl">🍲</span>
            </div>
            {isActive ? (
              <p className="text-lg text-[#8B6F47]">
                سيتم عرض المنتجات في صفحة المتجر (وإذا لم توجد منتجات سيظهر \"لا توجد منتجات مطابقة حالياً\").
              </p>
            ) : (
              <>
                <p className="text-lg text-[#8B6F47]">سيظهر تنبيه \"قريباً\" بالنص التالي:</p>
                <h3 className="text-2xl font-bold text-[#C41E3A]">{message || "قريبا أقوى أنواع الصوصات"}</h3>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

