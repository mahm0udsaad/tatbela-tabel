"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Star, ShoppingCart, Heart } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase"

interface Product {
  id: string
  name_ar: string
  description_ar: string
  brand: string
  price: number
  original_price: number
  rating: number
  reviews_count: number
  image_url: string
}

export default function ProductDetailPage() {
  const params = useParams()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [isFavorite, setIsFavorite] = useState(false)
  const supabase = getSupabaseClient()

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data, error } = await supabase.from("products").select("*").eq("id", params.id).single()

        if (error) throw error
        setProduct(data)
      } catch (error) {
        console.error("خطأ في تحميل المنتج:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [params.id, supabase])

  if (loading) {
    return (
      <main className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <p className="text-xl text-[#8B6F47]">جاري تحميل المنتج...</p>
        </div>
        <Footer />
      </main>
    )
  }

  if (!product) {
    return (
      <main className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <p className="text-xl text-[#8B6F47]">لم يتم العثور على المنتج</p>
        </div>
        <Footer />
      </main>
    )
  }

  const discountPercent = Math.round(((product.original_price - product.price) / product.original_price) * 100)

  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-12">
          {/* Product Image */}
          <div className="flex items-center justify-center">
            <div className="relative w-full aspect-square bg-[#F5F1E8] rounded-xl overflow-hidden">
              {product.image_url ? (
                <img
                  src={product.image_url || "/placeholder.svg"}
                  alt={product.name_ar}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-6xl">🌶️</span>
                </div>
              )}
              {discountPercent > 0 && (
                <div className="absolute top-4 right-4 bg-[#C41E3A] text-white px-4 py-2 rounded-full font-bold">
                  -{discountPercent}%
                </div>
              )}
            </div>
          </div>

          {/* Product Details */}
          <div className="flex flex-col justify-center">
            <p className="text-sm text-[#E8A835] font-bold uppercase mb-3">{product.brand}</p>
            <h1 className="text-4xl font-bold text-[#2B2520] mb-6">{product.name_ar}</h1>

            {/* Rating */}
            <div className="flex items-center gap-4 mb-8">
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={20}
                    className={i < Math.floor(product.rating) ? "fill-[#E8A835] text-[#E8A835]" : "text-gray-300"}
                  />
                ))}
              </div>
              <span className="text-[#8B6F47]">({product.reviews_count} تقييم)</span>
            </div>

            {/* Price */}
            <div className="mb-8">
              <div className="flex items-baseline gap-4 mb-4">
                <span className="text-5xl font-bold text-[#C41E3A]">{product.price} ج.م</span>
                {product.original_price > product.price && (
                  <span className="text-2xl text-gray-400 line-through">{product.original_price} ج.م</span>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="mb-8">
              <h3 className="font-bold text-[#2B2520] mb-3">وصف المنتج:</h3>
              <p className="text-[#8B6F47] leading-relaxed">{product.description_ar}</p>
            </div>

            {/* Quantity and Actions */}
            <div className="flex items-center gap-4 mb-8">
              <div className="flex items-center border border-[#D9D4C8] rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-3 text-[#2B2520] hover:bg-[#F5F1E8]"
                >
                  −
                </button>
                <span className="px-4 py-3 min-w-16 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-4 py-3 text-[#2B2520] hover:bg-[#F5F1E8]"
                >
                  +
                </button>
              </div>

              <button className="flex-1 py-3 bg-[#E8A835] text-white rounded-lg font-bold hover:bg-[#D9941E] transition-colors flex items-center justify-center gap-2">
                <ShoppingCart size={20} />
                أضف إلى السلة
              </button>

              <button
                onClick={() => setIsFavorite(!isFavorite)}
                className="px-6 py-3 border border-[#D9D4C8] rounded-lg hover:bg-[#F5F1E8] transition-colors"
              >
                <Heart size={24} className={isFavorite ? "fill-[#C41E3A] text-[#C41E3A]" : "text-[#8B6F47]"} />
              </button>
            </div>

            {/* Additional Info */}
            <div className="border-t pt-8">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-[#8B6F47] mb-1">الفئة:</p>
                  <p className="font-semibold text-[#2B2520]">{product.brand}</p>
                </div>
                <div>
                  <p className="text-sm text-[#8B6F47] mb-1">الحالة:</p>
                  <p className="font-semibold text-[#2B2520]">متوفر</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
