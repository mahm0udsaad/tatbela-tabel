"use client"

import { useMemo, useState, useTransition } from "react"
import { Star, ShoppingCart, Heart, CheckCircle, AlertTriangle } from "lucide-react"
import { submitReviewAction } from "./actions"

type ProductImage = {
  id: string
  image_url: string
  is_primary: boolean
}

type ProductVariant = {
  id: string
  sku: string | null
  size: string | null
  weight: number | null
  variant_type: string | null
  price: number | null
  stock: number
}

type Review = {
  id: string
  rating: number
  title: string | null
  content: string | null
  created_at: string
}

type ProductRecord = {
  id: string
  name_ar: string
  description_ar: string | null
  brand: string
  price: number
  original_price: number | null
  rating: number | null
  reviews_count: number | null
  stock: number
  product_images: ProductImage[] | null
  product_variants: ProductVariant[] | null
}

export function ProductDetailClient({
  product,
  reviews,
  canReview,
}: {
  product: ProductRecord
  reviews: Review[]
  canReview: boolean
}) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [isFavorite, setIsFavorite] = useState(false)
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: "", content: "" })
  const [reviewStatus, setReviewStatus] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  const images = useMemo(() => {
    const sorted = [...(product.product_images || [])].sort((a, b) => {
      if (a.is_primary === b.is_primary) return 0
      return a.is_primary ? -1 : 1
    })
    return sorted.length > 0 ? sorted : [{ id: "placeholder", image_url: "/placeholder.svg", is_primary: true }]
  }, [product.product_images])

  const variants = product.product_variants || []
  const activeVariant = variants.find((variant) => variant.id === selectedVariant) || null
  const availableStock = activeVariant ? activeVariant.stock : product.stock
  const effectivePrice = activeVariant?.price ?? product.price
  const isOutOfStock = availableStock <= 0

  const handleSubmitReview = () => {
    if (!canReview) {
      setReviewStatus({ type: "error", message: "يجب تسجيل الدخول لكتابة تقييم" })
      return
    }
    if (!reviewForm.content.trim()) {
      setReviewStatus({ type: "error", message: "يرجى كتابة تفاصيل التقييم" })
      return
    }
    startTransition(async () => {
      setReviewStatus(null)
      const result = await submitReviewAction({
        productId: product.id,
        rating: reviewForm.rating,
        title: reviewForm.title,
        content: reviewForm.content,
      })
      if (!result.success) {
        setReviewStatus({ type: "error", message: result.error ?? "تعذر إرسال التقييم" })
        return
      }
      setReviewForm({ rating: 5, title: "", content: "" })
      setReviewStatus({ type: "success", message: "تم إرسال تقييمك للمراجعة" })
    })
  }

  return (
    <section className="max-w-7xl mx-auto px-4 py-12">
      <div className="grid md:grid-cols-2 gap-10">
        <div>
          <div className="relative rounded-2xl overflow-hidden bg-[#F5F1E8] border border-[#E8E2D1] h-[480px]">
            <img
              src={images[selectedImageIndex]?.image_url || "/placeholder.svg"}
              alt={product.name_ar}
              className="w-full h-full object-cover"
            />
            {isOutOfStock && (
              <span className="absolute top-4 left-4 bg-black/80 text-white px-4 py-1 rounded-full text-sm font-semibold">
                غير متوفر مؤقتاً
              </span>
            )}
          </div>
          <div className="mt-4 grid grid-cols-4 gap-3">
            {images.map((image, index) => (
              <button
                key={image.id}
                onClick={() => setSelectedImageIndex(index)}
                className={`rounded-xl border overflow-hidden h-24 ${
                  selectedImageIndex === index ? "border-[#E8A835]" : "border-transparent"
                }`}
              >
                <img src={image.image_url} alt={product.name_ar} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <p className="text-sm text-[#E8A835] font-bold uppercase mb-2">{product.brand}</p>
            <h1 className="text-4xl font-bold text-[#2B2520] mb-4">{product.name_ar}</h1>
            <div className="flex items-center gap-4">
              <div className="flex">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star
                    key={index}
                    size={20}
                    className={
                      index < Math.round(product.rating || 0) ? "text-[#E8A835] fill-[#E8A835]" : "text-gray-300"
                    }
                  />
                ))}
              </div>
              <span className="text-sm text-[#8B6F47]">({product.reviews_count || 0} تقييم)</span>
            </div>
          </div>

          <div>
            <div className="flex items-baseline gap-4">
              <span className="text-5xl font-bold text-[#C41E3A]">{effectivePrice.toFixed(2)} ج.م</span>
              {product.original_price && product.original_price > effectivePrice && (
                <span className="text-2xl text-gray-400 line-through">{product.original_price.toFixed(2)} ج.م</span>
              )}
            </div>
            {isOutOfStock ? (
              <p className="mt-2 text-sm text-red-600 font-semibold">نفدت الكمية وسيتم التوفير قريباً</p>
            ) : (
              <p className="mt-2 text-sm text-[#8B6F47]">المخزون المتوفر: {availableStock} عبوة</p>
            )}
          </div>

          {variants.length > 0 && (
            <div className="space-y-3">
              <p className="font-semibold text-[#2B2520]">اختر المتغير</p>
              <div className="flex flex-wrap gap-3">
                {variants.map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() => setSelectedVariant(variant.id)}
                    className={`px-4 py-2 rounded-full border ${
                      selectedVariant === variant.id ? "border-[#E8A835] bg-[#FFF8ED]" : "border-[#D9D4C8]"
                    }`}
                  >
                    {variant.variant_type || variant.size || variant.weight ? (
                      <>
                        {variant.variant_type && <span>{variant.variant_type}</span>}
                        {variant.size && <span> • {variant.size}</span>}
                        {variant.weight && <span> • {variant.weight} جم</span>}
                      </>
                    ) : (
                      "خيار أساسي"
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <p className="font-semibold text-[#2B2520]">الكمية</p>
            <div className="flex items-center gap-4">
              <div className="flex items-center border border-[#D9D4C8] rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-3 text-[#2B2520] hover:bg-[#F5F1E8]"
                >
                  −
                </button>
                <span className="px-6 py-3 font-semibold">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  disabled={quantity >= availableStock}
                  className="px-4 py-3 text-[#2B2520] hover:bg-[#F5F1E8] disabled:text-gray-400"
                >
                  +
                </button>
              </div>
              <button
                className={`flex-1 py-3 rounded-lg font-bold flex items-center justify-center gap-3 ${
                  isOutOfStock
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : "bg-[#E8A835] text-white hover:bg-[#D9941E]"
                }`}
                disabled={isOutOfStock}
              >
                <ShoppingCart size={20} />
                {isOutOfStock ? "سيعود قريباً" : "أضف إلى السلة"}
              </button>
              <button
                onClick={() => setIsFavorite(!isFavorite)}
                className={`p-3 rounded-lg border ${
                  isFavorite ? "border-[#C41E3A] text-[#C41E3A]" : "border-[#D9D4C8] text-[#8B6F47]"
                }`}
              >
                <Heart size={24} className={isFavorite ? "fill-current" : undefined} />
              </button>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-[#2B2520] mb-2">الوصف</h3>
            <p className="text-[#8B6F47] leading-relaxed">{product.description_ar}</p>
          </div>
        </div>
      </div>

      <section className="mt-16 grid lg:grid-cols-2 gap-10">
        <div className="bg-white rounded-2xl shadow p-6">
          <h3 className="text-2xl font-bold text-[#2B2520] mb-4">تقييمات العملاء</h3>
          {reviews.length === 0 ? (
            <p className="text-sm text-[#8B6F47]">كن أول من يقيّم هذا المنتج.</p>
          ) : (
            <div className="space-y-4 max-h-[420px] overflow-y-auto pr-2">
              {reviews.map((review) => (
                <div key={review.id} className="border border-[#E8E2D1] rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star
                        key={index}
                        size={16}
                        className={index < review.rating ? "text-[#E8A835] fill-[#E8A835]" : "text-gray-300"}
                      />
                    ))}
                    <span className="text-xs text-[#8B6F47]">
                      {new Date(review.created_at).toLocaleDateString("ar-EG")}
                    </span>
                  </div>
                  {review.title && <p className="font-semibold text-[#2B2520]">{review.title}</p>}
                  <p className="text-sm text-[#8B6F47]">{review.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow p-6 space-y-4">
          <h3 className="text-2xl font-bold text-[#2B2520]">اكتب تقييمك</h3>
          <div className="space-y-3">
            <label className="text-sm font-semibold text-[#2B2520]">التقييم</label>
            <select
              value={reviewForm.rating}
              onChange={(e) => setReviewForm((prev) => ({ ...prev, rating: Number(e.target.value) }))}
              className="w-full rounded-lg border border-[#D9D4C8] px-3 py-2 focus:border-[#E8A835]"
            >
              {[5, 4, 3, 2, 1].map((value) => (
                <option key={value} value={value}>
                  {value} نجوم
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-[#2B2520]">العنوان (اختياري)</label>
            <input
              type="text"
              value={reviewForm.title}
              onChange={(e) => setReviewForm((prev) => ({ ...prev, title: e.target.value }))}
              className="w-full rounded-lg border border-[#D9D4C8] px-3 py-2 focus:border-[#E8A835]"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-[#2B2520]">تفاصيل تجربتك</label>
            <textarea
              value={reviewForm.content}
              onChange={(e) => setReviewForm((prev) => ({ ...prev, content: e.target.value }))}
              className="w-full rounded-lg border border-[#D9D4C8] px-3 py-3 h-32 focus:border-[#E8A835]"
              placeholder="شارك تجربتك مع المنتج..."
            />
          </div>
          {reviewStatus && (
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                reviewStatus.type === "success"
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {reviewStatus.type === "success" ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
              {reviewStatus.message}
            </div>
          )}
          <button
            onClick={handleSubmitReview}
            disabled={isPending}
            className="w-full py-3 rounded-lg bg-[#E8A835] text-white font-bold hover:bg-[#D9941E] disabled:opacity-60"
          >
            {isPending ? "جاري الإرسال..." : "إرسال التقييم"}
          </button>
        </div>
      </section>
    </section>
  )
}

