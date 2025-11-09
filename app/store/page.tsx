"use client"

import { useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Star, ChevronDown } from "lucide-react"

const allProducts = [
  // Tatbeelah products
  {
    id: 1,
    name: "الكمون الكامل",
    brand: "تتبيلة",
    category: "whole",
    type: "spices",
    price: 45,
    originalPrice: 60,
    rating: 4.8,
    reviews: 234,
  },
  {
    id: 2,
    name: "الفلفل الأحمر المطحون",
    brand: "تتبيلة",
    category: "ground",
    type: "spices",
    price: 55,
    originalPrice: 75,
    rating: 4.7,
    reviews: 189,
  },
  {
    id: 3,
    name: "خلطة الكشري",
    brand: "تتبيلة",
    category: "blends",
    type: "blends",
    price: 30,
    originalPrice: 45,
    rating: 4.9,
    reviews: 312,
  },
  {
    id: 4,
    name: "خلطة الفول",
    brand: "تتبيلة",
    category: "blends",
    type: "blends",
    price: 25,
    originalPrice: 40,
    rating: 4.8,
    reviews: 267,
  },
  {
    id: 5,
    name: "زعتر مصري",
    brand: "تتبيلة",
    category: "herbs",
    type: "spices",
    price: 50,
    originalPrice: 70,
    rating: 4.9,
    reviews: 198,
  },
  {
    id: 6,
    name: "صلصة الطماطم والتوابل",
    brand: "تتبيلة",
    category: "sauces",
    type: "sauces",
    price: 35,
    originalPrice: 50,
    rating: 4.6,
    reviews: 145,
  },

  // Tabel products
  {
    id: 7,
    name: "خلطة الشاورما",
    brand: "تابل",
    category: "blends",
    type: "blends",
    price: 40,
    originalPrice: 65,
    rating: 4.9,
    reviews: 278,
  },
  {
    id: 8,
    name: "الكركم المطحون",
    brand: "تابل",
    category: "ground",
    type: "spices",
    price: 60,
    originalPrice: 85,
    rating: 4.7,
    reviews: 156,
  },
  {
    id: 9,
    name: "خلطة الدجاج",
    brand: "تابل",
    category: "blends",
    type: "blends",
    price: 35,
    originalPrice: 55,
    rating: 4.8,
    reviews: 289,
  },
  {
    id: 10,
    name: "الثوم المطحون",
    brand: "تابل",
    category: "ground",
    type: "spices",
    price: 40,
    originalPrice: 60,
    rating: 4.8,
    reviews: 201,
  },
  {
    id: 11,
    name: "خلطة الشوربة",
    brand: "تابل",
    category: "blends",
    type: "blends",
    price: 32,
    originalPrice: 48,
    rating: 4.7,
    reviews: 134,
  },
  {
    id: 12,
    name: "صلصة حارة",
    brand: "تابل",
    category: "sauces",
    type: "sauces",
    price: 45,
    originalPrice: 65,
    rating: 4.9,
    reviews: 167,
  },

  {
    id: 13,
    name: "بذور الكمون الكامل",
    brand: "تتبيلة",
    category: "whole",
    type: "spices",
    price: 50,
    originalPrice: 70,
    rating: 4.8,
    reviews: 223,
  },
  {
    id: 14,
    name: "خلطة الكبة",
    brand: "تابل",
    category: "blends",
    type: "blends",
    price: 38,
    originalPrice: 60,
    rating: 4.9,
    reviews: 245,
  },

  {
    id: 15,
    name: "خلطة اللحم",
    brand: "تتبيلة",
    category: "blends",
    type: "blends",
    price: 48,
    originalPrice: 68,
    rating: 4.9,
    reviews: 312,
  },
  {
    id: 16,
    name: "دجاج مقلي حار",
    brand: "تتبيلة",
    category: "blends",
    type: "blends",
    price: 42,
    originalPrice: 62,
    rating: 4.8,
    reviews: 289,
  },
  {
    id: 17,
    name: "خلطة الدجاج كاري",
    brand: "تتبيلة",
    category: "blends",
    type: "blends",
    price: 46,
    originalPrice: 66,
    rating: 4.8,
    reviews: 267,
  },
  {
    id: 18,
    name: "دجاج مقلى",
    brand: "تتبيلة",
    category: "blends",
    type: "blends",
    price: 44,
    originalPrice: 64,
    rating: 4.9,
    reviews: 301,
  },
  {
    id: 19,
    name: "دجاج أعشاب",
    brand: "تتبيلة",
    category: "herbs",
    type: "spices",
    price: 50,
    originalPrice: 70,
    rating: 4.9,
    reviews: 278,
  },
  {
    id: 20,
    name: "دجاج تاندوري",
    brand: "تتبيلة",
    category: "blends",
    type: "blends",
    price: 52,
    originalPrice: 72,
    rating: 4.9,
    reviews: 295,
  },
  {
    id: 21,
    name: "بودرة مرقة اللحم البقري",
    brand: "تابل",
    category: "blends",
    type: "blends",
    price: 39,
    originalPrice: 59,
    rating: 4.8,
    reviews: 234,
  },
  {
    id: 22,
    name: "تتبيلة الدجاج",
    brand: "تابل",
    category: "blends",
    type: "blends",
    price: 41,
    originalPrice: 61,
    rating: 4.8,
    reviews: 256,
  },
]

interface FilterState {
  brand: string[]
  type: string[]
  priceRange: [number, number]
  sortBy: string
}

const ProductCard = ({ product }) => {
  const getProductImage = (productId) => {
    const imageMap = {
      15: "/tatbeelah-meat-spices.jpg",
      16: "/tatbeelah-spicy-fried-chicken.jpg",
      17: "/tatbeelah-chicken-curry.jpg",
      18: "/tatbeelah-fried-chicken.jpg",
      19: "/tatbeelah-chicken-herbs.jpg",
      20: "/tatbeelah-chicken-tandoori.jpg",
      21: "/tabel-beef-stock-powder.jpg",
      22: "/tabel-chicken-seasoning.jpg",
    }
    return imageMap[productId] || null
  }

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all group border border-[#E8E2D1]">
      <div className="relative overflow-hidden bg-gray-100 h-64">
        {getProductImage(product.id) ? (
          <img
            src={getProductImage(product.id) || "/placeholder.svg"}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#F5F1E8] to-[#E8E2D1]">
            <span className="text-4xl">🌶️</span>
          </div>
        )}
        <div className="absolute top-4 left-4 bg-[#C41E3A] text-white px-3 py-1 rounded-full text-sm font-bold">
          -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
        </div>
      </div>

      <div className="p-4">
        <p className="text-xs text-[#E8A835] font-semibold uppercase mb-2">{product.brand}</p>
        <h3 className="text-lg font-bold text-[#2B2520] mb-3 line-clamp-2">{product.name}</h3>

        <div className="flex items-center gap-2 mb-4">
          <div className="flex">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={14}
                className={i < Math.floor(product.rating) ? "fill-[#E8A835] text-[#E8A835]" : "text-gray-300"}
              />
            ))}
          </div>
          <span className="text-xs text-[#8B6F47]">({product.reviews})</span>
        </div>

        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-2xl font-bold text-[#C41E3A]">{product.price} ج.م</span>
          <span className="text-sm text-gray-400 line-through">{product.originalPrice} ج.م</span>
        </div>

        <button className="w-full py-2 bg-[#E8A835] text-white rounded-lg font-semibold hover:bg-[#D9941E] transition-colors">
          أضف إلى السلة
        </button>
      </div>
    </div>
  )
}

export default function StorePage() {
  const searchParams = useSearchParams()
  const [filters, setFilters] = useState<FilterState>({
    brand: [],
    type: [],
    priceRange: [0, 100],
    sortBy: "popularity",
  })

  const [showFilters, setShowFilters] = useState(false)
  const searchQuery = (searchParams.get("search") || "").trim().toLowerCase()

  const filteredProducts = useMemo(() => {
    let result = allProducts

    if (searchQuery) {
      result = result.filter((product) => {
        const name = product.name?.toLowerCase() || ""
        const brand = product.brand?.toLowerCase() || ""
        return name.includes(searchQuery) || brand.includes(searchQuery)
      })
    }

    // Apply brand filter
    if (filters.brand.length > 0) {
      result = result.filter((p) => filters.brand.includes(p.brand))
    }

    // Apply type filter
    if (filters.type.length > 0) {
      result = result.filter((p) => filters.type.includes(p.type))
    }

    // Apply price filter
    result = result.filter((p) => p.price >= filters.priceRange[0] && p.price <= filters.priceRange[1])

    // Apply sorting
    if (filters.sortBy === "popularity") {
      result = [...result].sort((a, b) => b.reviews - a.reviews)
    } else if (filters.sortBy === "price-low") {
      result = [...result].sort((a, b) => a.price - b.price)
    } else if (filters.sortBy === "price-high") {
      result = [...result].sort((a, b) => b.price - a.price)
    } else if (filters.sortBy === "rating") {
      result = [...result].sort((a, b) => b.rating - a.rating)
    }

    return result
  }, [filters, searchQuery])

  const toggleBrand = (brand: string) => {
    setFilters((prev) => ({
      ...prev,
      brand: prev.brand.includes(brand) ? prev.brand.filter((b) => b !== brand) : [...prev.brand, brand],
    }))
  }

  const toggleType = (type: string) => {
    setFilters((prev) => ({
      ...prev,
      type: prev.type.includes(type) ? prev.type.filter((t) => t !== type) : [...prev.type, type],
    }))
  }

  const resetFilters = () => {
    setFilters({
      brand: [],
      type: [],
      priceRange: [0, 100],
      sortBy: "popularity",
    })
  }

  const typeLabels = {
    spices: "التوابل",
    blends: "الخلطات",
    sauces: "الصوصات",
  }

  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      {/* Header */}
      <section className="bg-[#F5F1E8] py-8">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold text-[#2B2520] mb-2">متجرنا</h1>
          <p className="text-[#8B6F47]">عرض المنتجات ({filteredProducts.length} منتج)</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar Filters */}
          <div className={`${showFilters ? "block" : "hidden"} lg:block lg:col-span-1`}>
            <div className="sticky top-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-[#2B2520]">التصفية</h2>
                <button onClick={resetFilters} className="text-sm text-[#E8A835] hover:underline">
                  إعادة تعيين
                </button>
              </div>

              {/* Brand Filter */}
              <div className="mb-6">
                <h3 className="font-semibold text-[#2B2520] mb-4">العلامة التجارية</h3>
                <div className="space-y-3">
                  {["تتبيلة", "تابل"].map((brand) => (
                    <label key={brand} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.brand.includes(brand)}
                        onChange={() => toggleBrand(brand)}
                        className="w-4 h-4 accent-[#E8A835]"
                      />
                      <span className="text-[#2B2520]">{brand}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Type Filter */}
              <div className="mb-6">
                <h3 className="font-semibold text-[#2B2520] mb-4">نوع المنتج</h3>
                <div className="space-y-3">
                  {Object.entries(typeLabels).map(([key, label]) => (
                    <label key={key} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.type.includes(key)}
                        onChange={() => toggleType(key)}
                        className="w-4 h-4 accent-[#E8A835]"
                      />
                      <span className="text-[#2B2520]">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Filter */}
              <div className="mb-6">
                <h3 className="font-semibold text-[#2B2520] mb-4">نطاق السعر</h3>
                <div className="space-y-3">
                  <div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={filters.priceRange[1]}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          priceRange: [prev.priceRange[0], Number.parseInt(e.target.value)],
                        }))
                      }
                      className="w-full accent-[#E8A835]"
                    />
                    <div className="flex justify-between text-sm text-[#8B6F47] mt-2">
                      <span>{filters.priceRange[0]} ج.م</span>
                      <span>{filters.priceRange[1]} ج.م</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Clear Filters */}
              {(filters.brand.length > 0 || filters.type.length > 0) && (
                <button
                  onClick={() => setShowFilters(false)}
                  className="w-full py-2 bg-[#F5F1E8] text-[#2B2520] rounded-lg font-semibold hover:bg-[#E8E2D1] transition-colors lg:hidden"
                >
                  تطبيق الفلاتر
                </button>
              )}
            </div>
          </div>

          {/* Products Grid */}
          <div className="lg:col-span-3">
            {/* Top Controls */}
            <div className="flex items-center justify-between mb-8">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden px-4 py-2 border border-[#E8A835] text-[#E8A835] rounded-lg font-semibold hover:bg-[#F5F1E8] transition-colors flex items-center gap-2"
              >
                التصفية
                <ChevronDown size={18} />
              </button>

              <div className="flex items-center gap-4">
                <span className="text-[#8B6F47]">ترتيب حسب:</span>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters((prev) => ({ ...prev, sortBy: e.target.value }))}
                  className="px-4 py-2 border border-[#D9D4C8] rounded-lg text-[#2B2520] focus:outline-none focus:border-[#E8A835]"
                >
                  <option value="popularity">الشهرة</option>
                  <option value="price-low">السعر: الأقل أولاً</option>
                  <option value="price-high">السعر: الأعلى أولاً</option>
                  <option value="rating">التقييم</option>
                </select>
              </div>
            </div>

            {/* Products Grid */}
            {filteredProducts.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-xl text-[#8B6F47] mb-4">لم يتم العثور على منتجات مطابقة</p>
                <button
                  onClick={resetFilters}
                  className="px-6 py-2 bg-[#E8A835] text-white rounded-lg font-semibold hover:bg-[#D9941E] transition-colors"
                >
                  إعادة تعيين الفلاتر
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
