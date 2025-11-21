'use client'

import Link from "next/link"
import { ArrowRight, Trash2, Plus, Minus, ShoppingBag } from "lucide-react"
import { useCart } from "@/components/cart-provider"
import { useRouter } from "next/navigation"

export function CartClient() {
  const { cart, isLoading, removeItem, updateQuantity } = useCart()
  const router = useRouter()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white py-20 text-center">
        <p className="text-[#8B6F47]">جاري تحميل السلة...</p>
      </div>
    )
  }

  if (!cart || cart.items.length === 0) {
    return (
      <main className="min-h-screen bg-white">
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-[#F5F1E8] rounded-full mb-6">
              <ShoppingBag size={40} className="text-[#E8A835]" />
            </div>
            <h1 className="text-4xl font-bold text-[#2B2520] mb-4">سلتك فارغة</h1>
            <p className="text-lg text-[#8B6F47] mb-8">ابدأ التسوق وأضف منتجاتك المفضلة</p>
            <Link
              href="/store"
              className="inline-block px-8 py-3 bg-[#E8A835] text-white rounded-lg font-bold hover:bg-[#D9941E] transition-colors"
            >
              متابعة التسوق <ArrowRight size={20} className="inline mr-2" />
            </Link>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#F5F1E8] py-12">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-[#2B2520] mb-8">عربة التسوق ({cart.items.length})</h1>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Cart Items */}
          <div className="flex-1 space-y-4">
            {cart.items.map((item) => (
              <div key={item.id} className="bg-white rounded-xl p-4 shadow-sm border border-[#E8E2D1] flex gap-4 sm:gap-6">
                <div className="w-24 h-24 sm:w-32 sm:h-32 bg-[#F5F1E8] rounded-lg overflow-hidden flex-shrink-0">
                  {item.product.image_url ? (
                    <img
                      src={item.product.image_url}
                      alt={item.product.name_ar}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">🌶️</div>
                  )}
                </div>

                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <p className="text-xs text-[#E8A835] font-semibold mb-1">{item.product.brand}</p>
                        <h3 className="text-lg font-bold text-[#2B2520]">{item.product.name_ar}</h3>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                        title="حذف"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                    <p className="text-[#C41E3A] font-bold mt-1">{item.product.price.toFixed(2)} ج.م</p>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center border border-[#D9D4C8] rounded-lg">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="px-3 py-1 hover:bg-[#F5F1E8] text-[#2B2520]"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="px-3 font-semibold text-[#2B2520] min-w-[2rem] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="px-3 py-1 hover:bg-[#F5F1E8] text-[#2B2520]"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    <p className="font-bold text-[#2B2520]">
                      {(item.product.price * item.quantity).toFixed(2)} ج.م
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:w-96 flex-shrink-0">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-[#E8E2D1] sticky top-24">
              <h2 className="text-xl font-bold text-[#2B2520] mb-6">ملخص الطلب</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-[#8B6F47]">
                  <span>المجموع الفرعي</span>
                  <span>{cart.subtotal.toFixed(2)} ج.م</span>
                </div>
                <div className="flex justify-between text-[#8B6F47]">
                  <span>الشحن</span>
                  <span>يحتسب عند الدفع</span>
                </div>
                <div className="border-t border-[#E8E2D1] pt-3 flex justify-between font-bold text-lg text-[#2B2520]">
                  <span>الإجمالي</span>
                  <span className="text-[#C41E3A]">{cart.subtotal.toFixed(2)} ج.م</span>
                </div>
              </div>

              <Link
                href="/checkout"
                className="block w-full py-3 bg-[#E8A835] text-white text-center rounded-lg font-bold hover:bg-[#D9941E] transition-colors shadow-lg shadow-[#E8A835]/20"
              >
                إتمام الشراء
              </Link>
              
              <div className="mt-4 text-center">
                <Link href="/store" className="text-sm text-[#8B6F47] hover:text-[#E8A835] underline">
                  متابعة التسوق
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

