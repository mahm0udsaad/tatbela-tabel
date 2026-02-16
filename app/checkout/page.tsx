"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, Check, Banknote } from "lucide-react"
import type { ZodIssue } from "zod"

import { useCart } from "@/components/cart-provider"
import { getSupabaseClient } from "@/lib/supabase"
import {
  paymobBillingSchema,
  paymobRequestSchema,
  type PaymobBillingData,
  type PaymobRequestPayload,
} from "@/lib/validation/paymob"
import { placeOrder } from "@/lib/actions/orders"

type ShippingFormData = {
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  city: string
  governorate: string
  postalCode: string
}

type ShippingZone = {
  id: string
  governorate: string
  base_rate: number
  per_kg_rate: number
  estimated_days: number
}

type CustomerSession = {
  id: string
  phone: string
}

export function CheckoutView({ mode = "b2c" }: { mode?: "b2c" | "b2b" }) {
  const router = useRouter()
  const supabase = getSupabaseClient()
  const { cart, isLoading: isCartLoading, clearCart } = useCart()
  const isB2B = mode === "b2b"
  const [currentStep, setCurrentStep] = useState<"shipping" | "payment" | "confirmation">("shipping")
  const [isLoading, setIsLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<"online" | "cash">("cash")
  const [user, setUser] = useState<CustomerSession | null>(null)
  const [orderId, setOrderId] = useState("")
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [shippingError, setShippingError] = useState<string | null>(null)
  const [shippingZones, setShippingZones] = useState<ShippingZone[]>([])
  const [shippingZoneId, setShippingZoneId] = useState<string | null>(null)
  const [isAuthChecking, setIsAuthChecking] = useState(!isB2B)
  const [formData, setFormData] = useState<ShippingFormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    governorate: "",
    postalCode: "",
  })
  const pageTitle = isB2B ? "الدفع للجملة" : "الدفع"

  useEffect(() => {
    const checkUser = async () => {
      if (isB2B) {
        setIsAuthChecking(false)
        return
      }

      const authResponse = await fetch("/api/customer-auth/me", {
        method: "GET",
        cache: "no-store",
      })
      const authPayload = await authResponse.json().catch(() => ({}))

      if (!authResponse.ok || !authPayload?.authenticated || !authPayload?.customer) {
        router.replace("/auth/sign-in?next=/checkout")
        return
      }

      setUser({
        id: authPayload.customer.id,
        phone: authPayload.customer.phone,
      })
      setFormData((prev) => ({
        ...prev,
        phone: prev.phone || authPayload.customer.phone,
      }))
      setIsAuthChecking(false)
    }
    checkUser()
    
    const loadZones = async () => {
      const { data, error } = await supabase
        .from("shipping_zones")
        .select("id, governorate, base_rate, per_kg_rate, estimated_days, sort_order")
        .order("sort_order", { ascending: true, nullsFirst: true })
        .order("governorate", { ascending: true })
      if (error) {
        console.error("Failed to load shipping zones", error)
        return
      }
      setShippingZones(data ?? [])
      if ((data ?? []).length > 0) {
        setShippingZoneId(data![0].id)
        setFormData((prev) => ({ ...prev, governorate: data![0].governorate }))
      }
    }
    loadZones()
  }, [isB2B, router, supabase])

  const orderItems = cart?.items || []
  const subtotal = orderItems.reduce(
    (sum, item) => sum + (item.unit_price ?? item.product.price) * item.quantity,
    0,
  )
  const baseShipping =
    shippingZoneId && shippingZones.length
      ? Number(shippingZones.find((z) => z.id === shippingZoneId)?.base_rate ?? 50)
      : 50
  const isFreeShipping = !isB2B && Boolean(cart?.freeShipping?.eligible)
  const shipping = isFreeShipping ? 0 : baseShipping
  
  // Calculate tax (14%) for products with has_tax = true
  const tax = orderItems.reduce((taxTotal, item) => {
    const itemHasTax = item.product.has_tax ?? false
    if (itemHasTax) {
      const priceToUse = item.unit_price ?? item.product.price
      const itemSubtotal = priceToUse * item.quantity
      const itemTax = itemSubtotal * 0.14 // 14% tax
      return taxTotal + itemTax
    }
    return taxTotal
  }, 0)
  
  const total = subtotal + tax + shipping

  const formatValidationIssues = (issues: ZodIssue[]) => {
    if (!issues.length) return "يرجى التحقق من بيانات التوصيل"
    return issues[0]?.message || "يرجى التحقق من بيانات التوصيل"
  }

  const getSanitizedShippingData = (): ShippingFormData => ({
    firstName: formData.firstName.trim(),
    lastName: formData.lastName.trim(),
    email: formData.email.trim(),
    phone: formData.phone.trim(),
    address: formData.address.trim(),
    governorate: formData.governorate.trim(),
    city: formData.governorate.trim() || formData.city.trim(),
    postalCode: formData.postalCode.trim(),
  })

  const buildBillingPayload = (data: ShippingFormData): PaymobBillingData => ({
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phone: data.phone,
    address: data.address,
    city: data.city || data.governorate || "القاهرة",
    postalCode: data.postalCode || undefined,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    if (name === "governorate") {
      const zone = shippingZones.find((z) => z.governorate === value)
      if (zone) {
        setShippingZoneId(zone.id)
      }
      setFormData((prev) => ({ ...prev, city: value }))
    }
    if (shippingError) setShippingError(null)
    if (paymentError) setPaymentError(null)
  }

  const handleShippingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const sanitizedData = getSanitizedShippingData()
    const billingPayload = buildBillingPayload(sanitizedData)
    const validationResult = paymobBillingSchema.safeParse(billingPayload)

    if (!validationResult.success) {
      setShippingError(formatValidationIssues(validationResult.error.issues))
      return
    }

    setFormData(sanitizedData)
    setShippingError(null)
    setCurrentStep("payment")
  }

  const persistOrder = async (orderNumber: string, billingData: ShippingFormData) => {
    const items = orderItems.map((item) => {
      const priceToUse = item.unit_price ?? item.product.price
      return {
        product_id: item.product.id,
        product_name: item.product.name,
        product_brand: item.product.brand,
        price: priceToUse,
        quantity: item.quantity,
        total: priceToUse * item.quantity,
      }
    })

    const result = await placeOrder({
      orderNumber,
      subtotal,
      shippingCost: shipping,
      taxAmount: tax,
      totalAmount: total,
      channel: mode,
      shippingZoneId,
      customerEmail: billingData.email,
      firstName: billingData.firstName,
      lastName: billingData.lastName,
      phone: billingData.phone,
      address: billingData.address,
      city: billingData.city,
      postalCode: billingData.postalCode,
      paymentMethod,
      items,
    })

    return { newOrderId: result.newOrderId }
  }

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!orderItems.length) {
      setPaymentError("سلة التسوق فارغة")
      return
    }

    const sanitizedShippingData = getSanitizedShippingData()
    const billingPayload = buildBillingPayload(sanitizedShippingData)
    const billingValidation = paymobBillingSchema.safeParse(billingPayload)

    if (!billingValidation.success) {
      const validationMessage = formatValidationIssues(billingValidation.error.issues)
      setShippingError(validationMessage)
      setCurrentStep("shipping")
      setPaymentError(null)
      return
    }

    const orderNumber = `TT${Date.now()}`
    let onlinePaymentPayload: PaymobRequestPayload | null = null

    if (paymentMethod === "online") {
      const paymobItemsPayload: PaymobRequestPayload["items"] = [
        ...orderItems.map((item) => ({
          name: item.product.name,
          price: Number(item.unit_price ?? item.product.price),
          quantity: item.quantity,
          description: item.product.brand,
        })),
      ]

      if (shipping > 0) {
        paymobItemsPayload.push({
          name: "الشحن",
          price: shipping,
          quantity: 1,
          description: "تكلفة التوصيل",
        })
      }

      if (tax > 0) {
        paymobItemsPayload.push({
          name: "الضريبة (14%)",
          price: tax,
          quantity: 1,
          description: "ضريبة على بعض المنتجات",
        })
      }

      const validationResult = paymobRequestSchema.safeParse({
        amount: total,
        currency: "EGP",
        merchantOrderId: orderNumber,
        billing: billingValidation.data,
        items: paymobItemsPayload,
      })

      if (!validationResult.success) {
        setPaymentError(formatValidationIssues(validationResult.error.issues))
        return
      }

      onlinePaymentPayload = validationResult.data
    }

    setFormData(sanitizedShippingData)
    setShippingError(null)
    setPaymentError(null)
    setIsLoading(true)

    try {
      await persistOrder(orderNumber, sanitizedShippingData)
      await clearCart()

      if (paymentMethod === "cash") {
        setOrderId(orderNumber)
        setCurrentStep("confirmation")
        return
      }

      if (!onlinePaymentPayload) {
        throw new Error("بيانات الدفع غير متاحة")
      }

      const paymobResponse = await fetch("/api/paymob", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(onlinePaymentPayload),
      })

      const paymobPayload = await paymobResponse.json().catch(() => ({}))
      if (!paymobResponse.ok) {
        const apiErrorMessage =
          paymobPayload?.details?.[0]?.message || paymobPayload?.error || "تعذر بدء عملية الدفع عبر Paymob"
        throw new Error(apiErrorMessage)
      }

      if (!paymobPayload?.iframeUrl) {
        throw new Error("استجابة Paymob غير مكتملة")
      }

      window.location.href = paymobPayload.iframeUrl as string
    } catch (error) {
      console.error("Error saving order:", error)
      setPaymentError(
        error instanceof Error ? error.message : "حدث خطأ في معالجة الطلب. يرجى المحاولة مرة أخرى"
      )
    } finally {
      setIsLoading(false)
    }
  }

  if (isAuthChecking || isCartLoading) {
    return (
      <div className="min-h-screen py-20 text-center">
        <p className="text-[#8B6F47]">جاري تحميل السلة...</p>
      </div>
    )
  }

  return (
    <main className="min-h-screen">

      {/* Header */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold text-[#2B2520]">{pageTitle}</h1>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4">
          {/* Progress Steps */}
          <div className="grid grid-cols-3 gap-4 mb-12">
            {(["shipping", "payment", "confirmation"] as const).map((step, index) => (
              <div key={step} className="flex items-center gap-4">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${
                    currentStep === step
                      ? "bg-brand-green text-white"
                      : index < (["shipping", "payment", "confirmation"] as const).indexOf(currentStep as any)
                        ? "bg-green-500 text-white"
                        : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {index < (["shipping", "payment", "confirmation"] as const).indexOf(currentStep as any) ? (
                    <Check size={20} />
                  ) : (
                    index + 1
                  )}
                </div>
                <div>
                  <p className="font-semibold text-[#2B2520] text-sm">
                    {step === "shipping" && "بيانات التوصيل"}
                    {step === "payment" && "الدفع"}
                    {step === "confirmation" && "التأكيد"}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className={`grid ${currentStep === "confirmation" ? "" : "lg:grid-cols-3"} gap-8`}>
            {/* Main Form */}
            <div className={currentStep === "confirmation" ? "max-w-2xl mx-auto w-full" : "lg:col-span-2"}>
              {/* Shipping Form */}
              {currentStep === "shipping" && (
                <form onSubmit={handleShippingSubmit} className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md p-8">
                  <h2 className="text-2xl font-bold text-[#2B2520] mb-6">بيانات التوصيل</h2>

                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-semibold text-[#2B2520] mb-2">الاسم الأول*</label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-[#D9D4C8] rounded-lg focus:outline-none focus:border-brand-green"
                        placeholder="اسمك الأول"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[#2B2520] mb-2">الاسم الأخير*</label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-[#D9D4C8] rounded-lg focus:outline-none focus:border-brand-green"
                        placeholder="اسمك الأخير"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-semibold text-[#2B2520] mb-2">البريد الإلكتروني (اختياري)</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-[#D9D4C8] rounded-lg focus:outline-none focus:border-brand-green"
                        placeholder="بريدك الإلكتروني"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[#2B2520] mb-2">رقم الهاتف*</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-[#D9D4C8] rounded-lg focus:outline-none focus:border-brand-green"
                        placeholder="رقم هاتفك"
                      />
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-[#2B2520] mb-2">العنوان*</label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-[#D9D4C8] rounded-lg focus:outline-none focus:border-[#E8A835]"
                      placeholder="شارعك ورقم منزلك"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 mb-8">
                    <div className="md:col-span-1">
                      <label className="block text-sm font-semibold text-[#2B2520] mb-2">المحافظة*</label>
                      <select
                        name="governorate"
                        value={formData.governorate}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg border border-[#D9D4C8] focus:border-brand-green focus:outline-none"
                        required={shippingZones.length > 0}
                      >
                        <option value="">اختر المحافظة</option>
                        {shippingZones.map((zone) => (
                          <option key={zone.id} value={zone.governorate}>
                            {zone.governorate} • {Number(zone.base_rate).toFixed(0)} ج.م
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-1">
                      <label className="block text-sm font-semibold text-[#2B2520] mb-2">الرمز البريدي (اختياري)</label>
                      <input
                        type="text"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-[#D9D4C8] rounded-lg focus:outline-none focus:border-brand-green"
                        placeholder="الرمز البريدي"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full px-8 py-3 bg-brand-green text-white rounded-lg font-bold hover:bg-brand-green-dark transition-colors flex items-center justify-center gap-2"
                  >
                    متابعة للدفع
                    <ArrowRight size={20} />
                  </button>
                  {shippingError && <p className="mt-4 text-center text-sm text-red-600">{shippingError}</p>}
                </form>
              )}

              {/* Payment Form */}
              {currentStep === "payment" && (
                <form onSubmit={handlePaymentSubmit} className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md p-8">
                  <h2 className="text-2xl font-bold text-[#2B2520] mb-6">تفاصيل الدفع</h2>

                  <div className="grid grid-cols-1 gap-4 mb-8">
                    {/*
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("online")}
                      className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all ${
                        paymentMethod === "online"
                          ? "border-brand-green bg-brand-green/10 text-brand-green"
                          : "border-[#E8E2D1] bg-white text-[#8B6F47] hover:border-brand-green"
                      }`}
                    >
                      <CreditCard size={32} className="mb-3" />
                      <span className="font-bold">دفع إلكتروني</span>
                    </button>
                    */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("cash")}
                      className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all ${
                        paymentMethod === "cash"
                          ? "border-brand-green bg-brand-green/10 text-brand-green"
                          : "border-[#E8E2D1] bg-white text-[#8B6F47] hover:border-brand-green"
                      }`}
                    >
                      <Banknote size={32} className="mb-3" />
                      <span className="font-bold">دفع عند الاستلام</span>
                    </button>
                  </div>

                  {/*
                  {paymentMethod === "online" && (
                    <div className="bg-brand-green/10 p-6 rounded-lg mb-8 flex items-start gap-4 animate-in fade-in slide-in-from-top-4 duration-300 border border-brand-green/30">
                      <div className="bg-white p-3 rounded-full text-brand-green">
                        <ShieldCheck size={28} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-[#2B2520] mb-2">دفع إلكتروني آمن عبر Paymob</h3>
                        <p className="text-[#8B6F47]">
                          بعد الضغط على زر إتمام الطلب سيتم تحويلك تلقائياً إلى بوابة Paymob الآمنة لإدخال بيانات البطاقة أو
                          المحافظة الإلكترونية الخاصة بك. لا نقوم بحفظ أي بيانات حساسة على خوادمنا.
                        </p>
                      </div>
                    </div>
                  )}
                  */}

                  {paymentMethod === "cash" && (
                    <div className="bg-[#F5F1E8] p-6 rounded-lg mb-8 flex items-start gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
                      <div className="bg-white p-2 rounded-full text-brand-green">
                        <Banknote size={24} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-[#2B2520] mb-2">الدفع عند الاستلام</h3>
                        <p className="text-[#8B6F47]">سيتم دفع المبلغ بالكامل لمندوب التوصيل عند استلام الطلب.</p>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-4">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 px-8 py-3 bg-brand-green text-white rounded-lg font-bold hover:bg-brand-green-dark transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isLoading ? "جاري المعالجة..." : "إتمام الطلب"}
                      <Check size={20} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentStep("shipping")}
                      className="flex-1 px-8 py-3 border-2 border-brand-green text-brand-green rounded-lg font-bold hover:bg-[#F5F1E8] transition-colors"
                    >
                      العودة
                    </button>
            {paymentError && <p className="text-center text-sm text-red-600">{paymentError}</p>}
                  </div>
                </form>
              )}

              {/* Confirmation */}
              {currentStep === "confirmation" && (
                <div className="bg-green-50 border-2 border-green-400 rounded-xl shadow-md p-8 text-center">
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Check size={32} className="text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-green-700 mb-2">شكراً لك!</h2>
                  <p className="text-green-600 mb-4">تم استقبال طلبك بنجاح</p>
                  <p className="text-[#8B6F47] mb-8">سيتم التواصل معك قريباً وسيصلك رقم التتبع</p>
                  <div className="bg-white p-6 rounded-lg mb-8 text-left">
                    <p className="text-[#2B2520] font-semibold mb-2">رقم الطلب: #{orderId}</p>
                    <p className="text-[#8B6F47]">تاريخ الطلب: {new Date().toLocaleDateString("ar-EG")}</p>
                  </div>
                  <Link
                    href={user ? "/user/orders" : "/"}
                    className="inline-block px-8 py-3 bg-brand-green text-white rounded-lg font-bold hover:bg-brand-green-dark transition-colors"
                  >
                    {user ? "عرض طلباتي" : "العودة للرئيسية"}
                  </Link>
                </div>
              )}
            </div>

            {/* Order Summary */}
            {currentStep !== "confirmation" && <div className="bg-[#F5F1E8] rounded-xl p-6 h-fit sticky top-4">
              <h3 className="text-xl font-bold text-[#2B2520] mb-6">ملخص الطلب</h3>

              <div className="space-y-4 mb-6 pb-6 border-b border-[#D9D4C8]">
                {orderItems.map((item) => {
                  const linePrice = (item.unit_price ?? item.product.price) * item.quantity
                  return (
                    <div key={item.id} className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-[#2B2520]">{item.product.name}</p>
                        <p className="text-sm text-[#8B6F47]">{item.product.brand}</p>
                        <p className="text-xs text-[#8B6F47] mt-1">الكمية: {item.quantity}</p>
                        {item.product.has_tax && (
                          <p className="text-xs text-[#C41E3A] font-medium mt-1">
                            خاضع للضريبة. 14%
                          </p>
                        )}
                      </div>
                      <p className="font-bold text-[#C41E3A]">{linePrice.toFixed(2)} ج.م</p>
                    </div>
                  )
                })}
              </div>

              <div className="space-y-3 mb-6 pb-6 border-b border-[#D9D4C8]">
                <div className="flex justify-between text-[#8B6F47]">
                  <span>المجموع الفرعي</span>
                  <span>{subtotal.toFixed(2)} ج.م</span>
                </div>
                {tax > 0 && (
                  <div className="flex justify-between text-[#C41E3A]">
                    <span className="flex items-center gap-1">
                      الضريبة (14%)
                      <span className="text-xs text-[#8B6F47]">على بعض المنتجات</span>
                    </span>
                    <span className="font-semibold">{tax.toFixed(2)} ج.م</span>
                  </div>
                )}
                <div className="flex justify-between text-[#8B6F47]">
                  <span>الشحن</span>
                  <span>{shipping === 0 ? "مجاني" : `${shipping.toFixed(2)} ج.م`}</span>
                </div>
                {isFreeShipping && (
                  <p className="text-xs text-green-700 text-right">تم تفعيل الشحن المجاني على هذا الطلب</p>
                )}
              </div>

              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-[#2B2520]">الإجمالي</span>
                <span className="text-3xl font-bold text-[#C41E3A]">{total.toFixed(2)} ج.م</span>
              </div>
              {isB2B && (
                <p className="text-xs text-[#8B6F47] mt-4 text-center">
                  لطلبات الجملة الإتصال بخدمة العملاء 000000000
                </p>
              )}
            </div>}
          </div>
        </div>
      </section>
    </main>
  )
}

export default function CheckoutPage() {
  return <CheckoutView />
}
