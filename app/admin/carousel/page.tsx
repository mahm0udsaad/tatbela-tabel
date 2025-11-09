"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase"
import { AdminSidebar } from "../sidebar"
import { Plus, Edit2, Trash2, Upload, Loader2, ImageDown } from "lucide-react"

interface CarouselImage {
  id: string
  image_url: string
  alt_text: string | null
  link_url: string | null
  sort_order: number | null
  created_at?: string
}

interface FormState {
  alt_text: string
  link_url: string
  sort_order: number
}

export default function AdminCarouselPage() {
  const [slides, setSlides] = useState<CarouselImage[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingSlide, setEditingSlide] = useState<CarouselImage | null>(null)
  const [formData, setFormData] = useState<FormState>({ alt_text: "", link_url: "", sort_order: 0 })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const supabase = getSupabaseClient()
  const router = useRouter()

  useEffect(() => {
    fetchSlides()
  }, [])

  const fetchSlides = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("hero_carousel_images")
      .select("id, image_url, alt_text, link_url, sort_order, created_at")
      .order("sort_order", { ascending: true, nullsFirst: true })
      .order("created_at", { ascending: true })

    if (error) {
      console.error("فشل في جلب صور السلايدر", error)
      setSlides([])
    } else {
      setSlides(data || [])
    }
    setLoading(false)
  }

  const resetForm = () => {
    setFormData({ alt_text: "", link_url: "", sort_order: 0 })
    setSelectedFile(null)
    setPreviewUrl(null)
    setEditingSlide(null)
  }

  const startCreate = () => {
    resetForm()
    setShowForm(true)
  }

  const startEdit = (slide: CarouselImage) => {
    setEditingSlide(slide)
    setFormData({
      alt_text: slide.alt_text ?? "",
      link_url: slide.link_url ?? "",
      sort_order: slide.sort_order ?? 0,
    })
    setPreviewUrl(slide.image_url)
    setShowForm(true)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const uploadImageIfNeeded = async () => {
    if (!selectedFile) {
      return editingSlide?.image_url ?? null
    }

    const fileExt = selectedFile.name.split(".").pop()
    const fileName = `carousel/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`
    const { error: uploadError } = await supabase.storage.from("product-images").upload(fileName, selectedFile, {
      cacheControl: "3600",
      upsert: false,
    })

    if (uploadError) {
      throw uploadError
    }

    const { data } = supabase.storage.from("product-images").getPublicUrl(fileName)
    return data.publicUrl
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSaving(true)
    try {
      const uploadedUrl = await uploadImageIfNeeded()
      if (!uploadedUrl) {
        alert("يجب إضافة صورة للسلايدر")
        setIsSaving(false)
        return
      }

      const payload = {
        image_url: uploadedUrl,
        alt_text: formData.alt_text.trim() || null,
        link_url: formData.link_url.trim() || null,
        sort_order: Number(formData.sort_order) || 0,
      }

      if (editingSlide) {
        const { error } = await supabase.from("hero_carousel_images").update(payload).eq("id", editingSlide.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from("hero_carousel_images").insert(payload)
        if (error) throw error
      }

      setShowForm(false)
      resetForm()
      fetchSlides()
    } catch (error) {
      console.error("فشل في حفظ السلايدر", error)
      alert("حدث خطأ أثناء حفظ البيانات")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (slide: CarouselImage) => {
    if (!confirm("هل أنت متأكد من حذف هذه الصورة؟")) return
    const { error } = await supabase.from("hero_carousel_images").delete().eq("id", slide.id)
    if (error) {
      console.error("فشل في حذف الصورة", error)
      alert("تعذر حذف الصورة")
      return
    }
    fetchSlides()
  }

  return (
    <div className="flex min-h-screen bg-[#F5F1E8]">
      <AdminSidebar onLogout={handleLogout} />
      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-sm text-[#8B6F47] mb-2">مظهر الصفحة الرئيسية</p>
            <h1 className="text-3xl font-bold text-[#2B2520]">إدارة صور السلايدر</h1>
          </div>
          <button
            onClick={startCreate}
            className="flex items-center gap-2 px-6 py-3 bg-[#E8A835] text-white rounded-lg font-bold hover:bg-[#D9941E]"
          >
            <Plus size={20} />
            إضافة صورة جديدة
          </button>
        </div>

        {showForm && (
          <div className="mb-10 bg-white rounded-2xl p-6 shadow-md">
            <div className="flex items-center gap-3 mb-6">
              <ImageDown className="text-[#E8A835]" />
              <div>
                <h2 className="text-2xl font-bold text-[#2B2520]">
                  {editingSlide ? "تعديل صورة" : "إضافة صورة"}
                </h2>
                <p className="text-sm text-[#8B6F47]">ستظهر هذه الصورة في السلايدر الرئيسي للموقع</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-[#2B2520] mb-2">الوصف (اختياري)</label>
                  <input
                    type="text"
                    value={formData.alt_text}
                    onChange={(e) => setFormData((prev) => ({ ...prev, alt_text: e.target.value }))}
                    className="w-full rounded-lg border border-[#D9D4C8] px-4 py-3 focus:outline-none focus:border-[#E8A835]"
                    placeholder="مثال: عرض الصيف الذهبي"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#2B2520] mb-2">رابط الزر (اختياري)</label>
                  <input
                    type="text"
                    value={formData.link_url}
                    onChange={(e) => setFormData((prev) => ({ ...prev, link_url: e.target.value }))}
                    className="w-full rounded-lg border border-[#D9D4C8] px-4 py-3 focus:outline-none focus:border-[#E8A835]"
                    placeholder="مثال: /store"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 items-center">
                <div>
                  <label className="block text-sm font-semibold text-[#2B2520] mb-2">ترتيب العرض</label>
                  <input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData((prev) => ({ ...prev, sort_order: Number(e.target.value) }))}
                    className="w-full rounded-lg border border-[#D9D4C8] px-4 py-3 focus:outline-none focus:border-[#E8A835]"
                    placeholder="0"
                    min={0}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#2B2520] mb-3">
                    تحميل الصورة {editingSlide ? "(اتركها كما هي للإبقاء على الحالية)" : ""}
                  </label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-[#D9D4C8] rounded-xl cursor-pointer text-[#8B6F47] hover:border-[#E8A835]">
                      <Upload size={18} />
                      تحميل صورة
                      <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                    </label>
                    {previewUrl && (
                      <img src={previewUrl} alt="preview" className="h-20 w-32 object-cover rounded-lg border border-[#E8A835]/30" />
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-3 bg-[#E8A835] text-white font-semibold rounded-lg hover:bg-[#D9941E] disabled:opacity-60 flex items-center gap-2"
                >
                  {isSaving && <Loader2 className="animate-spin" size={18} />}
                  حفظ الصورة
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    resetForm()
                  }}
                  className="px-6 py-3 border border-[#2B2520] text-[#2B2520] rounded-lg font-semibold hover:bg-[#F5F1E8]"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-[#2B2520]">الصور الحالية</h2>
            <p className="text-sm text-[#8B6F47]">عدد الصور: {slides.length}</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16 text-[#8B6F47]">جار التحميل...</div>
          ) : slides.length === 0 ? (
            <div className="text-center py-16 text-[#8B6F47]">
              لا توجد صور حالياً. ابدأ بإضافة صورة جديدة.
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {slides.map((slide) => (
                <div key={slide.id} className="border border-[#E8A835]/30 rounded-2xl overflow-hidden bg-[#FFFDF8]">
                  <div className="aspect-[16/9] bg-[#F5F1E8]">
                    <img src={slide.image_url} alt={slide.alt_text ?? "صورة"} className="h-full w-full object-cover" />
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#8B6F47]">الترتيب: {slide.sort_order ?? 0}</span>
                      {slide.link_url && (
                        <span className="text-xs text-[#C41E3A] bg-[#C41E3A]/10 px-2 py-1 rounded-full">{slide.link_url}</span>
                      )}
                    </div>
                    {slide.alt_text && <p className="text-[#2B2520] font-semibold">{slide.alt_text}</p>}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => startEdit(slide)}
                        className="flex-1 px-4 py-2 bg-white border border-[#E8A835] text-[#E8A835] rounded-lg font-semibold hover:bg-[#FFF3D6] flex items-center justify-center gap-2"
                      >
                        <Edit2 size={16} />
                        تعديل
                      </button>
                      <button
                        onClick={() => handleDelete(slide)}
                        className="flex-1 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg font-semibold hover:bg-red-100 flex items-center justify-center gap-2"
                      >
                        <Trash2 size={16} />
                        حذف
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
