"use client"

import { useState } from "react"
import { Loader2, Save } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase"

type FreeShippingRule = {
  id?: string
  threshold_amount: number
  expires_at: string | null
  is_active: boolean
}

export function FreeShippingAdminClient({ initialRule }: { initialRule: FreeShippingRule | null }) {
  const supabase = getSupabaseClient()
  const [form, setForm] = useState<FreeShippingRule>({
    id: initialRule?.id,
    threshold_amount: Number(initialRule?.threshold_amount ?? 0),
    expires_at: initialRule?.expires_at ?? null,
    is_active: Boolean(initialRule?.is_active ?? false),
  })
  const [isSaving, setIsSaving] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    setIsSaving(true)
    setStatus(null)
    setError(null)

    const payload = {
      id: form.id,
      applies_to: "b2c",
      threshold_amount: Number(form.threshold_amount) || 0,
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
      is_active: Boolean(form.is_active),
    }

    const { data, error: upsertError } = await supabase
      .from("free_shipping_rules")
      .upsert(payload, { onConflict: "applies_to" })
      .select()
      .maybeSingle()

    if (upsertError) {
      console.error("Failed to save free shipping rule", upsertError)
      setError("تعذر حفظ عرض الشحن المجاني")
    } else {
      setStatus("تم تحديث العرض")
      if (data) {
        setForm({
          id: data.id,
          threshold_amount: Number(data.threshold_amount ?? 0),
          expires_at: data.expires_at,
          is_active: Boolean(data.is_active),
        })
      }
    }
    setIsSaving(false)
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <p className="text-sm text-[#8B6F47] mb-1">الشحن المجاني</p>
        <h1 className="text-3xl font-bold text-[#2B2520]">إدارة عرض الشحن المجاني (B2C)</h1>
        <p className="text-sm text-[#8B6F47]">حدد الحد الأدنى للإنفاق وتاريخ الانتهاء الاختياري.</p>
      </div>

      {status && <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-700">{status}</div>}
      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</div>}

      <div className="rounded-2xl bg-white p-5 shadow-sm border border-[#E8E2D1] space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#2B2520]">تفاصيل العرض</h2>
          <label className="flex items-center gap-2 text-sm text-[#2B2520]">
            <input
            dir="rtl"
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))}
              className="accent-[#E8A835] w-5 h-5 "
            />
            تفعيل
          </label>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-[#2B2520] mb-1">الحد الأدنى للطلب (ج.م)</label>
            <input
              type="number"
              min={0}
              value={form.threshold_amount}
              onChange={(e) => setForm((prev) => ({ ...prev, threshold_amount: Number(e.target.value) || 0 }))}
              className="w-full rounded-lg border border-[#D9D4C8] px-3 py-2 focus:border-[#E8A835]"
              placeholder="مثال: 500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#2B2520] mb-1">تاريخ الانتهاء (اختياري)</label>
            <input
              type="datetime-local"
              value={form.expires_at ? form.expires_at.slice(0, 16) : ""}
              onChange={(e) => setForm((prev) => ({ ...prev, expires_at: e.target.value ? e.target.value : null }))}
              className="w-full rounded-lg border border-[#D9D4C8] px-3 py-2 focus:border-[#E8A835]"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-lg bg-[#E8A835] text-white px-5 py-3 font-semibold hover:bg-[#D9941E] disabled:opacity-60"
          >
            {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            حفظ العرض
          </button>
        </div>
      </div>
    </div>
  )
}

