"use client"

import { useEffect, useState } from "react"
import { Loader2, Save, GripVertical, ListOrdered } from "lucide-react"
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { getSupabaseClient } from "@/lib/supabase"

type B2BSettings = {
  id?: string
  price_hidden: boolean
  contact_label: string | null
  contact_url: string | null
}

type B2BCategory = {
  id: string
  name_ar: string
  sort_order: number | null
}

export function B2BSettingsClient({
  initialSettings,
  initialCategories,
}: {
  initialSettings: B2BSettings | null
  initialCategories: B2BCategory[]
}) {
  const supabase = getSupabaseClient()
  const [form, setForm] = useState<B2BSettings>({
    id: initialSettings?.id,
    price_hidden: Boolean(initialSettings?.price_hidden ?? false),
    contact_label: initialSettings?.contact_label ?? "تواصل مع المبيعات",
    contact_url: initialSettings?.contact_url ?? "/contact",
  })
  const [categories, setCategories] = useState<B2BCategory[]>(initialCategories)
  const [isSaving, setIsSaving] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  )

  useEffect(() => {
    setCategories(initialCategories)
  }, [initialCategories])

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

    try {
      const response = await fetch("/api/admin/b2b-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (!response.ok || result.error) {
        console.error("Failed to save B2B settings", result.error)
        setError("تعذر حفظ إعدادات منتجات الجملة")
      } else {
        setStatus("تم تحديث الإعدادات")
        if (result.data) {
          setForm({
            id: result.data.id,
            price_hidden: Boolean(result.data.price_hidden),
            contact_label: result.data.contact_label,
            contact_url: result.data.contact_url,
          })
        }
        // Refresh the page to show updated settings
        window.location.reload()
      }
    } catch (err) {
      console.error("Failed to save B2B settings", err)
      setError("تعذر حفظ إعدادات منتجات الجملة")
    }

    setIsSaving(false)
  }

  const persistSort = async (items: B2BCategory[]) => {
    const updates = items.map((cat, index) =>
      supabase.from("categories").update({ sort_order: index }).eq("id", cat.id),
    )
    const results = await Promise.all(updates)
    const updateError = results.find((r) => r.error)?.error
    if (updateError) {
      console.error("Failed to persist category order", updateError)
      setError("تعذر حفظ ترتيب الفئات")
    } else {
      setStatus("تم تحديث ترتيب الفئات")
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = categories.findIndex((z) => z.id === active.id)
    const newIndex = categories.findIndex((z) => z.id === over.id)
    const reordered = arrayMove(categories, oldIndex, newIndex)
    setCategories(reordered)
    await persistSort(reordered)
  }

  function SortableCategory({ category }: { category: B2BCategory }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: category.id })
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      zIndex: isDragging ? 10 : undefined,
      boxShadow: isDragging ? "0 10px 25px rgba(0,0,0,0.08)" : undefined,
    }
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="flex items-center justify-between gap-3 p-3 mb-2 rounded-xl border border-[#E8E2D1] bg-white touch-none"
      >
        <button
          className="p-2 text-[#8B6F47] hover:text-[#E8A835] cursor-grab active:cursor-grabbing"
          {...attributes}
          {...listeners}
          aria-label="اسحب لإعادة الترتيب"
        >
          <GripVertical size={16} />
        </button>
        <div className="flex-1">
          <p className="font-semibold text-[#2B2520]">{category.name_ar}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <p className="text-sm text-[#8B6F47] mb-1">إعدادات منتجات الجملة</p>
        <h1 className="text-3xl font-bold text-[#2B2520]">إظهار/إخفاء الأسعار، التواصل، وترتيب الفئات</h1>
        <p className="text-sm text-[#8B6F47]">تنطبق على متجر الجملة وصفحات المنتجات.</p>
      </div>

      {status && <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-700">{status}</div>}
      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</div>}

      <div className="rounded-2xl bg-white p-5 shadow-sm border border-[#E8E2D1] space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#2B2520]">إخفاء الأسعار / CTA التواصل</h2>
          <label className="flex items-center gap-3 text-sm text-[#2B2520]">
            <input
              type="checkbox"
              checked={form.price_hidden}
              onChange={(e) => setForm((prev) => ({ ...prev, price_hidden: e.target.checked }))}
              className="accent-[#E8A835] w-5 h-5"
            />
            إخفاء الأسعار في متجر الجملة
          </label>
        </div>

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

      <div className="rounded-2xl bg-white p-5 shadow-sm border border-[#E8E2D1] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#2B2520]">فئات منتجات الجملة</h2>
            <p className="text-sm text-[#8B6F47]">اسحب وأفلت لإعادة ترتيب الظهور في متجر B2B.</p>
          </div>
          <ListOrdered size={18} className="text-[#8B6F47]" />
        </div>
        {categories.length === 0 ? (
          <p className="text-sm text-[#8B6F47]">لا توجد فئات حالياً.</p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={categories} strategy={verticalListSortingStrategy}>
              {categories.map((cat) => (
                <SortableCategory key={cat.id} category={cat} />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  )
}

