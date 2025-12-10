"use client"

import { useMemo, useState, useTransition } from "react"
import { AlertTriangle, Loader2, Star, Trash2 } from "lucide-react"
import { deleteReviewAction } from "./actions"
import Link from "next/link"

type ReviewRow = {
  id: string
  product_id: string
  rating: number
  title: string | null
  content: string | null
  created_at: string | null
  products: {
    id: string
    name_ar: string
    brand: string
  } | null
}

type ReviewsAdminClientProps = {
  reviews: ReviewRow[]
}

export function ReviewsAdminClient({ reviews }: ReviewsAdminClientProps) {
  const [list, setList] = useState(reviews)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const grouped = useMemo(() => list, [list])

  const handleDelete = (reviewId: string, productId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا التقييم؟")) return
    setError(null)
    startTransition(async () => {
      const result = await deleteReviewAction({ reviewId, productId })
      if (!result.success) {
        setError(result.error ?? "تعذر حذف التقييم")
        return
      }
      setList((prev) => prev.filter((r) => r.id !== reviewId))
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-[#2B2520]">إدارة التقييمات</h1>
          <p className="text-sm text-[#8B6F47]">استعرض التقييمات واحذف غير المرغوب فيه فوراً.</p>
        </div>
        <div className="rounded-full bg-white border border-[#E8A835]/40 text-[#8B6F47] px-4 py-2 text-sm">
          إجمالي التقييمات: <span className="text-[#C41E3A] font-bold">{grouped.length}</span>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      {grouped.length === 0 ? (
        <div className="p-8 bg-white rounded-xl text-center text-[#8B6F47] border border-dashed border-[#D9D4C8]">
          لا توجد تقييمات حالياً.
        </div>
      ) : (
        <div className="grid gap-4">
          {grouped.map((review) => (
            <div key={review.id} className="bg-white rounded-xl border border-[#E8E2D1] p-4 md:p-5 shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <Star
                          key={idx}
                          size={16}
                          className={idx < review.rating ? "text-[#E8A835] fill-[#E8A835]" : "text-gray-300"}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-[#8B6F47]">
                      {review.created_at ? new Date(review.created_at).toLocaleDateString("ar-EG") : ""}
                    </span>
                  </div>
                  <p className="font-semibold text-[#2B2520]">
                    {review.title?.trim() ? review.title : "عميل المتجر"}
                  </p>
                  {review.content && <p className="text-sm text-[#8B6F47] leading-relaxed">{review.content}</p>}
                </div>
                <div className="flex flex-col items-end gap-2">
                  {review.products ? (
                    <Link
                      href={`/product/${review.products.id}`}
                      className="text-sm text-[#2B2520] hover:text-[#C41E3A] underline"
                    >
                      {review.products.name_ar} — {review.products.brand}
                    </Link>
                  ) : (
                    <span className="text-sm text-[#8B6F47]">منتج غير متوفر</span>
                  )}
                  <button
                    onClick={() => handleDelete(review.id, review.product_id)}
                    className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
                    disabled={isPending}
                  >
                    {isPending ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    حذف التقييم
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

