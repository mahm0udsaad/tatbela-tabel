"use client"

import type React from "react"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase"

function SignInContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = getSupabaseClient()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  // Check for error in URL params (from OAuth callback)
  useEffect(() => {
    const errorParam = searchParams.get("error")
    if (errorParam) {
      if (errorParam === "invalid_code") {
        setError("رابط غير صالح أو منتهي الصلاحية. يرجى المحاولة مرة أخرى")
      } else {
        setError(decodeURIComponent(errorParam))
      }
    }
  }, [searchParams])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (signInError) {
        setError(signInError.message)
      } else {
        router.push("/user/orders")
      }
    } catch (err) {
      setError("حدث خطأ ما. يرجى المحاولة مرة أخرى")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError("")
    setIsLoading(true)

    try {
      const origin = typeof window !== "undefined" ? window.location.origin : ""
      const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || origin).replace(/\/$/, "")
      const redirectTo = baseUrl ? `${baseUrl}/auth/callback` : undefined

      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          flowType: "pkce",
          scopes: "email profile",
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      })

      if (oauthError) {
        throw oauthError
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر بدء تسجيل الدخول عبر Google")
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-white">

      <section className="py-12">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white rounded-xl shadow-md p-8 border border-[#E8E2D1]">
            <h1 className="text-3xl font-bold text-[#2B2520] mb-2">تسجيل الدخول</h1>
            <p className="text-[#8B6F47] mb-8">ادخل بيانات حسابك للمتابعة</p>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
            )}

            <div className="space-y-3 mb-6">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-[#D9D4C8] rounded-lg font-semibold text-[#2B2520] hover:bg-[#F5F1E8] transition-colors disabled:opacity-50"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 48 48"
                  className="w-5 h-5"
                  aria-hidden="true"
                >
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6 1.54 7.38 2.83l5.43-5.43C33.64 3.24 29.27 1 24 1 14.82 1 6.93 6.49 3.28 14.09l6.45 5.02C11.44 13.31 17.2 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.5 24.5c0-1.57-.14-3.08-.4-4.5H24v9h12.7c-.55 2.84-2.2 5.26-4.69 6.87l7.58 5.88C43.56 37.71 46.5 31.6 46.5 24.5z" />
                  <path fill="#FBBC05" d="M9.73 28.91c-.45-1.34-.7-2.77-.7-4.25 0-1.48.25-2.91.7-4.25L3.28 14.09C1.79 17.04 1 20.4 1 24s.79 6.96 2.28 9.91l6.45-5z" />
                  <path fill="#34A853" d="M24 47c5.85 0 10.77-1.93 14.36-5.25l-7.58-5.88c-2.09 1.41-4.78 2.25-6.78 2.25-6.8 0-12.56-3.81-15.27-9.32l-6.45 5.02C6.93 41.51 14.82 47 24 47z" />
                  <path fill="none" d="M1 1h46v46H1z" />
                </svg>
                الدخول باستخدام Google
              </button>
              <div className="flex items-center gap-3">
                <span className="flex-1 h-px bg-[#E8E2D1]" />
                <span className="text-xs text-[#8B6F47] font-semibold">أو</span>
                <span className="flex-1 h-px bg-[#E8E2D1]" />
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#2B2520] mb-2">البريد الإلكتروني</label>
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
                <label className="block text-sm font-semibold text-[#2B2520] mb-2">كلمة المرور</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-[#D9D4C8] rounded-lg focus:outline-none focus:border-[#E8A835]"
                    placeholder="كلمة مرورك"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-3 text-[#8B6F47]"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-8 py-3 bg-[#E8A835] text-white rounded-lg font-bold hover:bg-[#D9941E] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "جاري الدخول..." : "تسجيل الدخول"}
              </button>
            </form>

            <p className="text-center text-[#8B6F47] mt-6">
              ليس لديك حساب؟{" "}
              <Link href="/auth/sign-up" className="text-[#E8A835] font-semibold hover:underline">
                إنشاء حساب جديد
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-white">
        <section className="py-12">
          <div className="max-w-md mx-auto px-4">
            <div className="bg-white rounded-xl shadow-md p-8 border border-[#E8E2D1]">
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E8A835]"></div>
              </div>
            </div>
          </div>
        </section>
      </main>
    }>
      <SignInContent />
    </Suspense>
  )
}
