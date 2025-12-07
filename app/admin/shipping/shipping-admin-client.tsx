"use client"

import { useEffect, useState } from "react"
import { Loader2, Plus, Save, Trash2, Pencil, RefreshCw, GripVertical } from "lucide-react"
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

type ShippingZone = {
  id: string
  governorate: string
  base_rate: number
  per_kg_rate: number
  estimated_days: number
  sort_order?: number | null
}

const emptyForm: Partial<ShippingZone> = {
  governorate: "",
  base_rate: 0,
  per_kg_rate: 0,
  estimated_days: 3,
}

export function ShippingAdminClient({ initialZones }: { initialZones: ShippingZone[] }) {
  const supabase = getSupabaseClient()
  const [zones, setZones] = useState<ShippingZone[]>(initialZones)
  const [form, setForm] = useState<Partial<ShippingZone>>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  )

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId(null)
  }

  const fetchZones = async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from("shipping_zones")
      .select("id, governorate, base_rate, per_kg_rate, estimated_days, sort_order")
      .order("sort_order", { ascending: true, nullsFirst: true })
      .order("governorate", { ascending: true })
    if (error) {
      console.error("Failed to fetch shipping zones", error)
      setError("تعذر تحميل المحافظات")
    } else {
      setZones(data ?? [])
    }
    setIsLoading(false)
  }

  useEffect(() => {
    setZones(initialZones)
  }, [initialZones])

  const handleSave = async () => {
    if (!form.governorate?.trim()) {
      setError("اسم المحافظة مطلوب")
      return
    }
    setIsSaving(true)
    setError(null)
    setStatus(null)

    const payload = {
      governorate: form.governorate.trim(),
      base_rate: Number(form.base_rate) || 0,
      per_kg_rate: Number(form.per_kg_rate) || 0,
      estimated_days: Number(form.estimated_days) || 3,
    }

    const { data, error: upsertError } = await supabase
      .from("shipping_zones")
      .upsert(editingId ? { id: editingId, ...payload } : payload)
      .select()

    if (upsertError) {
      console.error("Failed to save shipping zone", upsertError)
      setError("تعذر حفظ المحافظة")
    } else {
      setStatus(editingId ? "تم تحديث المحافظة" : "تم إضافة محافظة")
      if (data) {
        const saved = data[0] as ShippingZone
        setZones((prev) => {
          const without = prev.filter((z) => z.id !== saved.id)
          return [...without, saved]
        })
      } else {
        fetchZones()
      }
      resetForm()
    }
    setIsSaving(false)
  }

  const handleEdit = (zone: ShippingZone) => {
    setEditingId(zone.id)
    setForm(zone)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("هل تريد حذف هذه المحافظة وأسعارها؟")) return
    const { error: deleteError } = await supabase.from("shipping_zones").delete().eq("id", id)
    if (deleteError) {
      console.error("Failed to delete zone", deleteError)
      setError("تعذر الحذف")
      return
    }
    setZones((prev) => prev.filter((z) => z.id !== id))
    setStatus("تم حذف المحافظة")
    if (editingId === id) resetForm()
  }

  const persistSort = async (items: ShippingZone[]) => {
    const updates = items.map((zone, index) =>
      supabase.from("shipping_zones").update({ sort_order: index }).eq("id", zone.id),
    )
    const results = await Promise.all(updates)
    const updateError = results.find((r) => r.error)?.error
    if (updateError) {
      console.error("Failed to persist sort order", updateError)
      setError("تعذر حفظ ترتيب المحافظات")
    } else {
      setStatus("تم تحديث ترتيب المحافظات")
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = zones.findIndex((z) => z.id === active.id)
    const newIndex = zones.findIndex((z) => z.id === over.id)
    const reordered = arrayMove(zones, oldIndex, newIndex)
    setZones(reordered)
    await persistSort(reordered)
  }

  function SortableRow({ zone }: { zone: ShippingZone }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: zone.id })
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      zIndex: isDragging ? 20 : undefined,
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
          <GripVertical size={18} />
        </button>
        <div className="flex-1">
          <p className="font-semibold text-[#2B2520]">{zone.governorate}</p>
          <div className="flex flex-wrap gap-3 text-xs text-[#8B6F47] mt-1">
            <span>أساس: {Number(zone.base_rate).toFixed(0)} ج.م</span>
            <span>لكل كجم: {Number(zone.per_kg_rate).toFixed(0)} ج.م</span>
            <span>أيام: {zone.estimated_days}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleEdit(zone)}
            className="p-2 rounded-lg border border-[#E8A835] text-[#E8A835]"
            title="تعديل"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={() => handleDelete(zone.id)}
            className="p-2 rounded-lg border border-red-200 text-red-600"
            title="حذف"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-sm text-[#8B6F47] mb-1">أسعار الشحن</p>
          <h1 className="text-3xl font-bold text-[#2B2520]">إدارة تكلفة الشحن لكل محافظة</h1>
          <p className="text-sm text-[#8B6F47]">حدد سعر الأساس، السعر لكل كجم، ومدة التوصيل التقديرية.</p>
        </div>
        <button
          type="button"
          onClick={fetchZones}
          className="inline-flex items-center gap-2 rounded-lg border border-[#E8A835] px-4 py-2 text-sm font-semibold text-[#E8A835] hover:bg-[#FFF7E6]"
        >
          <RefreshCw size={16} />
          تحديث القائمة
        </button>
      </div>

      {status && <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-700">{status}</div>}
      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</div>}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-[#2B2520]">المحافظات</h2>
            {isLoading && <Loader2 className="animate-spin text-[#8B6F47]" size={18} />}
          </div>
          {zones.length === 0 ? (
            <p className="text-sm text-[#8B6F47]">لا توجد محافظات بعد.</p>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={zones} strategy={verticalListSortingStrategy}>
                {zones.map((zone) => (
                  <SortableRow key={zone.id} zone={zone} />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#2B2520]">{editingId ? "تعديل محافظة" : "إضافة محافظة"}</h2>
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center gap-2 rounded-lg border border-[#D9D4C8] px-3 py-2 text-sm text-[#8B6F47]"
            >
              <Plus size={14} />
              جديد
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-semibold text-[#2B2520] mb-1">المحافظة</label>
              <input
                type="text"
                value={form.governorate ?? ""}
                onChange={(e) => setForm((prev) => ({ ...prev, governorate: e.target.value }))}
                className="w-full rounded-lg border border-[#D9D4C8] px-3 py-2 focus:border-[#E8A835] focus:outline-none"
                placeholder="القاهرة، الجيزة، الإسكندرية..."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-[#2B2520] mb-1">سعر الأساس (ج.م)</label>
                <input
                  type="number"
                  value={form.base_rate ?? 0}
                  onChange={(e) => setForm((prev) => ({ ...prev, base_rate: Number(e.target.value) }))}
                  className="w-full rounded-lg border border-[#D9D4C8] px-3 py-2 focus:border-[#E8A835]"
                  min={0}
                  step="0.5"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#2B2520] mb-1">لكل كجم (ج.م)</label>
                <input
                  type="number"
                  value={form.per_kg_rate ?? 0}
                  onChange={(e) => setForm((prev) => ({ ...prev, per_kg_rate: Number(e.target.value) }))}
                  className="w-full rounded-lg border border-[#D9D4C8] px-3 py-2 focus:border-[#E8A835]"
                  min={0}
                  step="0.5"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#2B2520] mb-1">الأيام التقديرية</label>
              <input
                type="number"
                value={form.estimated_days ?? 3}
                onChange={(e) => setForm((prev) => ({ ...prev, estimated_days: Number(e.target.value) }))}
                className="w-full rounded-lg border border-[#D9D4C8] px-3 py-2 focus:border-[#E8A835]"
                min={1}
              />
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-lg bg-[#E8A835] text-white px-5 py-3 font-semibold hover:bg-[#D9941E] disabled:opacity-60 w-full justify-center"
          >
            {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            {editingId ? "تحديث" : "حفظ"}
          </button>
        </div>
      </div>
    </div>
  )
}

