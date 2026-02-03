"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Star } from "lucide-react"

import { AddToCartButton } from "@/components/add-to-cart-button"
import { getSupabaseClient } from "@/lib/supabase"
import { SearchAutocomplete } from "@/components/search-autocomplete"
import { SearchHighlighter } from "@/components/search-highlighter"

type OfferImage = {
  image_url: string
  is_primary: boolean
}

type OfferVariant = {
  stock: number
}

type OfferRecord = {
  id: string
  name_ar: string
  description_ar: string | null
  brand: string
  type: string | null
  price: number
  original_price: number | null
  rating: number | null
  reviews_count: number | null
  stock: number
  created_at?: string | null
  is_featured?: boolean | null
  has_tax?: boolean | null
  images?: OfferImage[] | null
  variants?: OfferVariant[] | null
  source?: 'offer' | 'product'
  // Legacy fields for backwards compatibility
  offer_images?: OfferImage[] | null
  offer_variants?: OfferVariant[] | null
  product_images?: OfferImage[] | null
  product_variants?: OfferVariant[] | null
}

interface OffersClientProps {
  initialOffers: OfferRecord[]
  initialSearch?: string
  initialBrand?: string
  pageSize?: number
}

export function OffersClient({
  initialOffers,
  initialSearch = "",
  initialBrand = "",
  pageSize = 12,
}: OffersClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = useMemo(() => getSupabaseClient(), [])
  
  const calculatedBrands = useMemo(() => {
    const uniqueBrands = new Set(initialOffers.map(p => p.brand).filter(Boolean))
    // Ensure core brands are always available
    uniqueBrands.add("Tabel")
    uniqueBrands.add("Tatbeelah")
    return Array.from(uniqueBrands).sort()
  }, [initialOffers])

  const [offers, setOffers] = useState<OfferRecord[]>(initialOffers)
  const [totalCount, setTotalCount] = useState(initialOffers.length)
  const [search, setSearch] = useState(initialSearch)
  const [selectedBrand, setSelectedBrand] = useState<string>(() => {
    if (initialBrand === "Tabel" || initialBrand === "Tatbeelah") return initialBrand
    return ""
  })
  const [sortBy, setSortBy] = useState("popularity")
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  const brandOptions = useMemo(() => Array.from(new Set(calculatedBrands)), [calculatedBrands])

  const fetchOffers = async (reset = false) => {
    if (!reset && (loading || loadingMore)) return

    if (reset) {
      setLoading(true)
      setHasMore(false)
    } else {
      setLoadingMore(true)
    }

    const from = reset ? 0 : offers.length
    const to = from + pageSize - 1

    try {
      // Query dedicated offers
      let offersQueryClient = supabase
        .from("offers")
        .select(
          `
          id,
          name_ar,
          description_ar,
          brand,
          type,
          price,
          original_price,
          rating,
          reviews_count,
          stock,
          created_at,
          is_featured,
          has_tax,
          offer_images (image_url, is_primary),
          offer_variants (stock)
        `,
          { count: "exact" }
        )
        .eq("is_archived", false)

      // Query products with discounts (B2C only)
      let productsQueryClient = supabase
        .from("products")
        .select(
          `
          id,
          name_ar,
          description_ar,
          brand,
          type,
          price,
          original_price,
          rating,
          reviews_count,
          stock,
          created_at,
          is_featured,
          has_tax,
          product_images (image_url, is_primary),
          product_variants (stock)
        `,
          { count: "exact" }
        )
        .eq("is_archived", false)
        .eq("is_b2b", false)
        .not("original_price", "is", null)
        .gt("original_price", 0)

      // Apply filters to both queries
      if (search.trim()) {
        offersQueryClient = offersQueryClient.or(`name_ar.ilike.%${search}%,description_ar.ilike.%${search}%`)
        productsQueryClient = productsQueryClient.or(`name_ar.ilike.%${search}%,description_ar.ilike.%${search}%`)
      }

      if (selectedBrand) {
        offersQueryClient = offersQueryClient.eq("brand", selectedBrand)
        productsQueryClient = productsQueryClient.eq("brand", selectedBrand)
      }

      // Apply sorting to both queries
      if (sortBy === "price-low") {
        offersQueryClient = offersQueryClient.order("price", { ascending: true })
        productsQueryClient = productsQueryClient.order("price", { ascending: true })
      } else if (sortBy === "price-high") {
        offersQueryClient = offersQueryClient.order("price", { ascending: false })
        productsQueryClient = productsQueryClient.order("price", { ascending: false })
      } else if (sortBy === "newest") {
        offersQueryClient = offersQueryClient.order("created_at", { ascending: false })
        productsQueryClient = productsQueryClient.order("created_at", { ascending: false })
      } else {
        offersQueryClient = offersQueryClient.order("is_featured", { ascending: false }).order("created_at", { ascending: false })
        productsQueryClient = productsQueryClient.order("is_featured", { ascending: false }).order("created_at", { ascending: false })
      }

      // Execute both queries in parallel
      const [offersResult, productsResult] = await Promise.all([
        offersQueryClient,
        productsQueryClient
      ])

      if (offersResult.error) throw offersResult.error
      if (productsResult.error) throw productsResult.error

      // Filter products to only include those with actual discounts
      const discountedProducts = (productsResult.data || []).filter(
        (product: any) => product.original_price && product.original_price > product.price
      )

      // Combine and normalize the data
      const combinedData = [
        ...(offersResult.data || []).map((offer: any) => ({
          ...offer,
          images: offer.offer_images,
          variants: offer.offer_variants,
          source: 'offer' as const
        })),
        ...discountedProducts.map((product: any) => ({
          ...product,
          images: product.product_images,
          variants: product.product_variants,
          source: 'product' as const
        }))
      ]

      // Apply pagination to combined results
      const paginatedData = combinedData.slice(from, to + 1)
      const totalCombinedCount = combinedData.length

      const received = paginatedData.length
      const previousLength = reset ? 0 : offers.length
      const totalLoaded = previousLength + received

      setOffers((prev) => (reset ? paginatedData : [...prev, ...paginatedData]))
      setTotalCount(totalCombinedCount)
      setHasMore(totalLoaded < totalCombinedCount)
    } catch (error) {
      console.error("خطأ في جلب العروض:", error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => fetchOffers(true), 300)
    return () => clearTimeout(timer)
  }, [sortBy, selectedBrand, search])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          fetchOffers()
        }
      },
      { rootMargin: "200px" },
    )

    const target = loadMoreRef.current
    if (target) observer.observe(target)

    return () => {
      if (target) observer.unobserve(target)
    }
  }, [hasMore, loading, loadingMore])

  const handleBrandChange = (brand: string) => {
    const next = brand === selectedBrand ? "" : brand
    setSelectedBrand(next)

    const params = new URLSearchParams(searchParams)
    if (next) params.set("brand", next)
    else params.delete("brand")
    const qs = params.toString()
    router.replace(qs ? `/offers?${qs}` : "/offers")
  }

  useEffect(() => {
    setSearch(initialSearch)
  }, [initialSearch])

  useEffect(() => {
    // Keep local brand state in sync with server-provided defaults (route change / direct navigation)
    if (initialBrand === "Tabel" || initialBrand === "Tatbeelah") {
      setSelectedBrand(initialBrand)
    } else {
      setSelectedBrand("")
    }
  }, [initialBrand])

  useEffect(() => {
    setOffers(initialOffers)
    setTotalCount(initialOffers.length)
    setHasMore(false)
  }, [initialOffers])

  const handleSearchSubmit = (searchValue: string) => {
    setSearch(searchValue)
    const params = new URLSearchParams(searchParams)
    if (searchValue) {
      params.set("search", searchValue)
    } else {
      params.delete("search")
    }
    router.replace(`/offers?${params.toString()}`)
  }

  return (
    <section className="py-6 md:py-12">
      <div className="max-w-[95%] mx-auto px-4">
        {/* Mobile Search Bar */}
        <div className="lg:hidden mb-6">
          <SearchAutocomplete
            value={search}
            onChange={setSearch}
            onSubmit={handleSearchSubmit}
            placeholder="ابحث عن عرض..."
            className="w-full rounded-xl border-2 border-[#D9D4C8] px-4 py-4 focus:border-brand-green focus:outline-none text-base bg-white shadow-sm"
          />
        </div>

        {/* Brand Switch (always visible, mobile-first) */}
        <div className="mb-6">
          <div className="inline-flex items-center rounded-2xl bg-white/80 backdrop-blur-sm shadow p-1 border border-[#E8E2D1]">
            <button
              type="button"
              onClick={() => handleBrandChange("Tabel")}
              className={[
                "px-4 py-2.5 rounded-xl text-sm font-bold min-h-[44px] transition",
                selectedBrand === "Tabel"
                  ? "bg-brand-green text-white shadow hover:bg-brand-green-dark"
                  : "text-[#2B2520] hover:bg-brand-green/10",
              ].join(" ")}
              aria-pressed={selectedBrand === "Tabel"}
            >
              Tabel
            </button>
            <button
              type="button"
              onClick={() => handleBrandChange("Tatbeelah")}
              className={[
                "px-4 py-2.5 rounded-xl text-sm font-bold min-h-[44px] transition",
                selectedBrand === "Tatbeelah"
                  ? "bg-brand-green text-white shadow hover:bg-brand-green-dark"
                  : "text-[#2B2520] hover:bg-brand-green/10",
              ].join(" ")}
              aria-pressed={selectedBrand === "Tatbeelah"}
            >
              Tatbeelah
            </button>
          </div>
          <p className="mt-2 text-xs text-[#8B6F47]">
            {selectedBrand ? `عرض عروض ${selectedBrand}` : "اختر العلامة لعرض العروض الخاصة بها"}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block lg:w-72 flex-shrink-0 space-y-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow p-4 space-y-3">
              <h2 className="text-lg font-bold text-[#2B2520]">البحث</h2>
              <SearchAutocomplete
                value={search}
                onChange={setSearch}
                onSubmit={handleSearchSubmit}
                placeholder="ابحث عن عرض..."
                className="w-full rounded-lg border border-[#D9D4C8] px-3 py-2 focus:border-brand-green focus:outline-none"
                showRecentSearches={false}
                showPopularSearches={false}
              />
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow p-4 space-y-3">
              <h3 className="text-lg font-bold text-[#2B2520]">العلامات</h3>
              <div className="space-y-2">
                {brandOptions.map((brand) => (
                  <label key={brand} className="flex items-center gap-2 text-sm text-[#2B2520] cursor-pointer py-1">
                    <input
                      type="checkbox"
                      checked={selectedBrand === brand}
                      onChange={() => handleBrandChange(brand)}
                      className="cursor-pointer"
                    />
                    {brand}
                  </label>
                ))}
              </div>
            </div>

          </aside>

          <div className="flex-1 space-y-6 md:space-y-8">
            {/* Header with Sort */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  <h2 className="text-xl md:text-2xl font-bold text-[#2B2520] mb-1">
                    {search.trim() ? "نتائج البحث" : "العروض المتاحة"}
                  </h2>
                  <p className="text-sm text-[#8B6F47]">
                    {totalCount} {totalCount === 1 ? "عرض" : "عرض"}
                    {loading && <span className="text-xs"> (يتم التحديث...)</span>}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1" />
                <div className="flex items-center gap-2 lg:gap-3">
                  <span className="text-sm text-[#8B6F47] whitespace-nowrap">ترتيب حسب</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="flex-1 lg:flex-none rounded-lg border-2 border-[#D9D4C8] px-3 py-2.5 text-sm focus:border-brand-green focus:outline-none bg-white min-h-[44px]"
                  >
                    <option value="popularity">الأكثر شهرة</option>
                    <option value="price-low">السعر (تصاعدي)</option>
                    <option value="price-high">السعر (تنازلي)</option>
                    <option value="newest">الأحدث</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="rounded-2xl md:rounded-3xl bg-[#F5F1E8] p-4 md:p-6 lg:p-8">
              <div className="grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {offers.map((offer) => (
                  <OfferCard
                    key={offer.id}
                    offer={offer}
                    searchTerm={search}
                  />
                ))}
              </div>
            </div>

            {loading && offers.length === 0 && (
              <div className="rounded-2xl border border-dashed border-[#D9D4C8] p-12 text-center text-[#8B6F47]">
                جاري تحميل العروض...
              </div>
            )}

            {!loading && offers.length === 0 && (
              <div className="rounded-2xl border border-dashed border-[#D9D4C8] p-12 text-center text-[#8B6F47]">
                لا توجد عروض مطابقة حالياً.
              </div>
            )}

            {loadingMore && (
              <div className="text-center text-[#8B6F47] py-4">جاري تحميل المزيد...</div>
            )}

            <div ref={loadMoreRef} className="h-10" aria-hidden />
          </div>
        </div>
      </div>
    </section>
  )
}

function OfferCard({
  offer,
  searchTerm,
}: {
  offer: OfferRecord
  searchTerm?: string
}) {
  // Use normalized images field, fallback to legacy fields
  const images = offer.images || offer.offer_images || offer.product_images || null
  const variants = offer.variants || offer.offer_variants || offer.product_variants || null

  const primaryImage =
    images?.find((image) => image.is_primary)?.image_url ||
    images?.[0]?.image_url ||
    null

  const isOutOfStock =
    (offer.stock ?? 0) <= 0 &&
    (variants?.length
      ? variants.every((variant) => (variant.stock ?? 0) <= 0)
      : true)

  const discount =
    offer.original_price && offer.original_price > offer.price
      ? Math.round(((offer.original_price - offer.price) / offer.original_price) * 100)
      : 0

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow hover:shadow-lg transition border border-[#E8E2D1] flex flex-col group">
      <div className="relative h-64 bg-[#F5F1E8] overflow-hidden">
        {primaryImage ? (
          <img
            src={primaryImage}
            alt={offer.name_ar}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300 bg-white"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">🎁</div>
        )}
        {discount > 0 && (
          <span className="absolute top-4 left-4 bg-[#C41E3A] text-white px-3 py-1 rounded-full text-sm font-bold z-10">
            -{discount}%
          </span>
        )}
        {isOutOfStock && (
          <span className="absolute top-4 right-4 bg-gray-900/80 text-white px-3 py-1 rounded-full text-sm font-bold z-10">
            غير متوفر
          </span>
        )}
        {offer.has_tax && (
          <span className="absolute top-2 left-2 right-2 bg-[#C41E3A] text-white px-2 py-1 text-xs font-bold text-center z-10">
            خاضع للضريبة. 14%
          </span>
        )}
      </div>
      <div className="p-4 flex flex-col flex-1">
        {offer.is_featured ? (
          <span className="inline-flex items-center gap-2 px-3 py-1 mb-2 rounded-full bg-[#E8A835]/10 text-[#E8A835] text-xs font-bold">
            ⭐ عرض مميز
          </span>
        ) : null}
        <p className="text-xs text-[#E8A835] font-semibold uppercase mb-2">{offer.brand}</p>
        <h3 className="text-lg font-bold text-[#2B2520] mb-2 line-clamp-2 group-hover:text-[#E8A835] transition-colors">
          <SearchHighlighter text={offer.name_ar} searchTerm={searchTerm} />
        </h3>
        <p className="text-sm text-[#8B6F47] line-clamp-2 mb-4">
          <SearchHighlighter text={offer.description_ar || ''} searchTerm={searchTerm} />
        </p>
        <div className="flex items-center gap-2 mb-4">
          <div className="flex">
            {Array.from({ length: 5 }).map((_, index) => (
              <Star
                key={index}
                size={14}
                className={
                  index < Math.round(offer.rating || 0) ? "text-[#E8A835] fill-[#E8A835]" : "text-gray-300"
                }
              />
            ))}
          </div>
          <span className="text-xs text-[#8B6F47]">({offer.reviews_count || 0})</span>
        </div>
        <div className="mb-4">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#C41E3A]">{offer.price.toFixed(2)} ج.م</span>
            {offer.original_price && offer.original_price > offer.price && (
              <span className="text-sm text-gray-400 line-through">{offer.original_price.toFixed(2)} ج.م</span>
            )}
          </div>
          {offer.has_tax && (
            <p className="text-xs text-[#C41E3A] font-semibold mt-1">خاضع للضريبة. 14%</p>
          )}
        </div>
        <AddToCartButton 
          productId={offer.id} 
          disabled={isOutOfStock}
          className="mt-auto"
        >
          {isOutOfStock ? "سيعود قريباً" : "أضف إلى السلة"}
        </AddToCartButton>
      </div>
    </div>
  )
}
