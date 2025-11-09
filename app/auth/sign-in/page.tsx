"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Eye, EyeOff } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase"

export default function SignInPage() {
  const router = useRouter()
  const supabase = getSupabaseClient()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

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

  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      <section className="py-12">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white rounded-xl shadow-md p-8 border border-[#E8E2D1]">
            <h1 className="text-3xl font-bold text-[#2B2520] mb-2">تسجيل الدخول</h1>
            <p className="text-[#8B6F47] mb-8">ادخل بيانات حسابك للمتابعة</p>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
            )}

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

      <Footer />
    </main>
  )
}
