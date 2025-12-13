"use client"

import { useEffect, useRef, useState } from "react"
import { getSupabaseClient } from "@/lib/supabase"
import { Plus, Edit2, Trash2, Upload, Loader2, ImageDown, GripVertical } from "lucide-react"
import ReactCrop, { type Crop } from "react-image-crop"
import "react-image-crop/dist/ReactCrop.css"
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core"
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, rectSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

const HERO_TARGET_WIDTH = 1850
const HERO_TARGET_HEIGHT = 820
const HERO_ASPECT_RATIO = HERO_TARGET_WIDTH / HERO_TARGET_HEIGHT

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

function SortableSlide({ 
  slide, 
  onEdit, 
  onDelete 
}: { 
  slide: CarouselImage, 
  onEdit: (s: CarouselImage) => void, 
  onDelete: (s: CarouselImage) => void 
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: slide.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes}
      className="border border-[#E8A835]/30 rounded-2xl overflow-hidden bg-[#FFFDF8] relative"
    >
      {/* Drag Handle */}
      <div
        {...listeners}
        className="absolute top-2 left-2 z-10 p-2 bg-white/90 backdrop-blur-sm rounded-lg cursor-grab active:cursor-grabbing hover:bg-white shadow-sm border border-[#E8A835]/20"
        title="اسحب لإعادة الترتيب"
      >
        <GripVertical size={18} className="text-[#8B6F47]" />
      </div>
      
      <div className="aspect-[1850/820] bg-[#F5F1E8]">
        <img src={slide.image_url} alt={slide.alt_text ?? "صورة"} className="h-full w-full object-cover pointer-events-none" />
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
            onClick={() => onEdit(slide)}
            className="flex-1 px-4 py-2 bg-white border border-[#E8A835] text-[#E8A835] rounded-lg font-semibold hover:bg-[#FFF3D6] flex items-center justify-center gap-2 transition-colors"
          >
            <Edit2 size={16} />
            تعديل
          </button>
          <button
            onClick={() => onDelete(slide)}
            className="flex-1 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg font-semibold hover:bg-red-100 flex items-center justify-center gap-2 transition-colors"
          >
            <Trash2 size={16} />
            حذف
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminCarouselPage() {
  const [slides, setSlides] = useState<CarouselImage[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingSlide, setEditingSlide] = useState<CarouselImage | null>(null)
  const [formData, setFormData] = useState<FormState>({ alt_text: "", link_url: "", sort_order: 0 })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [cropSourceUrl, setCropSourceUrl] = useState<string | null>(null)
  const [isLocalImage, setIsLocalImage] = useState(false)
  const [crop, setCrop] = useState<Crop>({ unit: "px", width: 0, height: 0, x: 0, y: 0 })
  const imageRef = useRef<HTMLImageElement | null>(null)
  const [isCropInitialized, setIsCropInitialized] = useState(false)
  const [isApplyingCrop, setIsApplyingCrop] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const supabase = getSupabaseClient()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setSlides((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)
        const newItems = arrayMove(items, oldIndex, newIndex)

        // Update sort orders locally
        const updatedItems = newItems.map((item, index) => ({
            ...item,
            sort_order: index
        }))

        // Persist
        persistSortOrder(updatedItems)

        return updatedItems
      })
    }
  }

  const persistSortOrder = async (items: CarouselImage[]) => {
    try {
        const updates = items.map((item, index) => 
            supabase.from("hero_carousel_images").update({ sort_order: index }).eq("id", item.id)
        )
        await Promise.all(updates)
    } catch (error) {
        console.error("Failed to update sort order", error)
    }
  }

  const resetForm = () => {
    setFormData({ alt_text: "", link_url: "", sort_order: 0 })
    setSelectedFile(null)
    setPreviewUrl(null)
    setCropSourceUrl(null)
    setIsLocalImage(false)
    setCrop({ unit: "px", width: 0, height: 0, x: 0, y: 0 })
    setIsCropInitialized(false)
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
    setCropSourceUrl(null)
    setIsLocalImage(false)
    setCrop({ unit: "px", width: 0, height: 0, x: 0, y: 0 })
    setShowForm(true)
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const objectUrl = URL.createObjectURL(file)
      setPreviewUrl(objectUrl)
      setCropSourceUrl(objectUrl)
      setIsLocalImage(true)
      setIsCropInitialized(false)
      setCrop({ unit: "px", width: 0, height: 0, x: 0, y: 0 })
    }
  }

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  useEffect(() => {
    return () => {
      if (cropSourceUrl && cropSourceUrl.startsWith("blob:")) {
        URL.revokeObjectURL(cropSourceUrl)
      }
    }
  }, [cropSourceUrl])

  const initializeCropArea = (img: HTMLImageElement) => {
    const displayedWidth = img.width
    const displayedHeight = img.height

    if (!displayedWidth || !displayedHeight) return

    const possibleWidth = Math.min(displayedWidth, displayedHeight * HERO_ASPECT_RATIO)
    const possibleHeight = possibleWidth / HERO_ASPECT_RATIO

    setCrop({
      unit: "px",
      width: possibleWidth,
      height: possibleHeight,
      x: (displayedWidth - possibleWidth) / 2,
      y: (displayedHeight - possibleHeight) / 2,
    })
    setIsCropInitialized(true)
  }

  const handleCropApply = () => {
    if (!imageRef.current || !crop.width || !crop.height) {
      alert("يرجى تحديد منطقة مناسبة من الصورة أولاً")
      return
    }

    setIsApplyingCrop(true)
    try {
      const image = imageRef.current
      const canvas = document.createElement("canvas")
      const scaleX = image.naturalWidth / image.width
      const scaleY = image.naturalHeight / image.height
      const ctx = canvas.getContext("2d")

      if (!ctx) {
        throw new Error("فشل في معالجة الصورة")
      }

      const cropX = (crop.x ?? 0) * scaleX
      const cropY = (crop.y ?? 0) * scaleY
      const cropWidth = (crop.width ?? 0) * scaleX
      const cropHeight = (crop.height ?? 0) * scaleY

      // Export at a fixed size for consistent home slider rendering
      canvas.width = HERO_TARGET_WIDTH
      canvas.height = HERO_TARGET_HEIGHT
      ctx.imageSmoothingQuality = "high"
      ctx.drawImage(image, cropX, cropY, cropWidth, cropHeight, 0, 0, HERO_TARGET_WIDTH, HERO_TARGET_HEIGHT)

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            alert("تعذر إنشاء النسخة المقصوصة")
            setIsApplyingCrop(false)
            return
          }

          const croppedUrl = URL.createObjectURL(blob)
          const fileType = "image/jpeg"
          const croppedFile = new File([blob], `carousel-${Date.now()}-${HERO_TARGET_WIDTH}x${HERO_TARGET_HEIGHT}.jpg`, { type: fileType })
          setPreviewUrl(croppedUrl)
          setSelectedFile(croppedFile)
          setIsApplyingCrop(false)
        },
        "image/jpeg",
        0.8 // Quality 0.8 for balance between quality and size
      )
    } catch (error) {
      console.error("فشل في قص الصورة", error)
      alert("حدث خطأ أثناء معالجة الصورة")
      setIsApplyingCrop(false)
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
    <div className="bg-[#F5F1E8] rounded-lg">
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
                      <div className="w-32 aspect-[1850/820] overflow-hidden rounded-lg border border-[#E8A835]/30 bg-[#F5F1E8]">
                        <img src={previewUrl} alt="preview" className="h-full w-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {previewUrl && (
                <div className="grid gap-6 md:grid-cols-2" id="image-preview-section">
                  {isLocalImage && cropSourceUrl && (
                    <div className="space-y-3 order-first">
                      <div>
                        <p className="text-sm font-semibold text-[#2B2520]">تحديد الجزء الظاهر من الصورة</p>
                        <p className="text-xs text-[#8B6F47]">
                          إذا كانت صورتك أعرض من المطلوب يمكنك سحب وحجم إطار المعاينة لاختيار الجزء المناسب
                        </p>
                      </div>
                      <div className="bg-[#F5F1E8] p-4 rounded-2xl border border-[#E8A835]/20">
                        <ReactCrop crop={crop} onChange={(newCrop) => setCrop(newCrop)} aspect={HERO_ASPECT_RATIO} keepSelection>
                          <img
                            ref={imageRef}
                            src={cropSourceUrl}
                            alt="اختيار منطقة السلايدر"
                            className="max-h-[420px] w-full object-contain"
                            onLoad={(event) => {
                              imageRef.current = event.currentTarget
                              if (!isCropInitialized) {
                                initializeCropArea(event.currentTarget)
                              }
                              // Scroll image into view when loaded
                              event.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'center' })
                            }}
                          />
                        </ReactCrop>
                        <button
                          type="button"
                          onClick={handleCropApply}
                          disabled={isApplyingCrop}
                          className="mt-4 w-full px-4 py-2 bg-[#2B2520] text-white rounded-lg font-semibold hover:bg-[#403830] disabled:opacity-60"
                        >
                          {isApplyingCrop ? "جاري تطبيق القص..." : "تطبيق القص المحدد"}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-semibold text-[#2B2520]">معاينة السلايدر بالحجم الحقيقي</p>
                      <p className="text-xs text-[#8B6F47]">
                        تظهر الصورة بالارتفاع المستخدم في الصفحة الرئيسية للتأكد من كونها مناسبة تماماً
                      </p>
                    </div>
                    <div className="relative w-full aspect-[1850/820] rounded-[32px] overflow-hidden bg-[#1f1b16] border border-[#E8A835]/40">
                      <img src={previewUrl} alt="معاينة السلايدر" className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-black/20 to-black/70" />
                      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white/80 text-xs">
                        <span>نسبة عرض {HERO_ASPECT_RATIO.toFixed(2)} : 1</span>
                        <span>{HERO_TARGET_WIDTH}×{HERO_TARGET_HEIGHT}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

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
            <DndContext 
              sensors={sensors} 
              collisionDetection={closestCenter} 
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={slides} strategy={rectSortingStrategy}>
                <div className="grid gap-6 md:grid-cols-2">
                  {slides.map((slide) => (
                    <SortableSlide 
                      key={slide.id} 
                      slide={slide} 
                      onEdit={startEdit} 
                      onDelete={handleDelete} 
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
    </div>
  )
}
