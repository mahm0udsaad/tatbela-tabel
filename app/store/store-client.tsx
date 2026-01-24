"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Star, ChevronDown, Filter, Search, X } from "lucide-react"

import { AddToCartButton } from "@/components/add-to-cart-button"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { useIsMobile } from "@/hooks/use-mobile"
import { SearchAutocomplete } from "@/components/search-autocomplete"
import { SearchHighlighter } from "@/components/search-highlighter"
import { searchService, type SearchAnalytics } from "@/lib/search"
import type { CategoryRecord } from "./category-helpers"

type ProductImage = {
  image_url: string
  is_primary: boolean
}

type ProductVariant = {
  id?: string
  weight?: number | null
  size?: string | null
  variant_type?: string | null
  stock: number
}

type ProductRecord = {
  id: string
  name_ar: string
  description_ar: string | null
  brand: string
  type: string | null
  price: number | null  // Can be null for B2B products in public search
  original_price: number | null
  rating: number | null
  reviews_count: number | null
  stock: number
  category_id: string | null
  created_at?: string | null
  is_featured?: boolean | null
  is_b2b?: boolean | null
  b2b_price_hidden?: boolean | null
  product_images: ProductImage[] | null
  product_variants: ProductVariant[] | null
}

type CategoryNode = CategoryRecord & { children: CategoryNode[] }

interface StoreClientProps {
  initialProducts: ProductRecord[]
  categories: CategoryRecord[]
  initialSearch?: string
  initialTotal?: number
  categoryScopeIds?: string[]
  initialSelectedCategories?: string[]
  priceBounds?: { min: number; max: number }
  brands?: string[]
  pageSize?: number
  mode?: "b2c" | "b2b"
  priceHidden?: boolean
  contactLabel?: string
  contactUrl?: string
}

export function StoreClient({
  initialProducts,
  categories,
  initialSearch = "",
  initialTotal,
  priceBounds,
  brands,
  categoryScopeIds = [],
  initialSelectedCategories = [],
  pageSize = 12,
  mode = "b2c",
  priceHidden = false,
  contactLabel = "تواصل مع المبيعات",
  contactUrl = "/contact",
}: StoreClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isB2B = mode === "b2b"
  const isMobile = useIsMobile()
  const [filtersOpen, setFiltersOpen] = useState(false)
  const requestSeqRef = useRef(0)
  const [priceTouched, setPriceTouched] = useState(false)

  // #region agent log - mount snapshot (hypothesis A/E)
  useEffect(() => {
    const payload = {sessionId:'debug-session',runId:'pre-fix',hypothesisId:'A',location:'app/store/store-client.tsx:mount',message:'StoreClient mount snapshot',data:{initialProductsLen:initialProducts.length,initialTotal,calculatedInitialTotal,initialSearch,categoryScopeIdsLen:categoryScopeIds.length,initialSelectedCategories,mode,priceHidden},timestamp:Date.now()}
    fetch('http://127.0.0.1:7243/ingest/87a82cd4-27bc-4a13-a28b-97d7121e94c1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}).catch(()=>{});
    try { navigator.sendBeacon?.('http://127.0.0.1:7243/ingest/87a82cd4-27bc-4a13-a28b-97d7121e94c1', JSON.stringify(payload)) } catch {}
  }, [])
  // #endregion agent log

  // #region agent log - relay smoke test (hypothesis Z)
  useEffect(() => {
    const payload = {sessionId:'debug-session',runId:'pre-fix',hypothesisId:'Z',location:'app/store/store-client.tsx:relay-mount',message:'Relay smoke test (same-origin)',data:{ua:typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'},timestamp:Date.now()}
    fetch('/api/agent-log',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}).catch(()=>{});
    try { navigator.sendBeacon?.('/api/agent-log', JSON.stringify(payload)) } catch {}
  }, [])
  // #endregion agent log

  // #region agent log - post-fix version marker (hypothesis Z)
  useEffect(() => {
    const payload = {sessionId:'debug-session',runId:'post-fix',hypothesisId:'Z',location:'app/store/store-client.tsx:version',message:'StoreClient version marker',data:{version:'2026-01-06-priceTouched-v1'},timestamp:Date.now()}
    fetch('/api/agent-log',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}).catch(()=>{});
    try { navigator.sendBeacon?.('/api/agent-log', JSON.stringify(payload)) } catch {}
  }, [])
  // #endregion agent log
  
  // Calculate defaults from initialProducts if not provided
  const calculatedPriceBounds = useMemo(() => {
    if (priceBounds) return priceBounds
    if (initialProducts.length === 0) return { min: 0, max: 1000 }
    const prices = initialProducts.map(p => p.price)
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
    }
  }, [priceBounds, initialProducts])

  const [uiPriceBounds, setUiPriceBounds] = useState(() => calculatedPriceBounds)

  const calculatedBrands = useMemo(() => {
    if (brands) return brands
    const uniqueBrands = new Set(initialProducts.map(p => p.brand).filter(Boolean))
    // Ensure core brands are always available
    uniqueBrands.add("Tabel")
    uniqueBrands.add("Tatbeelah")
    return Array.from(uniqueBrands).sort()
  }, [brands, initialProducts])

  const calculatedInitialTotal = initialTotal ?? initialProducts.length

  const [products, setProducts] = useState<ProductRecord[]>(initialProducts)
  const [totalCount, setTotalCount] = useState(calculatedInitialTotal)
  const [search, setSearch] = useState(initialSearch)
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialSelectedCategories)
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [priceRange, setPriceRange] = useState<[number, number]>(() => {
    const min = Number.isFinite(calculatedPriceBounds.min) ? calculatedPriceBounds.min : 0
    const maxCandidate = Number.isFinite(calculatedPriceBounds.max) ? calculatedPriceBounds.max : min
    const max = maxCandidate >= min ? maxCandidate : min
    return [min, max]
  })
  const [sortBy, setSortBy] = useState("popularity")
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(initialProducts.length < calculatedInitialTotal)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const filtersInitializedRef = useRef(false)
  const prevInitialSelectedCategoriesRef = useRef<string[]>(initialSelectedCategories)

  const categoryTree = useMemo(() => buildCategoryTree(categories), [categories])
  const categoryDescendants = useMemo(() => buildDescendantMap(categoryTree), [categoryTree])

  const brandOptions = useMemo(() => Array.from(new Set(calculatedBrands)), [calculatedBrands])

  const selectedCategoryIds = useMemo(() => {
    const allowed = new Set<string>()
    selectedCategories.forEach((categoryId) => {
      allowed.add(categoryId)
      categoryDescendants.get(categoryId)?.forEach((childId) => allowed.add(childId))
    })
    return Array.from(allowed)
  }, [selectedCategories, categoryDescendants])

  const categoryFilterIds = useMemo(() => {
    // If user explicitly selects categories, honor them
    if (selectedCategoryIds.length > 0) return selectedCategoryIds
    // Otherwise keep the current page/category scope
    if (categoryScopeIds.length > 0) return categoryScopeIds
    return []
  }, [selectedCategoryIds, categoryScopeIds])

  // Track search analytics
  const [searchAnalytics, setSearchAnalytics] = useState<SearchAnalytics | null>(null)

  const fetchProducts = async (reset = false) => {
    if (!reset && (loading || loadingMore)) return

    if (reset) {
      setLoading(true)
      setHasMore(true)
    } else {
      setLoadingMore(true)
    }

    const from = reset ? 0 : products.length
    const to = from + pageSize - 1

    try {
      const reqId = (requestSeqRef.current += 1)
      // #region agent log - fetch entry (hypothesis A/B/D)
      const payloadEntry = {sessionId:'debug-session',runId:'pre-fix',hypothesisId:'D',location:'app/store/store-client.tsx:fetchProducts:entry',message:'fetchProducts entry',data:{reqId,reset,search,categoryFilterIds,selectedCategories,selectedBrands,priceRange,pageSize,from,to,sortBy,isB2B,productsLen:products.length,hasMore,loading,loadingMore},timestamp:Date.now()}
      fetch('http://127.0.0.1:7243/ingest/87a82cd4-27bc-4a13-a28b-97d7121e94c1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payloadEntry)}).catch(()=>{});
      try { navigator.sendBeacon?.('http://127.0.0.1:7243/ingest/87a82cd4-27bc-4a13-a28b-97d7121e94c1', JSON.stringify(payloadEntry)) } catch {}
      // #endregion agent log

      const effectivePriceMin = priceTouched ? priceRange[0] : undefined
      const effectivePriceMax = priceTouched ? priceRange[1] : undefined
      // #region agent log - effective search params (hypothesis A)
      const payloadEffective = {sessionId:'debug-session',runId:'post-fix',hypothesisId:'A',location:'app/store/store-client.tsx:fetchProducts:effectiveParams',message:'effective search params (post-fix)',data:{reqId,reset,categoryFilterIdsLen:categoryFilterIds.length,priceTouched,effectivePriceMin,effectivePriceMax,priceRange},timestamp:Date.now()}
      fetch('http://127.0.0.1:7243/ingest/87a82cd4-27bc-4a13-a28b-97d7121e94c1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payloadEffective)}).catch(()=>{});
      try { navigator.sendBeacon?.('http://127.0.0.1:7243/ingest/87a82cd4-27bc-4a13-a28b-97d7121e94c1', JSON.stringify(payloadEffective)) } catch {}
      // #endregion agent log

      // #region agent log - post-fix effective params via relay (hypothesis Z)
      fetch('/api/agent-log',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payloadEffective)}).catch(()=>{});
      try { navigator.sendBeacon?.('/api/agent-log', JSON.stringify(payloadEffective)) } catch {}
      // #endregion agent log

      const searchResult = await searchService.searchProducts({
        query: search,
        categoryIds: categoryFilterIds.length > 0 ? categoryFilterIds : undefined,
        brands: selectedBrands.length > 0 ? selectedBrands : undefined,
        priceMin: effectivePriceMin,
        priceMax: effectivePriceMax,
        isB2B,
        limit: pageSize,
        offset: from,
        sortBy: search.trim() ? 'relevance' : sortBy
      })

      const received = searchResult.data?.length ?? 0
      const previousLength = reset ? 0 : products.length
      const totalLoaded = previousLength + received

      setProducts((prev) => (reset ? searchResult.data || [] : [...prev, ...(searchResult.data || [])]))

      // For enhanced search, we need to track total count differently
      if (reset && searchResult.analytics) {
        setSearchAnalytics(searchResult.analytics)
        setTotalCount(searchResult.count)
        setHasMore(totalLoaded < searchResult.count)
      } else if (reset) {
        // Fallback for non-search queries
        setTotalCount(searchResult.count)
        setHasMore(received === pageSize)
      } else {
        setHasMore(received === pageSize)
      }

      // If the user hasn't explicitly set a price filter, keep the UI bounds
      // aligned with the newly loaded dataset so category switches don't show
      // stale Atara bounds when viewing Blends.
      if (reset && !priceTouched && (searchResult.data?.length ?? 0) > 0) {
        const prices = (searchResult.data ?? [])
          .map((p) => p.price)
          .filter((n) => Number.isFinite(n))
        if (prices.length > 0) {
          const nextMin = Math.min(...prices)
          const nextMax = Math.max(...prices)
          setUiPriceBounds({ min: nextMin, max: nextMax })
          setPriceRange([nextMin, nextMax])
        }
      }

      // #region agent log - fetch response (hypothesis A/B/D)
      const payloadResponse = {sessionId:'debug-session',runId:'pre-fix',hypothesisId:'B',location:'app/store/store-client.tsx:fetchProducts:response',message:'fetchProducts response',data:{reqId:requestSeqRef.current,reset,received,count:searchResult.count,hasAnalytics:!!searchResult.analytics,totalLoaded,computedHasMore:reset && searchResult.analytics ? totalLoaded < searchResult.count : reset ? received === pageSize : received === pageSize},timestamp:Date.now()}
      fetch('http://127.0.0.1:7243/ingest/87a82cd4-27bc-4a13-a28b-97d7121e94c1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payloadResponse)}).catch(()=>{});
      try { navigator.sendBeacon?.('http://127.0.0.1:7243/ingest/87a82cd4-27bc-4a13-a28b-97d7121e94c1', JSON.stringify(payloadResponse)) } catch {}
      // #endregion agent log
    } catch (error) {
      console.error("خطأ في جلب المنتجات:", error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }


  useEffect(() => {
    if (!filtersInitializedRef.current) {
      filtersInitializedRef.current = true
      return
    }
    // #region agent log - filters change triggers fetch (hypothesis A/E)
    const payload = {sessionId:'debug-session',runId:'pre-fix',hypothesisId:'A',location:'app/store/store-client.tsx:filtersEffect',message:'filters/search/sort changed -> will reset fetch',data:{sortBy,selectedCategories,selectedBrands,priceRange,priceTouched,search,categoryFilterIds,selectedCategoryIds,categoryScopeIds},timestamp:Date.now()}
    fetch('http://127.0.0.1:7243/ingest/87a82cd4-27bc-4a13-a28b-97d7121e94c1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}).catch(()=>{});
    try { navigator.sendBeacon?.('http://127.0.0.1:7243/ingest/87a82cd4-27bc-4a13-a28b-97d7121e94c1', JSON.stringify(payload)) } catch {}
    // #endregion agent log
    const timer = setTimeout(() => fetchProducts(true), 300)
    return () => clearTimeout(timer)
  }, [
    sortBy,
    selectedCategories,
    selectedBrands,
    search,
    // Only treat price changes as filter changes after the user has explicitly edited it.
    priceTouched ? `${priceRange[0]}-${priceRange[1]}` : "price:not-touched",
  ])

  useEffect(() => {
    // #region agent log - observer setup/teardown (hypothesis C)
    const payloadSetup = {sessionId:'debug-session',runId:'pre-fix',hypothesisId:'C',location:'app/store/store-client.tsx:observerEffect',message:'observer effect run (setup)',data:{hasMore,loading,loadingMore,productsLen:products.length,targetExists:!!loadMoreRef.current},timestamp:Date.now()}
    fetch('http://127.0.0.1:7243/ingest/87a82cd4-27bc-4a13-a28b-97d7121e94c1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payloadSetup)}).catch(()=>{});
    try { navigator.sendBeacon?.('http://127.0.0.1:7243/ingest/87a82cd4-27bc-4a13-a28b-97d7121e94c1', JSON.stringify(payloadSetup)) } catch {}
    // #endregion agent log
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          // #region agent log - intersection triggers load more (hypothesis C/B)
          const payload = {sessionId:'debug-session',runId:'pre-fix',hypothesisId:'C',location:'app/store/store-client.tsx:intersection',message:'IntersectionObserver fired (attempt load more)',data:{isIntersecting:entries[0].isIntersecting,hasMore,loading,loadingMore,productsLen:products.length},timestamp:Date.now()}
          fetch('http://127.0.0.1:7243/ingest/87a82cd4-27bc-4a13-a28b-97d7121e94c1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}).catch(()=>{});
          try { navigator.sendBeacon?.('http://127.0.0.1:7243/ingest/87a82cd4-27bc-4a13-a28b-97d7121e94c1', JSON.stringify(payload)) } catch {}
          // #endregion agent log
          fetchProducts()
        }
      },
      { rootMargin: "200px" },
    )

    const target = loadMoreRef.current
    if (target) observer.observe(target)

    return () => {
      if (target) observer.unobserve(target)
      // #region agent log - observer cleanup (hypothesis C)
      const payloadCleanup = {sessionId:'debug-session',runId:'pre-fix',hypothesisId:'C',location:'app/store/store-client.tsx:observerEffect',message:'observer cleanup (unobserve)',data:{targetExists:!!target},timestamp:Date.now()}
      fetch('http://127.0.0.1:7243/ingest/87a82cd4-27bc-4a13-a28b-97d7121e94c1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payloadCleanup)}).catch(()=>{});
      try { navigator.sendBeacon?.('http://127.0.0.1:7243/ingest/87a82cd4-27bc-4a13-a28b-97d7121e94c1', JSON.stringify(payloadCleanup)) } catch {}
      // #endregion agent log
    }
  }, [hasMore, loading, loadingMore])

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories((prev) => {
      const next = prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId]
      // #region agent log - category toggle (hypothesis A/E)
      const payload = {sessionId:'debug-session',runId:'pre-fix',hypothesisId:'E',location:'app/store/store-client.tsx:handleCategoryToggle',message:'Category toggled',data:{categoryId,prevSelected:prev,nextSelected:next},timestamp:Date.now()}
      fetch('http://127.0.0.1:7243/ingest/87a82cd4-27bc-4a13-a28b-97d7121e94c1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}).catch(()=>{});
      try { navigator.sendBeacon?.('http://127.0.0.1:7243/ingest/87a82cd4-27bc-4a13-a28b-97d7121e94c1', JSON.stringify(payload)) } catch {}
      // #endregion agent log
      return next
    })
  }

  const handleBrandToggle = (brand: string) => {
    setSelectedBrands((prev) => (prev.includes(brand) ? prev.filter((name) => name !== brand) : [...prev, brand]))
  }

  useEffect(() => {
    // Keep local category state in sync with server-provided defaults (e.g. route change),
    // but never "fight" user interaction by re-applying defaults on every toggle.
    // Only update if the arrays are actually different (deep comparison)
    if (!arraysEqual(prevInitialSelectedCategoriesRef.current, initialSelectedCategories)) {
      // #region agent log - prop sync selected categories (hypothesis E)
      const payload = {sessionId:'debug-session',runId:'pre-fix',hypothesisId:'E',location:'app/store/store-client.tsx:syncInitialSelectedCategories',message:'initialSelectedCategories prop changed -> overwrite selectedCategories',data:{prevInitialSelectedCategories:prevInitialSelectedCategoriesRef.current,nextInitialSelectedCategories:initialSelectedCategories},timestamp:Date.now()}
      fetch('http://127.0.0.1:7243/ingest/87a82cd4-27bc-4a13-a28b-97d7121e94c1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}).catch(()=>{});
      try { navigator.sendBeacon?.('http://127.0.0.1:7243/ingest/87a82cd4-27bc-4a13-a28b-97d7121e94c1', JSON.stringify(payload)) } catch {}
      // #endregion agent log
      prevInitialSelectedCategoriesRef.current = initialSelectedCategories
      setSelectedCategories(initialSelectedCategories)
    }
  }, [initialSelectedCategories])

  // #region agent log - relay on category changes (hypothesis Z/E)
  useEffect(() => {
    const payload = {sessionId:'debug-session',runId:'pre-fix',hypothesisId:'Z',location:'app/store/store-client.tsx:relay-selectedCategories',message:'selectedCategories changed (relay)',data:{selectedCategories},timestamp:Date.now()}
    fetch('/api/agent-log',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}).catch(()=>{});
    try { navigator.sendBeacon?.('/api/agent-log', JSON.stringify(payload)) } catch {}
  }, [selectedCategories])
  // #endregion agent log

  // Sync search state with URL/prop changes (e.g., navbar search navigation)
  useEffect(() => {
    setSearch(initialSearch)
  }, [initialSearch])

  useEffect(() => {
    setProducts(initialProducts)
    setTotalCount(calculatedInitialTotal)
    setHasMore(initialProducts.length < calculatedInitialTotal)
    // #region agent log - prop sync initialProducts (hypothesis E/B)
    const payload = {sessionId:'debug-session',runId:'pre-fix',hypothesisId:'E',location:'app/store/store-client.tsx:syncInitialProducts',message:'initialProducts/calculatedInitialTotal changed -> overwrite products/hasMore',data:{initialProductsLen:initialProducts.length,calculatedInitialTotal,computedHasMore:initialProducts.length < calculatedInitialTotal},timestamp:Date.now()}
    fetch('http://127.0.0.1:7243/ingest/87a82cd4-27bc-4a13-a28b-97d7121e94c1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}).catch(()=>{});
    try { navigator.sendBeacon?.('http://127.0.0.1:7243/ingest/87a82cd4-27bc-4a13-a28b-97d7121e94c1', JSON.stringify(payload)) } catch {}
    // #endregion agent log
    setUiPriceBounds(calculatedPriceBounds)
    setPriceRange([calculatedPriceBounds.min, calculatedPriceBounds.max])
    setPriceTouched(false)
  }, [initialProducts, calculatedInitialTotal])

  const handleSearchSubmit = (searchValue: string) => {
    setSearch(searchValue)
    const params = new URLSearchParams(searchParams)
    if (searchValue) {
      params.set("search", searchValue)
    } else {
      params.delete("search")
    }
    router.replace(`/store?${params.toString()}`)
    // fetchProducts will be triggered by the useEffect when search state changes
  }

  const FiltersContent = () => (
    <div className="space-y-4">
      <div className="lg:hidden">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow p-4 space-y-3">
          <h2 className="text-lg font-bold text-[#2B2520]">البحث</h2>
          <SearchAutocomplete
            value={search}
            onChange={setSearch}
            onSubmit={handleSearchSubmit}
            placeholder="ابحث عن منتج..."
            mode={mode}
            className="w-full rounded-lg border border-[#D9D4C8] px-3 py-3 focus:border-[#E8A835] focus:outline-none text-base"
          />
        </div>
      </div>

      <Accordion type="multiple" defaultValue={["categories", "brands", "price"]} className="w-full">
        <AccordionItem value="categories" className="border-none">
          <FilterSection title="الفئات" accordion>
            <CategoryFilter tree={categoryTree} selected={selectedCategories} onToggle={handleCategoryToggle} />
          </FilterSection>
        </AccordionItem>

        <AccordionItem value="brands" className="border-none">
          <FilterSection title="العلامات" accordion>
            <div className="space-y-3">
              {brandOptions.map((brand) => (
                <label
                  key={brand}
                  className="flex items-center gap-3 text-sm text-[#2B2520] cursor-pointer py-2 min-h-[44px]"
                >
                  <input
                    type="checkbox"
                    checked={selectedBrands.includes(brand)}
                    onChange={() => handleBrandToggle(brand)}
                    className="size-5 cursor-pointer"
                  />
                  <span className="flex-1">{brand}</span>
                </label>
              ))}
            </div>
          </FilterSection>
        </AccordionItem>

        <AccordionItem value="price" className="border-none">
          <FilterSection title="السعر" accordion>
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2 text-sm text-[#8B6F47] px-1">
                <span>{uiPriceBounds.min.toFixed(0)} ج.م</span>
                <ChevronDown size={16} className="text-[#E8A835]" />
                <span>{uiPriceBounds.max.toFixed(0)} ج.م</span>
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs text-[#8B6F47] mb-2">من</label>
                  <input
                    type="number"
                    value={priceRange[0]}
                    min={uiPriceBounds.min}
                    max={priceRange[1]}
                    onChange={(e) => {
                      setPriceTouched(true)
                      setPriceRange([Number(e.target.value), priceRange[1]])
                    }}
                    className="w-full rounded-lg border border-[#D9D4C8] px-3 py-3 text-base focus:border-[#E8A835] focus:outline-none"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-[#8B6F47] mb-2">إلى</label>
                  <input
                    type="number"
                    value={priceRange[1]}
                    min={priceRange[0]}
                    max={uiPriceBounds.max}
                    onChange={(e) => {
                      setPriceTouched(true)
                      setPriceRange([priceRange[0], Number(e.target.value)])
                    }}
                    className="w-full rounded-lg border border-[#D9D4C8] px-3 py-3 text-base focus:border-[#E8A835] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </FilterSection>
        </AccordionItem>
      </Accordion>
    </div>
  )

  const activeFiltersCount =
    selectedCategories.length +
    selectedBrands.length +
    (priceTouched && (priceRange[0] !== uiPriceBounds.min || priceRange[1] !== uiPriceBounds.max) ? 1 : 0)

  return (
    <section className="py-6 md:py-12">
      <div className="max-w-[95%] mx-auto px-4">
        {/* Mobile Search Bar */}
        <div className="lg:hidden mb-6">
          <SearchAutocomplete
            value={search}
            onChange={setSearch}
            onSubmit={handleSearchSubmit}
            placeholder="ابحث عن منتج..."
            mode={mode}
            className="w-full rounded-xl border-2 border-[#D9D4C8] px-4 py-4 focus:border-[#E8A835] focus:outline-none text-base bg-white shadow-sm"
          />
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
                placeholder="ابحث عن منتج..."
                mode={mode}
                className="w-full rounded-lg border border-[#D9D4C8] px-3 py-2 focus:border-[#E8A835] focus:outline-none"
                showRecentSearches={false}
                showPopularSearches={false}
              />
            </div>

            <FilterSection title="الفئات">
              <CategoryFilter tree={categoryTree} selected={selectedCategories} onToggle={handleCategoryToggle} />
            </FilterSection>

            <FilterSection title="العلامات">
              <div className="space-y-2">
                {brandOptions.map((brand) => (
                  <label key={brand} className="flex items-center gap-2 text-sm text-[#2B2520] cursor-pointer py-1">
                    <input
                      type="checkbox"
                      checked={selectedBrands.includes(brand)}
                      onChange={() => handleBrandToggle(brand)}
                      className="cursor-pointer"
                    />
                    {brand}
                  </label>
                ))}
              </div>
            </FilterSection>

            <FilterSection title="السعر">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2 text-sm text-[#8B6F47]">
                  <span>{uiPriceBounds.min.toFixed(0)} ج.م</span>
                  <ChevronDown size={16} className="text-[#E8A835]" />
                  <span>{uiPriceBounds.max.toFixed(0)} ج.م</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={priceRange[0]}
                    min={uiPriceBounds.min}
                    max={priceRange[1]}
                    onChange={(e) => {
                      setPriceTouched(true)
                      setPriceRange([Number(e.target.value), priceRange[1]])
                    }}
                    className="w-full rounded-lg border border-[#D9D4C8] px-2 py-1 text-sm focus:border-[#E8A835] focus:outline-none"
                  />
                  <input
                    type="number"
                    value={priceRange[1]}
                    min={priceRange[0]}
                    max={uiPriceBounds.max}
                    onChange={(e) => {
                      setPriceTouched(true)
                      setPriceRange([priceRange[0], Number(e.target.value)])
                    }}
                    className="w-full rounded-lg border border-[#D9D4C8] px-2 py-1 text-sm focus:border-[#E8A835] focus:outline-none"
                  />
                </div>
              </div>
            </FilterSection>
          </aside>

          <div className="flex-1 space-y-6 md:space-y-8">
            {/* Header with Filters Button and Sort */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  <h2 className="text-xl md:text-2xl font-bold text-[#2B2520] mb-1">
                    {search.trim() ? "نتائج البحث" : ""}
                  </h2>
                  <p className="text-sm text-[#8B6F47]">
                    {loading && <span className="text-xs"> (يتم التحديث...)</span>}
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setFiltersOpen(true)}
                  className="lg:hidden relative border-2 border-[#E8A835] text-[#2B2520] hover:bg-[#E8A835]/10 min-h-[44px] px-4"
                >
                  <Filter className="size-5" />
                  <span className="hidden sm:inline">فلاتر</span>
                  {activeFiltersCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-[#C41E3A] text-white text-xs rounded-full size-5 flex items-center justify-center font-bold">
                      {activeFiltersCount}
                    </span>
                  )}
                </Button>
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1" />
                <div className="flex items-center gap-2 lg:gap-3">
                  <span className="text-sm text-[#8B6F47] whitespace-nowrap">ترتيب حسب</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="flex-1 lg:flex-none rounded-lg border-2 border-[#D9D4C8] px-3 py-2.5 text-sm focus:border-[#E8A835] focus:outline-none bg-white min-h-[44px]"
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
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {products.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    mode={mode}
                    priceHidden={mode === "b2b" ? priceHidden : false}
                    contactLabel={contactLabel}
                    contactUrl={contactUrl}
                    searchTerm={search}
                    position={index + 1}
                    searchAnalytics={searchAnalytics}
                  />
                ))}
              </div>
            </div>

            {loading && products.length === 0 && (
              <div className="rounded-2xl border border-dashed border-[#D9D4C8] p-12 text-center text-[#8B6F47]">
                جاري تحميل المنتجات...
              </div>
            )}

            {!loading && products.length === 0 && (
              <div className="rounded-2xl border border-dashed border-[#D9D4C8] p-12 text-center text-[#8B6F47]">
                لا توجد منتجات مطابقة حالياً.
              </div>
            )}

            {loadingMore && (
              <div className="text-center text-[#8B6F47] py-4">جاري تحميل المزيد...</div>
            )}

            <div ref={loadMoreRef} className="h-10" aria-hidden />
          </div>

          {/* Mobile Filters Drawer */}
          <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
            <SheetContent 
              side="bottom" 
              className="max-h-[85vh] bg-white rounded-t-3xl border-t-2 border-[#E8A835] [&>button]:hidden" 
              dir="rtl"
            >
              <SheetHeader className="text-right border-b border-[#D9D4C8] pb-4 mb-4">
                <div className="flex items-center justify-between">
                  <SheetTitle className="text-xl font-bold text-[#2B2520]">الفلاتر</SheetTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setFiltersOpen(false)}
                    className="h-9 w-9 -mr-2"
                  >
                    <X className="size-5" />
                  </Button>
                </div>
                {activeFiltersCount > 0 && (
                  <p className="text-sm text-[#8B6F47] mt-2">
                    {activeFiltersCount} {activeFiltersCount === 1 ? "فلتر نشط" : "فلاتر نشطة"}
                  </p>
                )}
              </SheetHeader>
              <div className="px-4 pb-6 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 100px)' }}>
                <FiltersContent />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </section>
  )
}

function FilterSection({
  title,
  children,
  accordion,
}: {
  title: string
  children: React.ReactNode
  accordion?: boolean
}) {
  if (accordion) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow p-4">
        <AccordionTrigger className="text-lg font-bold text-[#2B2520] hover:no-underline py-2">
          {title}
        </AccordionTrigger>
        <AccordionContent className="pt-3">{children}</AccordionContent>
      </div>
    )
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow p-4 space-y-3">
      <h3 className="text-lg font-bold text-[#2B2520]">{title}</h3>
      {children}
    </div>
  )
}

function CategoryFilter({
  tree,
  selected,
  onToggle,
}: {
  tree: CategoryNode[]
  selected: string[]
  onToggle: (id: string) => void
}) {
  return (
    <div className="space-y-2">
      {tree.map((node) => (
        <CategoryNodeItem key={node.id} node={node} depth={0} selected={selected} onToggle={onToggle} />
      ))}
    </div>
  )
}

function CategoryNodeItem({
  node,
  depth,
  selected,
  onToggle,
}: {
  node: CategoryNode
  depth: number
  selected: string[]
  onToggle: (id: string) => void
}) {
  return (
    <div className="space-y-1" style={{ marginInlineStart: depth * 16 }}>
      <label className="flex items-center gap-3 text-sm text-[#2B2520] cursor-pointer py-2 min-h-[44px]">
        <input
          type="checkbox"
          checked={selected.includes(node.id)}
          onChange={() => onToggle(node.id)}
          className="accent-[#E8A835] size-5 cursor-pointer"
        />
        <span className="flex-1">{node.name_ar}</span>
      </label>
      {node.children.length > 0 && (
        <div className="space-y-1">
          {node.children.map((child) => (
            <CategoryNodeItem key={child.id} node={child} depth={depth + 1} selected={selected} onToggle={onToggle} />
          ))}
        </div>
      )}
    </div>
  )
}

function ProductCard({
  product,
  mode = 'b2c',
  priceHidden = false,
  contactLabel = 'تواصل مع المبيعات',
  contactUrl = '/contact',
  searchTerm,
  position,
  searchAnalytics,
}: {
  product: ProductRecord
  mode?: 'b2c' | 'b2b'
  priceHidden?: boolean
  contactLabel?: string
  contactUrl?: string
  searchTerm?: string
  position?: number
  searchAnalytics?: SearchAnalytics | null
}) {
  const primaryImage =
    product.product_images?.find((image) => image.is_primary)?.image_url ||
    product.product_images?.[0]?.image_url ||
    null

  const isOutOfStock =
    (product.stock ?? 0) <= 0 &&
    (product.product_variants?.length
      ? product.product_variants.every((variant) => (variant.stock ?? 0) <= 0)
      : true)

  const discount =
    product.price !== null && product.original_price && product.original_price > product.price
      ? Math.round(
          ((product.original_price - product.price) / product.original_price) * 100,
        )
      : 0

  // Hide prices for B2B products when b2b_price_hidden is true, or when price is NULL (from DB migration)
  const hidePrices = (product.is_b2b && product.b2b_price_hidden) || product.price === null
  const productLink = mode === 'b2b' ? `/b2b/product/${product.id}` : `/product/${product.id}`
  const variantBadges = useMemo(() => {
    const variants = product.product_variants ?? []
    if (variants.length === 0) return []

    const labelFor = (variant: ProductVariant) => {
      if (typeof variant.weight === 'number' && Number.isFinite(variant.weight)) return `${variant.weight} جم`
      if (variant.size) return variant.size
      if (variant.variant_type) return variant.variant_type
      return 'متغير'
    }

    const labels = variants.map(labelFor).filter(Boolean)
    const unique = Array.from(new Set(labels))
    return unique.slice(0, 4)
  }, [product.product_variants])

  const handleProductClick = () => {
    if (searchAnalytics?.queryId && position) {
      searchService.trackSearchClick(searchAnalytics.queryId, product.id, position)
    }
  }

  return (
    <Link
      href={productLink}
      onClick={handleProductClick}
      className="
        bg-white
        rounded-xl
        sm:rounded-2xl
        overflow-hidden
        shadow
        hover:shadow-lg
        transition
        border border-[#E8E2D1]
        flex flex-col
        group
        min-h-[322px]
        sm:min-h-[380px]
        "
    >
      <div className="
        relative
        h-40 sm:h-64
        bg-[#F5F1E8]
        overflow-hidden
        ">
        {primaryImage ? (
          <img
            src={primaryImage}
            alt={product.name_ar}
            className="
              w-full h-full
              object-contain
              bg-white
              transition-transform
              duration-300
              group-hover:scale-105
            "
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl sm:text-5xl">🌶️</div>
        )}
        {product.has_tax && (
          <div className="
            absolute top-0 left-0 right-0
            bg-[#C41E3A] text-white
            text-center
            px-2 py-1
            text-[10px] sm:text-xs
            font-bold
            z-10
            shadow-sm
          ">
            خاضع للضريبة. 14%
          </div>
        )}
        {discount > 0 && (
          <span className="
            absolute top-2 sm:top-4 left-2 sm:left-4
            bg-[#C41E3A] text-white
            px-2.5 sm:px-3 py-0.5 sm:py-1
            rounded-full
            text-xs sm:text-sm
            font-bold
            z-10
          ">
            -{discount}%
          </span>
        )}
        {isOutOfStock && (
          <span className="
            absolute top-2 sm:top-4 right-2 sm:right-4
            bg-gray-900/80 text-white
            px-2.5 sm:px-3 py-0.5 sm:py-1
            rounded-full
            text-xs sm:text-sm
            font-bold
            z-10
          ">
            غير متوفر
          </span>
        )}
      </div>
      <div className="p-2 sm:p-4 flex flex-col flex-1">
        {mode === 'b2b' ? (
          <span className="
            inline-flex items-center gap-1 sm:gap-2
            px-2 sm:px-3 py-0.5 sm:py-1 mb-1 sm:mb-2
            rounded-full
            bg-[#2B2520]/5 text-[#2B2520]
            text-[10px] sm:text-xs font-bold
          ">
            منتجات الجمله
          </span>
        ) : product.is_featured ? (
          <span className="
            inline-flex items-center gap-1 sm:gap-2
            px-2 sm:px-3 py-0.5 sm:py-1 mb-1 sm:mb-2
            rounded-full
            bg-[#E8A835]/10 text-[#E8A835]
            text-[10px] sm:text-xs font-bold
          ">
            ⭐ منتج مميز
          </span>
        ) : null}
        <p className="
          text-[10px] sm:text-xs
          text-[#E8A835]
          font-semibold
          uppercase
          mb-1 sm:mb-2
        ">
          {product.brand}
        </p>
        <h3 className="
          text-base sm:text-lg
          font-bold
          text-[#2B2520]
          mb-1 sm:mb-2
          line-clamp-2
          group-hover:text-[#E8A835]
          transition-colors
        ">
          <SearchHighlighter text={product.name_ar} searchTerm={searchTerm ?? ''} />
        </h3>
        {(product.product_variants?.length ?? 0) > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {variantBadges.length > 0 ? (
              variantBadges.map((label) => (
                <Badge
                  key={label}
                  variant="secondary"
                  className="bg-[#F5F1E8] text-[#2B2520] border-[#E8E2D1] text-[10px] sm:text-xs"
                >
                  {label}
                </Badge>
              ))
            ) : (
              <Badge
                variant="secondary"
                className="bg-[#F5F1E8] text-[#2B2520] border-[#E8E2D1] text-[10px] sm:text-xs"
              >
                متوفر بأحجام متعددة
              </Badge>
            )}
          </div>
        )}
        <p className="text-xs sm:text-sm text-[#8B6F47] line-clamp-2 mb-2 sm:mb-4">
          <SearchHighlighter text={product.description_ar || ''} searchTerm={searchTerm ?? ''} />
        </p>
        <div className="flex items-center gap-1 sm:gap-2 mb-2 sm:mb-4">
          <div className="flex">
            {Array.from({ length: 5 }).map((_, index) => (
              <Star
                key={index}
                size={12}
                className={
                  index < Math.round(product.rating || 0) ? 'text-[#E8A835] fill-[#E8A835]' : 'text-gray-300'
                }
              />
            ))}
          </div>
          <span className="text-[10px] sm:text-xs text-[#8B6F47]">
            ({product.reviews_count || 0})
          </span>
        </div>
        <div className="mb-2 sm:mb-4">
          <div className="flex items-baseline gap-1.5 sm:gap-2">
            {hidePrices ? (
              <span className="text-xs sm:text-base font-semibold text-[#E8A835]">{contactLabel}</span>
            ) : product.price !== null ? (
              <>
                <span className="text-lg sm:text-2xl font-bold text-[#C41E3A]">
                  {product.price.toFixed(2)} ج.م
                </span>
                {product.original_price && product.original_price > product.price && (
                  <span className="text-xs sm:text-sm text-gray-400 line-through">
                    {product.original_price.toFixed(2)} ج.م
                  </span>
                )}
              </>
            ) : (
              <span className="text-xs sm:text-base font-semibold text-[#E8A835]">{contactLabel}</span>
            )}
          </div>
          {product.has_tax && !hidePrices && (
            <p className="text-[10px] sm:text-xs text-[#C41E3A] font-medium mt-1">
              خاضع للضريبة. 14%
            </p>
          )}
        </div>
        {hidePrices ? (
          <Link
            href={contactUrl}
            className="
              mt-auto
              inline-flex items-center justify-center
              px-3 sm:px-4 py-1.5 sm:py-2
              rounded-md sm:rounded-lg
              border border-[#E8A835]
              text-[11px] sm:text-base
              text-[#E8A835]
              font-semibold
              hover:bg-[#FFF8ED]
              transition
            "
          >
            {contactLabel}
          </Link>
        ) : (
          <AddToCartButton
            productId={product.id}
            disabled={isOutOfStock}
            className="mt-auto h-8 sm:h-10 px-2 sm:px-4 text-xs sm:text-base"
          >
            {isOutOfStock ? 'سيعود قريباً' : 'أضف إلى السلة'}
          </AddToCartButton>
        )}
      </div>
    </Link>
  )
}


function buildCategoryTree(categories: CategoryRecord[]): CategoryNode[] {
  const map = new Map<string, CategoryNode>()
  categories.forEach((category) => {
    map.set(category.id, { ...category, children: [] })
  })

  const roots: CategoryNode[] = []
  const sorted = [...map.values()].sort((a, b) => {
    const orderA = a.sort_order ?? 0
    const orderB = b.sort_order ?? 0
    if (orderA === orderB) {
      return a.name_ar.localeCompare(b.name_ar, "ar")
    }
    return orderA - orderB
  })

  sorted.forEach((node) => {
    if (node.parent_id && map.has(node.parent_id)) {
      map.get(node.parent_id)!.children.push(node)
    } else {
      roots.push(node)
    }
  })
  return roots
}

function buildDescendantMap(tree: CategoryNode[]) {
  const map = new Map<string, Set<string>>()

  const traverse = (node: CategoryNode): Set<string> => {
    const childrenSet = new Set<string>()
    node.children.forEach((child) => {
      childrenSet.add(child.id)
      const childDesc = traverse(child)
      childDesc.forEach((id) => childrenSet.add(id))
    })
    map.set(node.id, childrenSet)
    return childrenSet
  }

  tree.forEach((root) => traverse(root))
  return map
}

function arraysEqual<T>(a: T[], b: T[]) {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false
  }
  return true
}

