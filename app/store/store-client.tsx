"use client"

import { useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Star, ChevronDown } from "lucide-react"

import { AddToCartButton } from "@/components/add-to-cart-button"

type ProductImage = {
  image_url: string
  is_primary: boolean
}

type ProductVariant = {
  stock: number
}

type ProductRecord = {
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
  category_id: string | null
  created_at?: string | null
  is_featured?: boolean | null
  product_images: ProductImage[] | null
  product_variants: ProductVariant[] | null
}

type CategoryRecord = {
  id: string
  name_ar: string
  parent_id: string | null
  slug: string
  sort_order: number | null
}

type CategoryNode = CategoryRecord & { children: CategoryNode[] }

interface StoreClientProps {
  initialProducts: ProductRecord[]
  categories: CategoryRecord[]
  initialSearch?: string
}

export function StoreClient({ initialProducts, categories, initialSearch = "" }: StoreClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(initialSearch)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [priceRange, setPriceRange] = useState<[number, number]>(() => {
    const minPrice = Math.min(...initialProducts.map((product) => Number(product.price) || 0), 0)
    const maxPrice = Math.max(...initialProducts.map((product) => Number(product.price) || 0), 100)
    return [minPrice, maxPrice]
  })
  const [sortBy, setSortBy] = useState("popularity")

  const categoryTree = useMemo(() => buildCategoryTree(categories), [categories])
  const categoryDescendants = useMemo(() => buildDescendantMap(categoryTree), [categoryTree])

  const brandOptions = useMemo(() => {
    const set = new Set(initialProducts.map((product) => product.brand).filter(Boolean))
    return Array.from(set)
  }, [initialProducts])

  const priceBounds = useMemo(() => {
    const min = Math.min(...initialProducts.map((product) => Number(product.price) || 0), 0)
    const max = Math.max(...initialProducts.map((product) => Number(product.price) || 0), 100)
    return { min, max }
  }, [initialProducts])

  const filteredProducts = useMemo(() => {
    let result = [...initialProducts]

    const query = search.trim().toLowerCase()
    if (query) {
      result = result.filter((product) => {
        const name = product.name_ar?.toLowerCase() || ""
        const brand = product.brand?.toLowerCase() || ""
        const description = product.description_ar?.toLowerCase() || ""
        return name.includes(query) || brand.includes(query) || description.includes(query)
      })
    }

    if (selectedCategories.length > 0) {
      const allowed = new Set<string>()
      selectedCategories.forEach((categoryId) => {
        allowed.add(categoryId)
        categoryDescendants.get(categoryId)?.forEach((childId) => allowed.add(childId))
      })
      result = result.filter((product) => (product.category_id ? allowed.has(product.category_id) : false))
    }

    if (selectedBrands.length > 0) {
      result = result.filter((product) => selectedBrands.includes(product.brand))
    }

    result = result.filter((product) => product.price >= priceRange[0] && product.price <= priceRange[1])

    switch (sortBy) {
      case "price-low":
        result.sort((a, b) => a.price - b.price)
        break
      case "price-high":
        result.sort((a, b) => b.price - a.price)
        break
      case "newest":
        result.sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""))
        break
      default:
        result.sort((a, b) => (b.reviews_count || 0) - (a.reviews_count || 0))
        break
    }

    return result
  }, [initialProducts, search, selectedCategories, selectedBrands, priceRange, sortBy, categoryDescendants])

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId],
    )
  }

  const handleBrandToggle = (brand: string) => {
    setSelectedBrands((prev) => (prev.includes(brand) ? prev.filter((name) => name !== brand) : [...prev, brand]))
  }

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const params = new URLSearchParams(searchParams)
    if (search) {
      params.set("search", search)
    } else {
      params.delete("search")
    }
    router.replace(`/store?${params.toString()}`)
  }

  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col lg:flex-row gap-10">
          <aside className="lg:w-72 flex-shrink-0 space-y-6">
            <form onSubmit={handleSearchSubmit}>
              <div className="bg-white rounded-2xl shadow p-4 space-y-3">
                <h2 className="text-lg font-bold text-[#2B2520]">البحث</h2>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ابحث عن منتج..."
                  className="w-full rounded-lg border border-[#D9D4C8] px-3 py-2 focus:border-[#E8A835] focus:outline-none"
                />
                <button
                  type="submit"
                  className="w-full px-4 py-2 rounded-lg bg-[#E8A835] text-white font-semibold hover:bg-[#D9941E]"
                >
                  بحث
                </button>
              </div>
            </form>

            <FilterSection title="الفئات">
              <CategoryFilter tree={categoryTree} selected={selectedCategories} onToggle={handleCategoryToggle} />
            </FilterSection>

            <FilterSection title="العلامات">
              <div className="space-y-2">
                {brandOptions.map((brand) => (
                  <label key={brand} className="flex items-center gap-2 text-sm text-[#2B2520]">
                    <input
                      type="checkbox"
                      checked={selectedBrands.includes(brand)}
                      onChange={() => handleBrandToggle(brand)}
                      className="accent-[#E8A835]"
                    />
                    {brand}
                  </label>
                ))}
              </div>
            </FilterSection>

            <FilterSection title="السعر">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-[#8B6F47]">
                  <span>{priceBounds.min.toFixed(0)} ج.م</span>
                  <ChevronDown size={16} className="text-[#E8A835]" />
                  <span>{priceBounds.max.toFixed(0)} ج.م</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={priceRange[0]}
                    min={priceBounds.min}
                    max={priceRange[1]}
                    onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                    className="w-full rounded-lg border border-[#D9D4C8] px-2 py-1 text-sm"
                  />
                  <input
                    type="number"
                    value={priceRange[1]}
                    min={priceRange[0]}
                    max={priceBounds.max}
                    onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                    className="w-full rounded-lg border border-[#D9D4C8] px-2 py-1 text-sm"
                  />
                </div>
              </div>
            </FilterSection>
          </aside>

          <div className="flex-1 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-sm text-[#8B6F47]">عدد النتائج: {filteredProducts.length}</p>
                <h2 className="text-2xl font-bold text-[#2B2520]">اكتشف منتجاتنا</h2>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-[#8B6F47]">ترتيب حسب</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="rounded-lg border border-[#D9D4C8] px-3 py-2 text-sm focus:border-[#E8A835]"
                >
                  <option value="popularity">الأكثر شهرة</option>
                  <option value="price-low">السعر (تصاعدي)</option>
                  <option value="price-high">السعر (تنازلي)</option>
                  <option value="newest">الأحدث</option>
                </select>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="rounded-2xl border border-dashed border-[#D9D4C8] p-12 text-center text-[#8B6F47]">
                لا توجد منتجات مطابقة حالياً.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow p-4 space-y-3">
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
      <label className="flex items-center gap-2 text-sm text-[#2B2520]">
        <input
          type="checkbox"
          checked={selected.includes(node.id)}
          onChange={() => onToggle(node.id)}
          className="accent-[#E8A835]"
        />
        {node.name_ar}
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

function ProductCard({ product }: { product: ProductRecord }) {
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
    product.original_price && product.original_price > product.price
      ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
      : 0

  return (
    <Link
      href={`/product/${product.id}`}
      className="bg-white rounded-2xl overflow-hidden shadow hover:shadow-lg transition border border-[#E8E2D1] flex flex-col group"
    >
      <div className="relative h-64 bg-[#F5F1E8] overflow-hidden">
        {primaryImage ? (
          <img
            src={primaryImage}
            alt={product.name_ar}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300 bg-white"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">🌶️</div>
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
      </div>
      <div className="p-4 flex flex-col flex-1">
        {product.is_featured ? (
          <span className="inline-flex items-center gap-2 px-3 py-1 mb-2 rounded-full bg-[#E8A835]/10 text-[#E8A835] text-xs font-bold">
            ⭐ منتج مميز
          </span>
        ) : null}
        <p className="text-xs text-[#E8A835] font-semibold uppercase mb-2">{product.brand}</p>
        <h3 className="text-lg font-bold text-[#2B2520] mb-2 line-clamp-2 group-hover:text-[#E8A835] transition-colors">
          {product.name_ar}
        </h3>
        <p className="text-sm text-[#8B6F47] line-clamp-2 mb-4">{product.description_ar}</p>
        <div className="flex items-center gap-2 mb-4">
          <div className="flex">
            {Array.from({ length: 5 }).map((_, index) => (
              <Star
                key={index}
                size={14}
                className={
                  index < Math.round(product.rating || 0) ? "text-[#E8A835] fill-[#E8A835]" : "text-gray-300"
                }
              />
            ))}
          </div>
          <span className="text-xs text-[#8B6F47]">({product.reviews_count || 0})</span>
        </div>
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-2xl font-bold text-[#C41E3A]">{product.price.toFixed(2)} ج.م</span>
          {product.original_price && product.original_price > product.price && (
            <span className="text-sm text-gray-400 line-through">{product.original_price.toFixed(2)} ج.م</span>
          )}
        </div>
        <AddToCartButton 
          productId={product.id} 
          disabled={isOutOfStock}
          className="mt-auto"
        >
          {isOutOfStock ? "سيعود قريباً" : "أضف إلى السلة"}
        </AddToCartButton>
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

