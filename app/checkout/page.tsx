"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ArrowRight, Check } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase"

const orderItems = [
  { id: 1, name: "الكمون الكامل", brand: "تتبيلة", price: 45, quantity: 2, image: "🌶️" },
  { id: 2, name: "خلطة الشاورما", brand: "تابل", price: 40, quantity: 1, image: "🌶️" },
]

export default function CheckoutPage() {
  const router = useRouter()
  const supabase = getSupabaseClient()
  const [currentStep, setCurrentStep] = useState<"auth" | "shipping" | "payment" | "confirmation">("auth")
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [orderId, setOrderId] = useState("")
  const [formData, setFormData] = useState({
    // Shipping
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    // Payment
    cardName: "",
    cardNumber: "",
    expiryDate: "",
    cvv: "",
  })

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
      }
    }
    checkUser()
  }, [supabase])

  const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const shipping = 50
  const tax = Math.round(subtotal * 0.14)
  const total = subtotal + shipping + tax

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentStep("payment")
  }

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Generate order number
      const orderNumber = `TT${Date.now()}`

      // Save order to database
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert([
          {
            user_id: user.id,
            order_number: orderNumber,
            status: "processing",
            subtotal: subtotal,
            shipping: shipping,
            tax: tax,
            total_amount: total,
            customer_email: formData.email,
            first_name: formData.firstName,
            last_name: formData.lastName,
            phone: formData.phone,
            address: formData.address,
            city: formData.city,
            postal_code: formData.postalCode,
          },
        ])
        .select()

      if (orderError) throw orderError

      const newOrderId = orderData[0].id

      // Save order items
      const itemsToInsert = orderItems.map((item) => ({
        order_id: newOrderId,
        product_id: item.id,
        product_name: item.name,
        product_brand: item.brand,
        price: item.price,
        quantity: item.quantity,
      }))

      const { error: itemsError } = await supabase.from("order_items").insert(itemsToInsert)

      if (itemsError) throw itemsError

      setOrderId(orderNumber)
      setCurrentStep("confirmation")
    } catch (error) {
      console.error("Error saving order:", error)
      alert("حدث خطأ في معالجة الطلب. يرجى المحاولة مرة أخرى")
    } finally {
      setIsLoading(false)
    }
  }

  if (currentStep === "auth" && !user) {
    return (
      <main className="min-h-screen bg-white">
        <Navbar />

        <section className="bg-[#F5F1E8] py-8">
          <div className="max-w-7xl mx-auto px-4">
            <h1 className="text-4xl font-bold text-[#2B2520]">الدفع</h1>
          </div>
        </section>

        <section className="py-12">
          <div className="max-w-md mx-auto px-4">
            <div className="bg-white rounded-xl shadow-md p-8 border border-[#E8E2D1] text-center">
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

        <Footer />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      {/* Header */}
      <section className="bg-[#F5F1E8] py-8">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold text-[#2B2520]">الدفع</h1>
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
                      : index < (["shipping", "payment", "confirmation"] as const).indexOf(currentStep)
                        ? "bg-green-500 text-white"
                        : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {index < (["shipping", "payment", "confirmation"] as const).indexOf(currentStep) ? (
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
                <form onSubmit={handleShippingSubmit} className="bg-white rounded-xl shadow-md p-8">
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
                    <div>
                      <label className="block text-sm font-semibold text-[#2B2520] mb-2">المدينة*</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-[#D9D4C8] rounded-lg focus:outline-none focus:border-[#E8A835]"
                        placeholder="المدينة"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[#2B2520] mb-2">الرمز البريدي*</label>
                      <input
                        type="text"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-[#D9D4C8] rounded-lg focus:outline-none focus:border-[#E8A835]"
                        placeholder="الرمز البريدي"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full px-8 py-3 bg-[#E8A835] text-white rounded-lg font-bold hover:bg-[#D9941E] transition-colors flex items-center justify-center gap-2"
                  >
                    متابعة للدفع
                    <ArrowRight size={20} />
                  </button>
                </form>
              )}

              {/* Payment Form */}
              {currentStep === "payment" && (
                <form onSubmit={handlePaymentSubmit} className="bg-white rounded-xl shadow-md p-8">
                  <h2 className="text-2xl font-bold text-[#2B2520] mb-6">تفاصيل الدفع</h2>

                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-[#2B2520] mb-2">اسم حامل البطاقة*</label>
                    <input
                      type="text"
                      name="cardName"
                      value={formData.cardName}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-[#D9D4C8] rounded-lg focus:outline-none focus:border-[#E8A835]"
                      placeholder="الاسم على البطاقة"
                    />
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-[#2B2520] mb-2">رقم البطاقة*</label>
                    <input
                      type="text"
                      name="cardNumber"
                      value={formData.cardNumber}
                      onChange={handleChange}
                      required
                      placeholder="1234 5678 9012 3456"
                      className="w-full px-4 py-3 border border-[#D9D4C8] rounded-lg focus:outline-none focus:border-[#E8A835]"
                      maxLength={19}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-6 mb-8">
                    <div>
                      <label className="block text-sm font-semibold text-[#2B2520] mb-2">تاريخ الانتهاء*</label>
                      <input
                        type="text"
                        name="expiryDate"
                        value={formData.expiryDate}
                        onChange={handleChange}
                        required
                        placeholder="MM/YY"
                        className="w-full px-4 py-3 border border-[#D9D4C8] rounded-lg focus:outline-none focus:border-[#E8A835]"
                        maxLength={5}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[#2B2520] mb-2">CVV*</label>
                      <input
                        type="text"
                        name="cvv"
                        value={formData.cvv}
                        onChange={handleChange}
                        required
                        placeholder="123"
                        className="w-full px-4 py-3 border border-[#D9D4C8] rounded-lg focus:outline-none focus:border-[#E8A835]"
                        maxLength={3}
                      />
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setCurrentStep("shipping")}
                      className="flex-1 px-8 py-3 border-2 border-[#E8A835] text-[#E8A835] rounded-lg font-bold hover:bg-[#F5F1E8] transition-colors"
                    >
                      العودة
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 px-8 py-3 bg-[#E8A835] text-white rounded-lg font-bold hover:bg-[#D9941E] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isLoading ? "جاري المعالجة..." : "إتمام الطلب"}
                      <Check size={20} />
                    </button>
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
                {orderItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-[#2B2520]">{item.name}</p>
                      <p className="text-sm text-[#8B6F47]">{item.brand}</p>
                      <p className="text-xs text-[#8B6F47] mt-1">الكمية: {item.quantity}</p>
                    </div>
                    <p className="font-bold text-[#C41E3A]">{item.price * item.quantity} ج.م</p>
                  </div>
                ))}
              </div>

              <div className="space-y-3 mb-6 pb-6 border-b border-[#D9D4C8]">
                <div className="flex justify-between text-[#8B6F47]">
                  <span>المجموع الفرعي</span>
                  <span>{subtotal} ج.م</span>
                </div>
                <div className="flex justify-between text-[#8B6F47]">
                  <span>الشحن</span>
                  <span>{shipping} ج.م</span>
                </div>
                <div className="flex justify-between text-[#8B6F47]">
                  <span>الضريبة (14%)</span>
                  <span>{tax} ج.م</span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-[#2B2520]">الإجمالي</span>
                <span className="text-3xl font-bold text-[#C41E3A]">{total} ج.م</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
