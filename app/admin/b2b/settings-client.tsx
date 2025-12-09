"use client"

import { useState } from "react"
import { Loader2, Save } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase"

type B2BSettings = {
  id?: string
  price_hidden: boolean
  contact_label: string | null
  contact_url: string | null
}

export function B2BSettingsClient({ initialSettings }: { initialSettings: B2BSettings | null }) {
  const supabase = getSupabaseClient()
  const [form, setForm] = useState<B2BSettings>({
    id: initialSettings?.id,
    price_hidden: Boolean(initialSettings?.price_hidden ?? false),
    contact_label: initialSettings?.contact_label ?? "تواصل مع المبيعات",
    contact_url: initialSettings?.contact_url ?? "/contact",
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
      price_hidden: form.price_hidden,
      contact_label: form.contact_label || "تواصل مع المبيعات",
      contact_url: form.contact_url || "/contact",
    }

    const { data, error: upsertError } = await supabase
      .from("b2b_settings")
      .upsert(payload)
      .select()
      .maybeSingle()

    if (upsertError) {
      console.error("Failed to save B2B settings", upsertError)
      setError("تعذر حفظ إعدادات منتجات الجملة")
    } else {
      setStatus("تم تحديث الإعدادات")
      if (data) {
        setForm({
          id: data.id,
          price_hidden: Boolean(data.price_hidden),
          contact_label: data.contact_label,
          contact_url: data.contact_url,
        })
      }
    }

    setIsSaving(false)
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <p className="text-sm text-[#8B6F47] mb-1">إعدادات منتجات الجملة</p>
        <h1 className="text-3xl font-bold text-[#2B2520]">إظهار/إخفاء الأسعار وCTA التواصل</h1>
        <p className="text-sm text-[#8B6F47]">تنطبق على متجر الجملة وصفحات المنتجات.</p>
      </div>

      {status && <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-700">{status}</div>}
      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</div>}

      <div className="rounded-2xl bg-white p-5 shadow-sm border border-[#E8E2D1] space-y-4">
        <label className="flex items-center gap-3 text-sm text-[#2B2520]">
          <input
            type="checkbox"
            checked={form.price_hidden}
            onChange={(e) => setForm((prev) => ({ ...prev, price_hidden: e.target.checked }))}
            className="accent-[#E8A835] w-5 h-5"
          />
          إخفاء الأسعار في متجر الجملة
        </label>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-[#2B2520] mb-1">نص زر التواصل</label>
            <input
              type="text"
              value={form.contact_label ?? ""}
              onChange={(e) => setForm((prev) => ({ ...prev, contact_label: e.target.value }))}
              className="w-full rounded-lg border border-[#D9D4C8] px-3 py-2 focus:border-[#E8A835]"
              placeholder="تواصل مع المبيعات"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#2B2520] mb-1">رابط التواصل</label>
            <input
              type="text"
              value={form.contact_url ?? ""}
              onChange={(e) => setForm((prev) => ({ ...prev, contact_url: e.target.value }))}
              className="w-full rounded-lg border border-[#D9D4C8] px-3 py-2 focus:border-[#E8A835]"
              placeholder="/contact أو mailto:..."
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
            حفظ الإعدادات
          </button>
        </div>
      </div>
    </div>
  )
}

