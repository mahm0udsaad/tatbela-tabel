"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { createCategoryAction } from "../../categories/actions"
import { useRouter } from "next/navigation"

type AddCategoryModalProps = {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function AddCategoryModal({ isOpen, onClose, onSuccess }: AddCategoryModalProps) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim() || !slug.trim()) {
      setError("الاسم والرابط مطلوبان")
      return
    }

    setIsSubmitting(true)

    try {
      const result = await createCategoryAction({
        name_ar: name.trim(),
        slug: slug.trim(),
        parent_id: null,
      })

      if (!result.success) {
        setError(result.error ?? "فشل في إضافة الفئة")
        setIsSubmitting(false)
        return
      }

      // Reset form
      setName("")
      setSlug("")
      setError(null)
      
      // Refresh to get new categories
      router.refresh()
      
      // Call success callback
      if (onSuccess) {
        onSuccess()
      }
      
      // Close modal
      onClose()
    } catch (err) {
      setError("حدث خطأ غير متوقع")
      setIsSubmitting(false)
    }
  }

  const handleNameChange = (value: string) => {
    setName(value)
    // Auto-generate slug from Arabic name
    const autoSlug = value
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\u0600-\u06FFa-z0-9-]/g, "")
    setSlug(autoSlug)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-[#D9D4C8]">
          <h2 className="text-xl font-bold text-[#2B2520]">إضافة فئة جديدة</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isSubmitting}
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-[#2B2520] mb-2">
              اسم الفئة <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full rounded-lg border border-[#D9D4C8] px-4 py-2 focus:border-[#E8A835] focus:outline-none"
              placeholder="مثال: توابل عربية"
              required
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#2B2520] mb-2">
              الرابط (Slug) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full rounded-lg border border-[#D9D4C8] px-4 py-2 focus:border-[#E8A835] focus:outline-none"
              placeholder="مثال: arabic-spices"
              required
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500 mt-1">سيتم إنشاؤه تلقائياً من الاسم</p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 border border-[#D9D4C8] text-[#2B2520] rounded-lg font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-[#E8A835] text-white rounded-lg font-semibold hover:bg-[#D9941E] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? "جاري الإضافة..." : "إضافة الفئة"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

