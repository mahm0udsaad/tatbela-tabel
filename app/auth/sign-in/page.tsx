"use client"

import type React from "react"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

const normalizePhone = (input: string) => {
  const raw = input.trim().replace(/\s+/g, "")
  if (!raw) return ""

  if (raw.startsWith("+")) {
    return `+${raw.slice(1).replace(/\D/g, "")}`
  }

  if (raw.startsWith("00")) {
    return `+${raw.slice(2).replace(/\D/g, "")}`
  }

  const digits = raw.replace(/\D/g, "")
  if (!digits) return ""

  if (digits.startsWith("0")) return `+2${digits}`
  if (digits.startsWith("1")) return `+20${digits}`
  if (digits.startsWith("20")) return `+${digits}`
  return `+2${digits}`
}

const getSafeNextPath = (nextParam: string | null) => {
  if (!nextParam || !nextParam.startsWith("/")) return "/user/orders"
  return nextParam
}

function SignInContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextPath = getSafeNextPath(searchParams.get("next"))

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [isOtpSent, setIsOtpSent] = useState(false)
  const [phone, setPhone] = useState("")
  const [otpCode, setOtpCode] = useState("")

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const normalizedPhone = normalizePhone(phone)
      if (!normalizedPhone) {
        setError("يرجى إدخال رقم هاتف صالح")
        return
      }

      const response = await fetch("/api/customer-auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalizedPhone }),
      })
      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        const details = payload?.details ? ` (${payload.details})` : ""
        setError((payload?.error || "تعذر إرسال رمز التحقق") + details)
        return
      }

      setPhone(normalizedPhone)
      setIsOtpSent(true)
    } catch {
      setError("تعذر إرسال رمز التحقق حالياً")
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/customer-auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          code: otpCode.trim(),
        }),
      })
      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        const details = payload?.details ? ` (${payload.details})` : ""
        setError((payload?.error || "تعذر التحقق من الرمز") + details)
        return
      }

      router.push(nextPath)
    } catch {
      setError("تعذر التحقق من الرمز. يرجى المحاولة مرة أخرى")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen">
      <section className="py-12">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md p-8 border border-[#E8E2D1]">
            <h1 className="text-3xl font-bold text-[#2B2520] mb-2">تسجيل الدخول</h1>
            <p className="text-[#8B6F47] mb-8">استخدم رقم الهاتف لإرسال رمز التحقق</p>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
            )}

            {!isOtpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-[#2B2520] mb-2">رقم الهاتف</label>
                  <input
                    type="tel"
                    dir="ltr"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onBlur={() => {
                      const normalized = normalizePhone(phone)
                      if (normalized) setPhone(normalized)
                    }}
                    required
                    className="w-full px-4 py-3 border border-[#D9D4C8] rounded-lg focus:outline-none focus:border-[#E8A835]"
                    placeholder="+201001234567"
                  />
                  <p className="mt-2 text-xs text-[#8B6F47]">يمكنك كتابة الرقم بدون +20 وسنضيفها تلقائياً.</p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full px-8 py-3 bg-[#E8A835] text-white rounded-lg font-bold hover:bg-[#D9941E] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "جاري إرسال الرمز..." : "إرسال رمز التحقق"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-[#2B2520] mb-2">رمز التحقق</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    dir="ltr"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-[#D9D4C8] rounded-lg focus:outline-none focus:border-[#E8A835]"
                    placeholder="123456"
                  />
                  <p className="mt-2 text-xs text-[#8B6F47]">تم إرسال الكود إلى {phone}</p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full px-8 py-3 bg-[#E8A835] text-white rounded-lg font-bold hover:bg-[#D9941E] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "جاري التحقق..." : "تأكيد تسجيل الدخول"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOtpCode("")
                    setIsOtpSent(false)
                  }}
                  className="w-full px-8 py-3 border border-[#D9D4C8] text-[#2B2520] rounded-lg font-semibold hover:bg-[#F5F1E8] transition-colors"
                >
                  تعديل رقم الهاتف
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen">
          <section className="py-12">
            <div className="max-w-md mx-auto px-4">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md p-8 border border-[#E8E2D1]">
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E8A835]" />
                </div>
              </div>
            </div>
          </section>
        </main>
      }
    >
      <SignInContent />
    </Suspense>
  )
}
