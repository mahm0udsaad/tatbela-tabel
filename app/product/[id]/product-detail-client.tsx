"use client"

import { useMemo, useState, useTransition, useCallback } from "react"
import Link from "next/link"
import { Star, ShoppingCart, Heart, CheckCircle, AlertTriangle, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { submitReviewAction } from "./actions"
import useEmblaCarousel from "embla-carousel-react"
import { useCart } from "@/components/cart-provider"

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

type SimilarProduct = {
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
  similarProducts,
}: {
  product: ProductRecord
  reviews: Review[]
  canReview: boolean
  similarProducts: SimilarProduct[]
}) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [isFavorite, setIsFavorite] = useState(false)
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: "", content: "" })
  const [reviewStatus, setReviewStatus] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [isPending, startTransition] = useTransition()
  const { addItem, isLoading: isCartLoading } = useCart()
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [variantError, setVariantError] = useState<string | null>(null)

  // Embla Carousel
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "center" })

  const images = useMemo(() => {
    const sorted = [...(product.product_images || [])].sort((a, b) => {
      if (a.is_primary === b.is_primary) return 0
      return a.is_primary ? -1 : 1
    })
    return sorted.length > 0 ? sorted : [{ id: "placeholder", image_url: "/placeholder.svg", is_primary: true }]
  }, [product.product_images])

  const scrollPrev = useCallback(() => {
    if (emblaApi) {
      emblaApi.scrollPrev()
      setSelectedImageIndex(emblaApi.selectedScrollSnap())
    }
  }, [emblaApi])

  const scrollNext = useCallback(() => {
    if (emblaApi) {
      emblaApi.scrollNext()
      setSelectedImageIndex(emblaApi.selectedScrollSnap())
    }
  }, [emblaApi])

  const scrollTo = useCallback(
    (index: number) => {
      if (emblaApi) {
        emblaApi.scrollTo(index)
        setSelectedImageIndex(index)
      }
    },
    [emblaApi]
  )

  const variants = useMemo(() => {
    const list = product.product_variants || []
    return [...list].sort((a, b) => {
      const aWeight = a.weight ?? 0
      const bWeight = b.weight ?? 0
      return aWeight - bWeight
    })
  }, [product.product_variants])

  const activeVariant = variants.find((variant) => variant.id === selectedVariant) || null
  const availableStock = activeVariant ? activeVariant.stock : product.stock
  const effectivePrice = activeVariant?.price ?? product.price
  const isOutOfStock = availableStock <= 0
  const isPerKilo = product.pricing_mode === "per_kilo"

  const formatWeight = (weight: number | null) => {
    if (!weight) return ""
    if (weight >= 1000) return `${(weight / 1000).toFixed(1)} كجم`
    if (weight === 500) return "نصف كيلو"
    return `${weight} جم`
  }

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

  const handleAddToCart = async () => {
    if (variants.length > 0 && !selectedVariant) {
      setVariantError("يرجى اختيار الوزن قبل الإضافة للسلة")
      return
    }
    setIsAddingToCart(true)
    try {
      setVariantError(null)
      await addItem(product.id, quantity, selectedVariant)
    } finally {
      setIsAddingToCart(false)
    }
  }

  return (
    <section className="max-w-7xl mx-auto px-4 py-6 md:py-12">
      <div className="grid md:grid-cols-2 gap-6 md:gap-10">
        <div className="space-y-4">
          {/* Main Carousel */}
          <div className="relative rounded-2xl overflow-hidden bg-[#F5F1E8] border border-[#E8E2D1]">
            <div dir="ltr" className="ltr overflow-hidden" ref={emblaRef}>
              <div className="flex">
                {images.map((image) => (
                  <div key={image.id} className="flex-[0_0_100%] min-w-0">
                    <div className="relative h-[320px] md:h-[520px] flex items-center justify-center">
                      <img
                        src={image.image_url}
                        alt={product.name_ar}
                        className="max-w-full object-contain"
                        loading="lazy"
                      />
                      {isOutOfStock && (
                        <span className="absolute top-4 left-4 bg-black/80 text-white px-3 py-1 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-semibold">
                          غير متوفر مؤقتاً
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation Arrows - Only show if multiple images */}
            {images.length > 1 && (
              <>
                <button
                  onClick={scrollPrev}
                  className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 md:p-3 rounded-full shadow-lg transition-all"
                  aria-label="الصورة السابقة"
                >
                  <ChevronLeft size={20} className="md:w-6 md:h-6" />
                </button>
                <button
                  onClick={scrollNext}
                  className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 md:p-3 rounded-full shadow-lg transition-all"
                  aria-label="الصورة التالية"
                >
                  <ChevronRight size={20} className="md:w-6 md:h-6" />
                </button>

                {/* Dot Indicators */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => scrollTo(index)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        selectedImageIndex === index ? "bg-[#E8A835] w-6" : "bg-white/60"
                      }`}
                      aria-label={`الذهاب للصورة ${index + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Thumbnail Grid - Only show if multiple images */}
          {images.length > 1 && (
            <div className="grid grid-cols-4 md:grid-cols-5 gap-2 md:gap-3">
              {images.map((image, index) => (
                <button
                  key={image.id}
                  onClick={() => scrollTo(index)}
                  className={`rounded-lg border-2 overflow-hidden aspect-square transition-all ${
                    selectedImageIndex === index
                      ? "border-[#E8A835] scale-95"
                      : "border-transparent hover:border-[#E8E2D1]"
                  }`}
                >
                  <div className="w-full h-full flex items-center justify-center bg-[#F5F1E8]">
                    <img
                      src={image.image_url}
                      alt={product.name_ar}
                      className="max-h-full max-w-full object-contain"
                      loading="lazy"
                    />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4 md:space-y-6">
          <div>
            <p className="text-xs md:text-sm text-[#E8A835] font-bold uppercase mb-2">{product.brand}</p>
            <h1 className="text-2xl md:text-4xl font-bold text-[#2B2520] mb-3 md:mb-4">{product.name_ar}</h1>
            <div className="flex items-center gap-3 md:gap-4">
              <div className="flex">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star
                    key={index}
                    size={16}
                    className={`md:w-5 md:h-5 ${
                      index < Math.round(product.rating || 0) ? "text-[#E8A835] fill-[#E8A835]" : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs md:text-sm text-[#8B6F47]">({product.reviews_count || 0} تقييم)</span>
            </div>
          </div>

          <div>
            <div className="flex items-baseline gap-3 md:gap-4">
              <span className="text-3xl md:text-5xl font-bold text-[#C41E3A]">{effectivePrice.toFixed(2)} ج.م</span>
              {product.original_price && product.original_price > effectivePrice && (
                <span className="text-xl md:text-2xl text-gray-400 line-through">{product.original_price.toFixed(2)} ج.م</span>
              )}
            </div>
            {isPerKilo && (
              <p className="mt-1 text-xs text-[#8B6F47]">
                السعر لكل كيلو — اختر الوزن ليتم احتساب السعر النهائي تلقائياً.
              </p>
            )}
            {isOutOfStock ? (
              <p className="mt-2 text-xs md:text-sm text-red-600 font-semibold">نفدت الكمية وسيتم التوفير قريباً</p>
            ) : (
              <p className="mt-2 text-xs md:text-sm text-[#8B6F47]">المخزون المتوفر: {availableStock} عبوة</p>
            )}
          </div>

          {variants.length > 0 && (
            <div className="space-y-3">
              <p className="font-semibold text-[#2B2520]">اختر الوزن</p>
              <div className="flex flex-wrap gap-3">
                {variants.map((variant) => {
                  const label = formatWeight(variant.weight) || variant.variant_type || variant.size || "خيار أساسي"
                  return (
                    <button
                      key={variant.id}
                      onClick={() => {
                        setSelectedVariant(variant.id)
                        setVariantError(null)
                      }}
                      className={`px-4 py-2 rounded-full border text-sm font-semibold ${
                        selectedVariant === variant.id
                          ? "border-[#C41E3A] bg-[#C41E3A] text-white shadow-md"
                          : "border-[#E3DFD5] bg-[#F8F6F1] text-[#2B2520] hover:border-[#E8A835]"
                      }`}
                    >
                      <div className="text-right space-y-1">
                        <div>{label}</div>
                        {variant.price !== null && <div className="text-xs">{variant.price.toFixed(2)} ج.م</div>}
                      </div>
                    </button>
                  )
                })}
              </div>
              {variantError && <p className="text-sm text-red-600">{variantError}</p>}
            </div>
          )}

          <div className="space-y-3 md:space-y-4">
            <p className="font-semibold text-sm md:text-base text-[#2B2520]">الكمية</p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:gap-4">
              <div className="flex items-center border border-[#D9D4C8] rounded-lg w-full sm:w-auto">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 md:px-4 py-2 md:py-3 text-[#2B2520] hover:bg-[#F5F1E8] flex-1 sm:flex-none"
                >
                  −
                </button>
                <span className="px-4 md:px-6 py-2 md:py-3 font-semibold text-center flex-1 sm:flex-none">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  disabled={quantity >= availableStock}
                  className="px-3 md:px-4 py-2 md:py-3 text-[#2B2520] hover:bg-[#F5F1E8] disabled:text-gray-400 flex-1 sm:flex-none"
                >
                  +
                </button>
              </div>
              <button
                onClick={handleAddToCart}
                className={`flex-1 py-3 rounded-lg font-bold flex items-center justify-center gap-2 md:gap-3 text-sm md:text-base ${
                  isOutOfStock || isCartLoading || isAddingToCart
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : "bg-[#E8A835] text-white hover:bg-[#D9941E]"
                }`}
                disabled={isOutOfStock || isCartLoading || isAddingToCart}
              >
                {isAddingToCart ? (
                  <Loader2 size={18} className="animate-spin md:w-5 md:h-5" />
                ) : (
                  <>
                    <ShoppingCart size={18} className="md:w-5 md:h-5" />
                    {isOutOfStock ? "سيعود قريباً" : "أضف إلى السلة"}
                  </>
                )}
              </button>
              <button
                onClick={() => setIsFavorite(!isFavorite)}
                className={`p-2 md:p-3 rounded-lg border ${
                  isFavorite ? "border-[#C41E3A] text-[#C41E3A]" : "border-[#D9D4C8] text-[#8B6F47]"
                }`}
              >
                <Heart size={20} className={`md:w-6 md:h-6 ${isFavorite ? "fill-current" : ""}`} />
              </button>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-base md:text-lg text-[#2B2520] mb-2">الوصف</h3>
            <p className="text-sm md:text-base text-[#8B6F47] leading-relaxed">{product.description_ar}</p>
          </div>
        </div>
      </div>

      <section className="mt-8 md:mt-16 grid lg:grid-cols-2 gap-6 md:gap-10">
        <div className="bg-white rounded-xl md:rounded-2xl shadow p-4 md:p-6">
          <h3 className="text-xl md:text-2xl font-bold text-[#2B2520] mb-4">تقييمات العملاء</h3>
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

        <div className="bg-white rounded-xl md:rounded-2xl shadow p-4 md:p-6 space-y-3 md:space-y-4">
          <h3 className="text-xl md:text-2xl font-bold text-[#2B2520]">اكتب تقييمك</h3>
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

      {/* Similar Products Section */}
      {similarProducts.length > 0 && (
        <section className="mt-8 md:mt-16">
          <div className="mb-6 md:mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-[#2B2520] mb-2">منتجات مشابهة</h2>
            <p className="text-sm md:text-base text-[#8B6F47]">من نفس الفئة</p>
          </div>
          <SimilarProductsRow products={similarProducts} />
        </section>
      )}
    </section>
  )
}

function SimilarProductsRow({ products }: { products: SimilarProduct[] }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    slidesToScroll: 1,
    breakpoints: {
      "(min-width: 640px)": { slidesToScroll: 2 },
      "(min-width: 1024px)": { slidesToScroll: 3 },
    },
  })

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev()
  }, [emblaApi])

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext()
  }, [emblaApi])

  return (
    <div className="relative">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-4 md:gap-6">
          {products.map((product) => {
            const primaryImage =
              product.product_images?.find((img) => img.is_primary)?.image_url ||
              product.product_images?.[0]?.image_url ||
              "/placeholder.svg"

            const isOutOfStock =
              (product.stock ?? 0) <= 0 &&
              (product.product_variants?.length
                ? product.product_variants.every((variant) => (variant.stock ?? 0) <= 0)
                : true)

            const discount =
              product.original_price && product.original_price > product.price
                ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
                : 0

            return (
              <div
                key={product.id}
                className="flex-[0_0_85%] sm:flex-[0_0_45%] lg:flex-[0_0_30%] min-w-0"
              >
                <Link
                  href={`/product/${product.id}`}
                  className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all border border-[#E8E2D1] flex flex-col group h-full"
                >
                  <div className="relative h-48 bg-[#F5F1E8] overflow-hidden">
                    <img
                      src={primaryImage}
                      alt={product.name_ar}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300 bg-white"
                    />
                    {discount > 0 && (
                      <span className="absolute top-2 left-2 bg-[#C41E3A] text-white px-2 py-1 rounded-full text-xs font-bold z-10">
                        -{discount}%
                      </span>
                    )}
                    {isOutOfStock && (
                      <span className="absolute top-2 right-2 bg-gray-900/80 text-white px-2 py-1 rounded-full text-xs font-bold z-10">
                        غير متوفر
                      </span>
                    )}
                  </div>
                  <div className="p-3 md:p-4 flex flex-col flex-1">
                    <p className="text-xs text-[#E8A835] font-semibold uppercase mb-1">{product.brand}</p>
                    <h3 className="text-base md:text-lg font-bold text-[#2B2520] mb-2 line-clamp-2 group-hover:text-[#E8A835] transition-colors">
                      {product.name_ar}
                    </h3>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, index) => (
                          <Star
                            key={index}
                            size={12}
                            className={`${
                              index < Math.round(product.rating || 0)
                                ? "text-[#E8A835] fill-[#E8A835]"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-[#8B6F47]">({product.reviews_count || 0})</span>
                    </div>
                    <div className="flex items-baseline gap-2 mb-3">
                      <span className="text-xl md:text-2xl font-bold text-[#C41E3A]">
                        {product.price.toFixed(2)} ج.م
                      </span>
                      {product.original_price && product.original_price > product.price && (
                        <span className="text-xs md:text-sm text-gray-400 line-through">
                          {product.original_price.toFixed(2)} ج.م
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </div>
            )
          })}
        </div>
      </div>

      {/* Navigation Buttons */}
      {products.length > 3 && (
        <>
          <button
            onClick={scrollPrev}
            className="absolute right-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white shadow-lg p-2 rounded-full hover:bg-gray-50 transition-all z-10 hidden md:flex items-center justify-center"
            aria-label="السابق"
          >
            <ChevronRight size={20} className="text-[#2B2520]" />
          </button>
          <button
            onClick={scrollNext}
            className="absolute left-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white shadow-lg p-2 rounded-full hover:bg-gray-50 transition-all z-10 hidden md:flex items-center justify-center"
            aria-label="التالي"
          >
            <ChevronLeft size={20} className="text-[#2B2520]" />
          </button>
        </>
      )}
    </div>
  )
}

