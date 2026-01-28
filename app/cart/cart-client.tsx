'use client'

import Link from "next/link"
import { useState, useEffect } from "react"
import { ArrowRight, Trash2, Plus, Minus, ShoppingBag, MapPin } from "lucide-react"
import { useCart } from "@/components/cart-provider"
import type { CartItem } from "@/lib/actions/cart"
import { getUserAddresses, calculateShipping, type Address } from "@/lib/actions/addresses"
import { getSupabaseClient } from "@/lib/supabase"

const getProductImageUrl = (item: CartItem) => {
  const images = item.product.product_images ?? []
  if (images.length === 0) {
    return item.product.image_url || null
  }

  const sorted = [...images].sort((a, b) => {
    const aPrimary = Boolean(a.is_primary)
    const bPrimary = Boolean(b.is_primary)
    if (aPrimary && !bPrimary) return -1
    if (!aPrimary && bPrimary) return 1
    return (a.sort_order ?? 0) - (b.sort_order ?? 0)
  })

  return sorted[0]?.image_url || item.product.image_url || null
}

// Calculate tax for items with has_tax = true (14% tax rate)
const calculateTax = (items: CartItem[]): number => {
  return items.reduce((taxTotal, item) => {
    const itemHasTax = item.product.has_tax ?? false
    if (itemHasTax) {
      const priceToUse = item.unit_price ?? item.variant?.price ?? item.product.price
      const itemSubtotal = priceToUse * item.quantity
      const itemTax = itemSubtotal * 0.14 // 14% tax
      return taxTotal + itemTax
    }
    return taxTotal
  }, 0)
}

export function CartClient({ mode = "b2c" }: { mode?: "b2c" | "b2b" }) {
  const { cart, isLoading, removeItem, updateQuantity } = useCart()
  const isB2B = mode === "b2b"
  const checkoutPath = isB2B ? "/b2b/checkout" : "/checkout"
  const shopPath = isB2B ? "/b2b" : "/store"
  const freeShipping = cart?.freeShipping
  const amountToFree =
    freeShipping && freeShipping.threshold !== null && !freeShipping.eligible
      ? Math.max(0, Number(freeShipping.threshold) - (cart?.subtotal ?? 0))
      : 0

  const [addresses, setAddresses] = useState<Address[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [shippingFee, setShippingFee] = useState<number>(0)
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true)
  const supabase = getSupabaseClient()

  // Calculate tax (14%) for products with has_tax = true
  const taxAmount = cart?.items ? calculateTax(cart.items) : 0

  useEffect(() => {
    const loadAddresses = async () => {
      setIsLoadingAddresses(true)
      try {
        const { data: sessionData } = await supabase.auth.getSession()
        if (sessionData.session?.user) {
          const userAddresses = await getUserAddresses()
          setAddresses(userAddresses)
          
          // Auto-select default address or first address
          const defaultAddr = userAddresses.find(a => a.is_default) || userAddresses[0]
          if (defaultAddr) {
            setSelectedAddressId(defaultAddr.id)
            const fee = await calculateShipping(defaultAddr.governorate)
            setShippingFee(fee)
          }
        }
      } catch (error) {
        console.error('Error loading addresses:', error)
      } finally {
        setIsLoadingAddresses(false)
      }
    }
    loadAddresses()
  }, [supabase])

  useEffect(() => {
    const updateShippingFee = async () => {
      if (!selectedAddressId) {
        setShippingFee(0)
        return
      }
      const address = addresses.find(a => a.id === selectedAddressId)
      if (address) {
        const fee = await calculateShipping(address.governorate)
        setShippingFee(fee)
      }
    }
    updateShippingFee()
  }, [selectedAddressId, addresses])

  if (isLoading) {
    return (
      <div className="min-h-screen py-20 text-center">
        <p className="text-[#8B6F47]">جاري تحميل السلة...</p>
      </div>
    )
  }

  if (!cart || cart.items.length === 0) {
    return (
      <main className="min-h-screen">
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-[#F5F1E8] rounded-full mb-6">
              <ShoppingBag size={40} className="text-brand-green" />
            </div>
            <h1 className="text-4xl font-bold text-[#2B2520] mb-4">{isB2B ? "سلة الجملة فارغة" : "سلتك فارغة"}</h1>
            <p className="text-lg text-[#8B6F47] mb-8">ابدأ التسوق وأضف منتجاتك المفضلة</p>
            <Link
              href={shopPath}
              className="inline-block px-8 py-3 bg-brand-green text-white rounded-lg font-bold hover:bg-brand-green-dark transition-colors"
            >
              متابعة التسوق <ArrowRight size={20} className="inline mr-2" />
            </Link>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-[#2B2520] mb-8">
          {isB2B ? "سلة الجملة" : "عربة التسوق"} ({cart.items.length})
        </h1>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Cart Items */}
          <div className="flex-1 space-y-4">
            {cart.items.map((item) => {
              const priceToUse = item.unit_price ?? item.variant?.price ?? item.product.price
              const imageUrl = getProductImageUrl(item)
              return (
                <div key={item.id} className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-[#E8E2D1] flex gap-4 sm:gap-6">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-lg overflow-hidden flex-shrink-0">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
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
                          <p className="text-xs text-brand-green font-semibold mb-1">{item.product.brand}</p>
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
                      <p className="text-[#C41E3A] font-bold mt-1">{priceToUse.toFixed(2)} ج.م</p>
                      {item.product.has_tax && (
                        <p className="text-xs text-[#C41E3A] font-medium mt-1">
                          خاضع للضريبة. 14%
                        </p>
                      )}
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
                        {(priceToUse * item.quantity).toFixed(2)} ج.م
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Order Summary */}
          <div className="lg:w-96 flex-shrink-0">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-[#E8E2D1] sticky top-24">
              <h2 className="text-xl font-bold text-[#2B2520] mb-4">{isB2B ? "ملخص طلب الجملة" : "ملخص الطلب"}</h2>

              {freeShipping ? (
                <div className={`mb-4 p-3 rounded-lg ${freeShipping.eligible ? "bg-green-50 text-green-700 border border-green-200" : "bg-[#FFF8ED] text-[#8B6F47] border border-brand-green/40"}`}>
                  {freeShipping.eligible ? (
                    <p className="text-sm font-semibold">🎉 تم تفعيل الشحن المجاني لهذا الطلب</p>
                  ) : (
                    <p className="text-sm">
                      تبقى <span className="font-semibold text-[#C41E3A]">{amountToFree.toFixed(2)} ج.م</span> للحصول على شحن مجاني
                    </p>
                  )}
                </div>
              ) : null}
              
              {/* Address Selection */}
              {!isB2B && addresses.length > 0 && (
                <div className="mb-4 p-4 rounded-lg border border-[#E8E2D1]">
                  <label className="block text-sm font-semibold text-[#2B2520] mb-2 flex items-center gap-2">
                    <MapPin size={16} />
                    عنوان التوصيل
                  </label>
                  <select
                    value={selectedAddressId || ""}
                    onChange={(e) => setSelectedAddressId(e.target.value || null)}
                    className="w-full px-4 py-2 border border-[#D9D4C8] rounded-lg focus:outline-none focus:border-brand-green bg-white text-[#2B2520]"
                  >
                    {addresses.map((addr) => (
                      <option key={addr.id} value={addr.id}>
                        {addr.label || `${addr.governorate}, ${addr.city}`} {addr.is_default && "(افتراضي)"}
                      </option>
                    ))}
                  </select>
                  {selectedAddressId && (
                    <p className="text-xs text-[#8B6F47] mt-2">
                      {addresses.find(a => a.id === selectedAddressId)?.street}
                    </p>
                  )}
                </div>
              )}

              {!isB2B && addresses.length === 0 && !isLoadingAddresses && (
                <div className="mb-4 p-3 bg-[#FFF8ED] rounded-lg border border-brand-green/40">
                  <p className="text-sm text-[#8B6F47]">
                    <Link href={checkoutPath} className="text-brand-green font-semibold hover:underline">
                      أضف عنوان التوصيل
                    </Link>{" "}
                    لحساب رسوم الشحن
                  </p>
                </div>
              )}

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-[#8B6F47]">
                  <span>المجموع الفرعي</span>
                  <span>{cart.subtotal.toFixed(2)} ج.م</span>
                </div>
                {taxAmount > 0 && (
                  <div className="flex justify-between text-[#C41E3A]">
                    <span className="flex items-center gap-1">
                      الضريبة (14%)
                      <span className="text-xs text-[#8B6F47]">على بعض المنتجات</span>
                    </span>
                    <span className="font-semibold">{taxAmount.toFixed(2)} ج.م</span>
                  </div>
                )}
                <div className="flex justify-between text-[#8B6F47]">
                  <span>الشحن</span>
                  <span>
                    {isB2B 
                      ? "يحتسب عند الدفع"
                      : freeShipping?.eligible 
                        ? "مجاني" 
                        : selectedAddressId && !isLoadingAddresses
                          ? `${shippingFee.toFixed(2)} ج.م`
                          : "يحتسب عند الدفع"}
                  </span>
                </div>
                <div className="border-t border-[#E8E2D1] pt-3 flex justify-between font-bold text-lg text-[#2B2520]">
                  <span>الإجمالي</span>
                  <span className="text-[#C41E3A]">
                    {isB2B || !selectedAddressId || isLoadingAddresses
                      ? (cart.subtotal + taxAmount).toFixed(2)
                      : (cart.subtotal + taxAmount + (freeShipping?.eligible ? 0 : shippingFee)).toFixed(2)}{" "}
                    ج.م
                  </span>
                </div>
              </div>

              <Link
                href={checkoutPath}
                className="block w-full py-3 bg-brand-green text-white text-center rounded-lg font-bold hover:bg-brand-green-dark transition-colors shadow-lg shadow-brand-green/20"
              >
                إتمام الشراء
              </Link>
              
              <div className="mt-4 text-center">
                <Link href={shopPath} className="text-sm text-[#8B6F47] hover:text-brand-green underline">
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

