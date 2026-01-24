"use client"

import { useEffect, useMemo, useState, useTransition, useCallback } from "react"
import Link from "next/link"
import { Star, ShoppingCart, Heart, CheckCircle, AlertTriangle, ChevronLeft, ChevronRight, Loader2, Plus } from "lucide-react"
import { submitReviewAction } from "./actions"
import useEmblaCarousel from "embla-carousel-react"
import { useCart } from "@/components/cart-provider"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"

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
  price: number | null  // Can be null for B2B products in public search
  original_price: number | null
  rating: number | null
  reviews_count: number | null
  stock: number
  b2b_price_hidden?: boolean | null
  has_tax?: boolean | null
  product_images: ProductImage[] | null
  product_variants: ProductVariant[] | null
}

type SimilarProduct = {
  id: string
  name_ar: string
  description_ar: string | null
  brand: string
  price: number | null  // Can be null for B2B products in public search
  original_price: number | null
  rating: number | null
  reviews_count: number | null
  stock: number
  b2b_price_hidden?: boolean | null
  product_images: ProductImage[] | null
  product_variants: ProductVariant[] | null
}

export function ProductDetailClient({
  product,
  reviews,
  canReview,
  similarProducts,
  mode = "b2c",
  priceHidden = false,
  contactLabel = "تواصل مع المبيعات",
  contactUrl = "/contact",
}: {
  product: ProductRecord
  reviews: Review[]
  canReview: boolean
  similarProducts: SimilarProduct[]
  mode?: "b2c" | "b2b"
  priceHidden?: boolean
  contactLabel?: string
  contactUrl?: string
}) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [isFavorite, setIsFavorite] = useState(false)
  const [reviewList, setReviewList] = useState(reviews)
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: "", content: "" })
  const [reviewStatus, setReviewStatus] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [isReviewOpen, setIsReviewOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isPending, startTransition] = useTransition()
  const { addItem, isLoading: isCartLoading } = useCart()
  const [isAddingToCart, setIsAddingToCart] = useState(false)

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

  const variants = useMemo(() => product.product_variants ?? [], [product.product_variants])
  const activeVariant = variants.find((variant) => variant.id === selectedVariant) || null
  const availableStock = activeVariant ? activeVariant.stock : product.stock
  const effectivePrice = activeVariant?.price ?? product.price
  const isOutOfStock = availableStock <= 0
  // Hide prices for B2B products when b2b_price_hidden is true, or when price is NULL (from DB migration)
  const hidePrices = Boolean(product.b2b_price_hidden) || product.price === null

  useEffect(() => {
    const updateDeviceMode = () => {
      setIsMobile(typeof window !== "undefined" ? window.innerWidth < 768 : false)
    }

    updateDeviceMode()
    window.addEventListener("resize", updateDeviceMode)
    return () => window.removeEventListener("resize", updateDeviceMode)
  }, [])

  // Default select first available variant (mobile-first UX: no "empty" variant state)
  useEffect(() => {
    if (variants.length === 0) return
    if (selectedVariant) return
    const firstAvailable = variants.find((v) => (v.stock ?? 0) > 0) ?? variants[0]
    setSelectedVariant(firstAvailable?.id ?? null)
  }, [variants, selectedVariant])

  const handleSubmitReview = () => {
    if (!canReview) {
      setReviewStatus({ type: "error", message: "يجب تسجيل الدخول لكتابة تقييم" })
      return
    }
    const trimmedContent = reviewForm.content.trim()

    startTransition(async () => {
      setReviewStatus(null)
      const result = await submitReviewAction({
        productId: product.id,
        rating: reviewForm.rating,
        title: reviewForm.title,
        content: trimmedContent.length > 0 ? trimmedContent : undefined,
      })
      if (!result.success) {
        setReviewStatus({ type: "error", message: result.error ?? "تعذر إرسال التقييم" })
        return
      }
      if (result.review) {
        const newReview: Review = {
          id: result.review.id,
          rating: result.review.rating,
          title: result.review.title ?? null,
          content: result.review.content ?? null,
          created_at: result.review.created_at ?? new Date().toISOString(),
        }
        setReviewList((prev) => [newReview, ...prev])
      }
      setReviewForm({ rating: 5, title: "", content: "" })
      setReviewStatus({ type: "success", message: "تم إرسال تقييمك للمراجعة" })
      setIsReviewOpen(false)
    })
  }

  const openReviewForm = () => {
    setReviewStatus(null)
    setIsReviewOpen(true)
  }

  const handleAddToCart = async () => {
    if (hidePrices) {
      return
    }
    setIsAddingToCart(true)
    try {
      const variantIdToUse = variants.length > 0 ? selectedVariant : null
      await addItem(product.id, quantity, variantIdToUse)
    } finally {
      setIsAddingToCart(false)
    }
  }

  const reviewFormContent = (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-sm font-semibold text-foreground">التقييم</p>
        <div className="flex items-center gap-2" role="radiogroup" aria-label="تحديد التقييم">
          {Array.from({ length: 5 }).map((_, index) => {
            const value = index + 1
            const isActive = value <= reviewForm.rating
            return (
              <button
                key={value}
                type="button"
                onClick={() => setReviewForm((prev) => ({ ...prev, rating: value }))}
                  className={`p-2 rounded-full border transition ${
                  isActive ? "bg-primary/10 border-primary" : "border-transparent hover:border-border"
                }`}
                aria-label={`${value} نجوم`}
              >
                <Star size={20} className={isActive ? "text-primary fill-primary" : "text-gray-300"} />
              </button>
            )
          })}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-foreground">اسمك (اختياري)</label>
        <input
          type="text"
          value={reviewForm.title}
          onChange={(e) => setReviewForm((prev) => ({ ...prev, title: e.target.value }))}
          className="w-full rounded-lg border border-input px-3 py-2 focus:border-primary"
          placeholder="أدخل اسمك ليظهر مع التقييم"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-foreground">تعليقك (اختياري)</label>
        <textarea
          value={reviewForm.content}
          onChange={(e) => setReviewForm((prev) => ({ ...prev, content: e.target.value }))}
          className="w-full rounded-lg border border-input px-3 py-3 h-32 focus:border-primary"
          placeholder="اكتب تجربتك أو ملاحظاتك إن وجدت..."
        />
      </div>

      {reviewStatus && (
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
            reviewStatus.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
          }`}
        >
          {reviewStatus.type === "success" ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
          {reviewStatus.message}
        </div>
      )}

      <button
        onClick={handleSubmitReview}
        disabled={isPending}
        className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-bold hover:bg-brand-green-dark disabled:opacity-60"
      >
        {isPending ? "جاري الإرسال..." : "إرسال التقييم"}
      </button>

      {!canReview && (
        <p className="text-xs text-brand-red font-semibold text-center">سجّل الدخول لكتابة تقييمك.</p>
      )}
    </div>
  )

  return (
    <section className="max-w-7xl mx-auto px-4 py-6 md:py-12">
      <div className="grid md:grid-cols-2 gap-6 md:gap-10">
        <div className="space-y-4">
          {/* Main Carousel */}
          <div className="relative rounded-2xl overflow-hidden bg-muted border border-border">
            {product.has_tax && (
              <div className="absolute top-0 left-0 right-0 z-20 bg-[#C41E3A] text-white text-center px-3 py-2 text-xs md:text-sm font-bold shadow-md">
                خاضع للضريبة. 14%
              </div>
            )}
            <div dir="ltr" className="ltr overflow-hidden" ref={emblaRef}>
              <div className="flex">
                {images.map((image) => (
                  <div key={image.id} className="flex-[0_0_100%] min-w-0">
                    <div className="relative flex items-center justify-center">
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
                        selectedImageIndex === index ? "bg-primary w-6" : "bg-white/60"
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
                      ? "border-primary scale-95"
                      : "border-transparent hover:border-border"
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
            <p className="text-xs md:text-sm text-primary font-bold uppercase mb-2">{product.brand}</p>
            <h1 className="text-2xl md:text-4xl font-bold text-foreground mb-3 md:mb-4">{product.name_ar}</h1>
            <div className="flex items-center gap-3 md:gap-4">
              <div className="flex">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star
                    key={index}
                    size={16}
                    className={`md:w-5 md:h-5 ${
                      index < Math.round(product.rating || 0) ? "text-primary fill-primary" : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs md:text-sm text-brand-cumin">({product.reviews_count || 0} تقييم)</span>
            </div>
          </div>

          <div>
            <div className="flex items-baseline gap-3 md:gap-4">
              {hidePrices ? (
                <span className="text-lg md:text-xl font-semibold text-primary">{contactLabel}</span>
              ) : effectivePrice !== null ? (
                <>
                  <span className="text-3xl md:text-5xl font-bold text-[#C41E3A]">{effectivePrice.toFixed(2)} ج.م</span>
                  {product.original_price && product.original_price > effectivePrice && (
                    <span className="text-xl md:text-2xl text-gray-400 line-through">{product.original_price.toFixed(2)} ج.م</span>
                  )}
                </>
              ) : (
                <span className="text-lg md:text-xl font-semibold text-primary">{contactLabel}</span>
              )}
            </div>
            {product.has_tax && !hidePrices && (
              <p className="mt-2 text-xs md:text-sm text-[#C41E3A] font-semibold bg-[#C41E3A]/10 inline-block px-3 py-1 rounded-full">
                خاضع للضريبة. 14%
              </p>
            )}
            {isOutOfStock ? (
              <p className="mt-2 text-xs md:text-sm text-red-600 font-semibold">نفدت الكمية وسيتم التوفير قريباً</p>
            ) : (
              <p className="mt-2 text-xs md:text-sm text-brand-cumin">المخزون المتوفر: {availableStock} عبوة</p>
            )}
          </div>

          {variants.length > 0 && (
            <div className="space-y-3">
              <p className="font-semibold text-foreground">اختر المتغير</p>
              <div className="flex flex-wrap gap-3">
                {variants.map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() => setSelectedVariant(variant.id)}
                      className={`px-4 py-2 rounded-full border ${
                      selectedVariant === variant.id ? "border-primary bg-primary/10" : "border-border"
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

          <div className="space-y-3 md:space-y-4">
            <p className="font-semibold text-sm md:text-base text-foreground">الكمية</p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:gap-4">
              <div className="flex items-center border border-border rounded-lg w-full sm:w-auto">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 md:px-4 py-2 md:py-3 text-foreground hover:bg-muted flex-1 sm:flex-none"
                >
                  −
                </button>
                <span className="px-4 md:px-6 py-2 md:py-3 font-semibold text-center flex-1 sm:flex-none">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  disabled={quantity >= availableStock}
                  className="px-3 md:px-4 py-2 md:py-3 text-foreground hover:bg-muted disabled:text-gray-400 flex-1 sm:flex-none"
                >
                  +
                </button>
              </div>
              {hidePrices ? (
                <Link
                  href={contactUrl}
                  className="flex-1 py-3 rounded-lg border-2 border-primary text-primary font-bold flex items-center justify-center gap-2 md:gap-3 text-sm md:text-base hover:bg-primary/10"
                >
                  {contactLabel}
                </Link>
              ) : (
                <button
                  onClick={handleAddToCart}
                  className={`flex-1 py-3 rounded-lg font-bold flex items-center justify-center gap-2 md:gap-3 text-sm md:text-base ${
                    isOutOfStock || isCartLoading || isAddingToCart
                      ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                      : "bg-primary text-primary-foreground hover:bg-brand-green-dark"
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
              )}
              <button
                onClick={() => setIsFavorite(!isFavorite)}
                className={`p-2 md:p-3 rounded-lg border ${
                  isFavorite ? "border-brand-red text-brand-red" : "border-border text-brand-cumin"
                }`}
              >
                <Heart size={20} className={`md:w-6 md:h-6 ${isFavorite ? "fill-current" : ""}`} />
              </button>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-base md:text-lg text-foreground mb-2">الوصف</h3>
            <p className="text-sm md:text-base text-brand-cumin leading-relaxed">{product.description_ar}</p>
          </div>
        </div>
      </div>

      <section className="mt-8 md:mt-16 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h3 className="text-xl md:text-2xl font-bold text-foreground">تقييمات العملاء</h3>
            <p className="text-sm text-brand-cumin">اطّلع على آراء المتسوقين وأضف تجربتك.</p>
          </div>
          <button
            onClick={openReviewForm}
            className="self-start inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-primary-foreground text-sm font-bold hover:bg-brand-green-dark transition"
          >
            <Plus size={16} />
            <span>اكتب تقييمك</span>
          </button>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 md:gap-10">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl md:rounded-2xl shadow p-4 md:p-6">
            <h4 className="text-lg md:text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Star size={18} className="text-primary fill-primary" />
              آراء العملاء
            </h4>
            {reviewList.length === 0 ? (
              <p className="text-sm text-brand-cumin">كن أول من يقيّم هذا المنتج.</p>
            ) : (
              <div className="space-y-4 max-h-[420px] overflow-y-auto pr-2">
                {reviewList.map((review) => (
                  <div key={review.id} className="border border-[#E8E2D1] rounded-xl p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star
                          key={index}
                          size={16}
                          className={index < review.rating ? "text-primary fill-primary" : "text-gray-300"}
                        />
                      ))}
                      <span className="text-xs text-brand-cumin">
                        {new Date(review.created_at).toLocaleDateString("ar-EG")}
                      </span>
                    </div>
                    <p className="font-semibold text-foreground">
                      {review.title?.trim() ? review.title : "عميل المتجر"}
                    </p>
                    {review.content && <p className="text-sm text-brand-cumin">{review.content}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl md:rounded-2xl shadow p-4 md:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg md:text-xl font-bold text-foreground">شاركنا تجربتك</h4>
                <p className="text-sm text-brand-cumin">حدد التقييم واكتب تعليقاً إذا رغبت.</p>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-[#FFF8ED] px-3 py-2">
                <Star size={18} className="text-primary fill-primary" />
                <span className="text-sm font-semibold text-[#2B2520]">
                  {product.rating ? product.rating.toFixed(1) : "جديد"}
                </span>
                <span className="text-xs text-[#8B6F47]">({product.reviews_count || 0})</span>
              </div>
            </div>
            <div className="rounded-xl border border-dashed border-border bg-muted/60 p-4 space-y-2">
              <p className="text-sm text-foreground font-semibold">كيف كانت تجربتك مع {product.name_ar}؟</p>
              <p className="text-sm text-brand-cumin leading-relaxed">
                نستخدم التقييمات لتحسين المنتجات وخدمة ما بعد البيع. مشاركة رأيك تساعد الآخرين أيضاً في اختيار المنتج المناسب.
              </p>
            </div>
            <button
              onClick={openReviewForm}
              className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-bold hover:bg-brand-green-dark transition"
            >
              إضافة تقييم جديد
            </button>
          </div>
        </div>
      </section>

      {isMobile ? (
        <Sheet open={isReviewOpen} onOpenChange={setIsReviewOpen}>
          <SheetContent side="bottom" className="h-[85vh] overflow-y-auto px-4">
            <SheetHeader className="space-y-2 text-right">
              <SheetTitle className="text-xl font-bold text-[#2B2520]">اكتب تقييمك</SheetTitle>
              <SheetDescription className="text-sm text-[#8B6F47]">
                اختر عدد النجوم، أدخل اسمك لعرضه مع التقييم، ثم أضف تعليقاً عند الحاجة.
              </SheetDescription>
            </SheetHeader>
            <div className="py-4">{reviewFormContent}</div>
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader className="space-y-2 text-right">
              <DialogTitle className="text-2xl font-bold text-[#2B2520]">اكتب تقييمك</DialogTitle>
              <DialogDescription className="text-sm text-[#8B6F47]">
                اختر عدد النجوم، أدخل اسمك لعرضه مع التقييم، ثم أضف تعليقاً عند الحاجة.
              </DialogDescription>
            </DialogHeader>
            {reviewFormContent}
          </DialogContent>
        </Dialog>
      )}

      {/* Similar Products Section */}
      {similarProducts.length > 0 && (
        <section className="mt-8 md:mt-16">
          <div className="mb-6 md:mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">منتجات مشابهة</h2>
            <p className="text-sm md:text-base text-brand-cumin">من نفس الفئة</p>
          </div>
          <SimilarProductsRow
            products={similarProducts}
            mode={mode}
            priceHidden={priceHidden}
            contactLabel={contactLabel}
            contactUrl={contactUrl}
          />
        </section>
      )}
    </section>
  )
}

function SimilarProductsRow({
  products,
  mode = "b2c",
  priceHidden = false,
  contactLabel = "تواصل مع المبيعات",
}: {
  products: SimilarProduct[]
  mode?: "b2c" | "b2b"
  priceHidden?: boolean
  contactLabel?: string
  contactUrl?: string
}) {
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
    <div dir="ltr" className="relative">
      <div className="rounded-3xl bg-[#F5F1E8] p-6 md:p-8">
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
              product.price !== null && product.original_price && product.original_price > product.price
                ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
                : 0
            // Hide prices for B2B products when b2b_price_hidden is true, or when price is NULL (from DB migration)
            const hidePrice = Boolean(product.b2b_price_hidden) || product.price === null
            const productLink = mode === "b2b" ? `/b2b/product/${product.id}` : `/product/${product.id}`

            return (
              <div
                key={product.id}
                className="flex-[0_0_85%] sm:flex-[0_0_45%] lg:flex-[0_0_30%] min-w-0"
              >
                <Link
                  href={productLink}
                  className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all border border-[#E8E2D1] flex flex-col group h-full"
                >
                  <div className="relative h-48 bg-muted overflow-hidden">
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
                    <p className="text-xs text-primary font-semibold uppercase mb-1">{product.brand}</p>
                    <h3 className="text-base md:text-lg font-bold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
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
                                ? "text-primary fill-primary"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-brand-cumin">({product.reviews_count || 0})</span>
                    </div>
                    <div className="flex items-baseline gap-2 mb-3">
                      {hidePrice ? (
                        <span className="text-sm font-semibold text-primary">{contactLabel}</span>
                      ) : product.price !== null ? (
                        <>
                          <span className="text-xl md:text-2xl font-bold text-[#C41E3A]">
                            {product.price.toFixed(2)} ج.م
                          </span>
                          {product.original_price && product.original_price > product.price && (
                            <span className="text-xs md:text-sm text-gray-400 line-through">
                              {product.original_price.toFixed(2)} ج.م
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-sm font-semibold text-primary">{contactLabel}</span>
                      )}
                    </div>
                  </div>
                </Link>
              </div>
            )
          })}
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      {products.length > 3 && (
        <>
          <button
            onClick={scrollNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white shadow-lg p-2 rounded-full hover:bg-gray-50 transition-all z-10 hidden md:flex items-center justify-center"
            aria-label="السابق"
          >
            <ChevronRight size={20} className="text-[#2B2520]" />
          </button>
          <button
            onClick={scrollPrev}
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

