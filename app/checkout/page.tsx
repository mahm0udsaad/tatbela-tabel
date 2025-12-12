"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, Check, CreditCard, Banknote, ShieldCheck } from "lucide-react"
import type { ZodIssue } from "zod"

import { useCart } from "@/components/cart-provider"
import { getSupabaseClient } from "@/lib/supabase"
import {
  paymobBillingSchema,
  paymobRequestSchema,
  type PaymobBillingData,
  type PaymobRequestPayload,
} from "@/lib/validation/paymob"
import { getUserAddresses, saveAddress, type Address } from "@/lib/actions/addresses"

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

export function CheckoutView({ mode = "b2c" }: { mode?: "b2c" | "b2b" }) {
  const router = useRouter()
  const supabase = getSupabaseClient()
  const { cart, isLoading: isCartLoading, clearCart } = useCart()
  const isB2B = mode === "b2b"
  const [currentStep, setCurrentStep] = useState<"auth" | "shipping" | "payment" | "confirmation">("auth")
  const [isLoading, setIsLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<"online" | "cash">("online")
  const [user, setUser] = useState<any>(null)
  const [orderId, setOrderId] = useState("")
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [shippingError, setShippingError] = useState<string | null>(null)
  const [shippingZones, setShippingZones] = useState<ShippingZone[]>([])
  const [shippingZoneId, setShippingZoneId] = useState<string | null>(null)
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [saveAddressForLater, setSaveAddressForLater] = useState(true)
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
      const { data: sessionData } = await supabase.auth.getSession()
      if (sessionData.session?.user) {
        setUser(sessionData.session.user)
        setCurrentStep("shipping")
        // Pre-fill email from user profile
        setFormData((prev) => ({
          ...prev,
          email: sessionData.session.user.email || "",
        }))

        // Load saved addresses
        const addresses = await getUserAddresses()
        setSavedAddresses(addresses)
        
        // Auto-select default address or first address (will be loaded after zones are ready)
        const defaultAddr = addresses.find(a => a.is_default) || addresses[0]
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr.id)
        }
      }
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
      if ((data ?? []).length > 0 && !selectedAddressId) {
        setShippingZoneId(data![0].id)
        setFormData((prev) => ({ ...prev, governorate: data![0].governorate }))
      }
    }
    loadZones()
  }, [supabase])

  // Load address into form when address is selected and zones are loaded
  useEffect(() => {
    if (selectedAddressId && shippingZones.length > 0 && savedAddresses.length > 0 && user) {
      const address = savedAddresses.find(a => a.id === selectedAddressId)
      if (address) {
        loadAddressIntoForm(address)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAddressId, shippingZones.length, savedAddresses.length])

  const loadAddressIntoForm = (address: Address) => {
    setFormData({
      firstName: address.recipient_name?.split(" ")[0] || "",
      lastName: address.recipient_name?.split(" ").slice(1).join(" ") || "",
      email: user?.email || "",
      phone: address.phone || "",
      address: address.street,
      city: address.city,
      governorate: address.governorate,
      postalCode: address.postal_code || "",
    })
    
    // Set shipping zone
    const zone = shippingZones.find((z) => z.governorate === address.governorate)
    if (zone) {
      setShippingZoneId(zone.id)
    }
  }

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
  const tax = Math.round(subtotal * 0.14)
  const total = subtotal + shipping + tax

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

    // Save address if user is logged in and wants to save it
    if (user && saveAddressForLater && !selectedAddressId) {
      try {
        const fullName = `${sanitizedData.firstName} ${sanitizedData.lastName}`.trim()
        await saveAddress({
          recipient_name: fullName,
          phone: sanitizedData.phone,
          governorate: sanitizedData.governorate,
          city: sanitizedData.city,
          street: sanitizedData.address,
          postal_code: sanitizedData.postalCode || null,
          is_default: savedAddresses.length === 0, // Set as default if it's the first address
        })
        // Reload addresses
        const addresses = await getUserAddresses()
        setSavedAddresses(addresses)
      } catch (error) {
        console.error("Error saving address:", error)
        // Continue anyway, don't block checkout
      }
    }

    setFormData(sanitizedData)
    setShippingError(null)
    setCurrentStep("payment")
  }

  const persistOrder = async (orderNumber: string, billingData: ShippingFormData) => {
    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .insert([
        {
          user_id: user.id,
          order_number: orderNumber,
          status: "processing",
          subtotal: subtotal,
          shipping_cost: shipping,
          tax_amount: tax,
          total_amount: total,
        channel: mode,
          shipping_zone_id: shippingZoneId,
          customer_email: billingData.email,
          first_name: billingData.firstName,
          last_name: billingData.lastName,
          phone: billingData.phone,
          address: billingData.address,
          city: billingData.city,
          postal_code: billingData.postalCode,
          payment_method: paymentMethod,
          payment_status: "pending",
        },
      ])
      .select()

    if (orderError) throw orderError

    const newOrderId = orderData?.[0]?.id

    if (!newOrderId) {
      throw new Error("لم نتمكن من إنشاء الطلب في قاعدة البيانات")
    }

    const itemsToInsert = orderItems.map((item) => {
      const priceToUse = item.unit_price ?? item.product.price
      return {
        order_id: newOrderId,
        product_id: item.product.id,
        product_name: item.product.name,
        product_brand: item.product.brand,
        price: priceToUse,
        quantity: item.quantity,
        total: priceToUse * item.quantity,
      }
    })

    if (itemsToInsert.length > 0) {
      const { error: itemsError } = await supabase.from("order_items").insert(itemsToInsert)
      if (itemsError) throw itemsError
    }

    return { newOrderId }
  }

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!orderItems.length) {
      setPaymentError("سلة التسوق فارغة")
      return
    }

    if (!user) {
      setPaymentError("يرجى تسجيل الدخول لإكمال عملية الدفع")
      setCurrentStep("auth")
      router.push("/auth/sign-in")
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
          name: "الضريبة",
          price: tax,
          quantity: 1,
          description: "ضريبة القيمة المضافة",
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

  if (isCartLoading) {
    return (
      <div className="min-h-screen py-20 text-center">
        <p className="text-[#8B6F47]">جاري تحميل السلة...</p>
      </div>
    )
  }

  if (currentStep === "auth" && !user) {
    return (
      <main className="min-h-screen">

        <section className="py-8">
          <div className="max-w-7xl mx-auto px-4">
            <h1 className="text-4xl font-bold text-[#2B2520]">{pageTitle}</h1>
          </div>
        </section>

        <section className="py-12">
          <div className="max-w-md mx-auto px-4">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md p-8 border border-[#E8E2D1] text-center">
              <h2 className="text-2xl font-bold text-[#2B2520] mb-4">يجب تسجيل الدخول أولاً</h2>
              <p className="text-[#8B6F47] mb-8">يرجى تسجيل الدخول أو إنشاء حساب جديد لإكمال عملية الشراء</p>

              <div className="space-y-3">
                <Link
                  href="/auth/sign-in"
                  className="block w-full px-6 py-3 bg-[#E8A835] text-white rounded-lg font-semibold hover:bg-[#D9941E] transition-colors"
                >
                  تسجيل الدخول
                </Link>
                <Link
                  href="/auth/sign-up"
                  className="block w-full px-6 py-3 border-2 border-[#E8A835] text-[#E8A835] rounded-lg font-semibold hover:bg-[#F5F1E8] transition-colors"
                >
                  إنشاء حساب جديد
                </Link>
              </div>

              <p className="text-[#8B6F47] mt-8">
                <Link href="/cart" className="text-[#E8A835] font-semibold hover:underline">
                  العودة إلى السلة
                </Link>
              </p>
            </div>
          </div>
        </section>
      </main>
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
                      ? "bg-[#E8A835] text-white"
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

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-2">
              {/* Shipping Form */}
              {currentStep === "shipping" && (
                <form onSubmit={handleShippingSubmit} className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md p-8">
                  <h2 className="text-2xl font-bold text-[#2B2520] mb-6">بيانات التوصيل</h2>

                  {/* Saved Addresses Selection */}
                  {!isB2B && savedAddresses.length > 0 && (
                    <div className="mb-6 p-4 bg-[#F5F1E8] rounded-lg border border-[#E8E2D1]">
                      <label className="block text-sm font-semibold text-[#2B2520] mb-2">
                        اختر عنوان محفوظ (اختياري)
                      </label>
                      <select
                        value={selectedAddressId || ""}
                        onChange={(e) => {
                          const addrId = e.target.value || null
                          setSelectedAddressId(addrId)
                          if (addrId) {
                            const addr = savedAddresses.find(a => a.id === addrId)
                            if (addr) {
                              loadAddressIntoForm(addr)
                            }
                          }
                        }}
                        className="w-full px-4 py-2 border border-[#D9D4C8] rounded-lg focus:outline-none focus:border-[#E8A835] bg-white text-[#2B2520] mb-2"
                      >
                        <option value="">إضافة عنوان جديد</option>
                        {savedAddresses.map((addr) => (
                          <option key={addr.id} value={addr.id}>
                            {addr.label || `${addr.governorate}, ${addr.city}`} {addr.is_default && "(افتراضي)"}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-semibold text-[#2B2520] mb-2">الاسم الأول*</label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-[#D9D4C8] rounded-lg focus:outline-none focus:border-[#E8A835]"
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
                        className="w-full px-4 py-3 border border-[#D9D4C8] rounded-lg focus:outline-none focus:border-[#E8A835]"
                        placeholder="اسمك الأخير"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-semibold text-[#2B2520] mb-2">البريد الإلكتروني*</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-[#D9D4C8] rounded-lg focus:outline-none focus:border-[#E8A835]"
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
                        className="w-full px-4 py-3 border border-[#D9D4C8] rounded-lg focus:outline-none focus:border-[#E8A835]"
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
                        className="w-full px-4 py-3 rounded-lg border border-[#D9D4C8] focus:border-[#E8A835] focus:outline-none"
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
                        className="w-full px-4 py-3 border border-[#D9D4C8] rounded-lg focus:outline-none focus:border-[#E8A835]"
                        placeholder="الرمز البريدي"
                      />
                    </div>
                  </div>

                  {/* Save Address Checkbox */}
                  {!isB2B && user && !selectedAddressId && (
                    <div className="mb-6">
                      <label className="flex items-center gap-2 text-[#2B2520] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={saveAddressForLater}
                          onChange={(e) => setSaveAddressForLater(e.target.checked)}
                          className="w-4 h-4 text-[#E8A835] border-[#D9D4C8] rounded focus:ring-[#E8A835]"
                        />
                        <span className="text-sm">حفظ هذا العنوان للاستخدام لاحقاً</span>
                      </label>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full px-8 py-3 bg-[#E8A835] text-white rounded-lg font-bold hover:bg-[#D9941E] transition-colors flex items-center justify-center gap-2"
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

                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("online")}
                      className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all ${
                        paymentMethod === "online"
                          ? "border-[#E8A835] bg-[#FFF9F0] text-[#E8A835]"
                          : "border-[#E8E2D1] bg-white text-[#8B6F47] hover:border-[#E8A835]"
                      }`}
                    >
                      <CreditCard size={32} className="mb-3" />
                      <span className="font-bold">دفع إلكتروني</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("cash")}
                      className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all ${
                        paymentMethod === "cash"
                          ? "border-[#E8A835] bg-[#FFF9F0] text-[#E8A835]"
                          : "border-[#E8E2D1] bg-white text-[#8B6F47] hover:border-[#E8A835]"
                      }`}
                    >
                      <Banknote size={32} className="mb-3" />
                      <span className="font-bold">دفع عند الاستلام</span>
                    </button>
                  </div>

          {paymentMethod === "online" && (
            <div className="bg-[#FFF9F0] p-6 rounded-lg mb-8 flex items-start gap-4 animate-in fade-in slide-in-from-top-4 duration-300 border border-[#F5D9A3]">
              <div className="bg-white p-3 rounded-full text-[#E8A835]">
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

                  {paymentMethod === "cash" && (
                    <div className="bg-[#F5F1E8] p-6 rounded-lg mb-8 flex items-start gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
                      <div className="bg-white p-2 rounded-full text-[#E8A835]">
                        <Banknote size={24} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-[#2B2520] mb-2">الدفع عند الاستلام</h3>
                        <p className="text-[#8B6F47]">
                          سيتم دفع المبلغ بالكامل لمندوب التوصيل عند استلام الطلب.
                        </p>
                      </div>
                    </div>
                  )}

          <div className="flex flex-col gap-4">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 px-8 py-3 bg-[#E8A835] text-white rounded-lg font-bold hover:bg-[#D9941E] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isLoading ? "جاري المعالجة..." : "إتمام الطلب"}
                      <Check size={20} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentStep("shipping")}
                      className="flex-1 px-8 py-3 border-2 border-[#E8A835] text-[#E8A835] rounded-lg font-bold hover:bg-[#F5F1E8] transition-colors"
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
                  <p className="text-[#8B6F47] mb-8">سيتم التواصل معك قريباً على البريد الإلكتروني وسيصلك رقم التتبع</p>
                  <div className="bg-white p-6 rounded-lg mb-8 text-left">
                    <p className="text-[#2B2520] font-semibold mb-2">رقم الطلب: #{orderId}</p>
                    <p className="text-[#8B6F47]">تاريخ الطلب: {new Date().toLocaleDateString("ar-EG")}</p>
                  </div>
                  <Link
                    href="/user/orders"
                    className="inline-block px-8 py-3 bg-[#E8A835] text-white rounded-lg font-bold hover:bg-[#D9941E] transition-colors"
                  >
                    عرض طلباتي
                  </Link>
                </div>
              )}
            </div>

            {/* Order Summary */}
            <div className="bg-[#F5F1E8] rounded-xl p-6 h-fit sticky top-4">
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
                      </div>
                      <p className="font-bold text-[#C41E3A]">{linePrice} ج.م</p>
                    </div>
                  )
                })}
              </div>

              <div className="space-y-3 mb-6 pb-6 border-b border-[#D9D4C8]">
                <div className="flex justify-between text-[#8B6F47]">
                  <span>المجموع الفرعي</span>
                  <span>{subtotal} ج.م</span>
                </div>
                <div className="flex justify-between text-[#8B6F47]">
                  <span>الشحن</span>
                  <span>{shipping === 0 ? "مجاني" : `${shipping} ج.م`}</span>
                </div>
                {isFreeShipping && (
                  <p className="text-xs text-green-700 text-right">تم تفعيل الشحن المجاني على هذا الطلب</p>
                )}
                <div className="flex justify-between text-[#8B6F47]">
                  <span>الضريبة (14%)</span>
                  <span>{tax} ج.م</span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-[#2B2520]">الإجمالي</span>
                <span className="text-3xl font-bold text-[#C41E3A]">{total} ج.م</span>
              </div>
              {isB2B && (
                <p className="text-xs text-[#8B6F47] mt-4 text-center">
                  لطلبات الجملة الإتصال بخدمة العملاء 000000000
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default function CheckoutPage() {
  return <CheckoutView />
}
