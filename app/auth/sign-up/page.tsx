"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase"

export default function SignUpPage() {
  const router = useRouter()
  const supabase = getSupabaseClient()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    if (formData.password !== formData.confirmPassword) {
      setError("كلمات المرور غير متطابقة")
      setIsLoading(false)
      return
    }

    try {
      // Clear any old PKCE code verifiers from other Supabase projects
      const currentProjectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
      const currentProjectId = currentProjectUrl.split("//")[1]?.split(".")[0]
      
      console.log("=== SIGN UP DEBUG ===")
      console.log("0. Current Supabase URL:", currentProjectUrl)
      console.log("0a. Current Project ID:", currentProjectId)
      
      // Clean up old code verifiers
      const allCookies = document.cookie.split("; ")
      allCookies.forEach(cookie => {
        const cookieName = cookie.split("=")[0]
        if (cookieName.includes("code-verifier") && currentProjectId && !cookieName.includes(currentProjectId)) {
          console.log("   - Removing old code-verifier:", cookieName)
          document.cookie = `${cookieName}=; max-age=0; path=/`
        }
      })
      
      console.log("1. Starting sign up for:", formData.email)
      console.log("2. Redirect URL:", `${window.location.origin}/auth/callback`)
      
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      console.log("3. Sign up response received")
      console.log("   - Has data:", !!data)
      console.log("   - Has error:", !!signUpError)
      
      if (data?.user) {
        console.log("   - User created:", {
          id: data.user.id,
          email: data.user.email,
          confirmed: data.user.email_confirmed_at ? "Yes" : "No"
        })
      }
      
      if (data?.session) {
        console.log("   - Session created immediately:", !!data.session)
      } else {
        console.log("   - No session (email confirmation required)")
      }

      if (signUpError) {
        console.error("❌ Sign up error:", signUpError.message)
        setError(signUpError.message)
      } else {
        // Check cookies after sign up
        const allCookies = document.cookie.split('; ').reduce((acc, cookie) => {
          const [key, value] = cookie.split('=')
          acc[key] = value
          return acc
        }, {} as Record<string, string>)
        
        const pkceKeys = Object.keys(allCookies).filter(key => 
          key.includes('code-verifier') || 
          key.includes('pkce') || 
          key.includes('supabase')
        )
        
        console.log("4. Cookies after sign up:")
        console.log("   - Total cookies:", Object.keys(allCookies).length)
        console.log("   - PKCE-related:", pkceKeys.length > 0 ? pkceKeys : "NONE")
        if (pkceKeys.length > 0) {
          pkceKeys.forEach(key => {
            console.log(`   - ${key}: ${allCookies[key]?.substring(0, 30)}...`)
          })
        }
        
        console.log("✅ Sign up successful! Redirecting to verify-email page")
        router.push("/auth/verify-email")
      }
    } catch (err) {
      console.error("❌ Unexpected error during sign up:", err)
      setError("حدث خطأ ما. يرجى المحاولة مرة أخرى")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-white">

      <section className="py-12">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white rounded-xl shadow-md p-8 border border-[#E8E2D1]">
            <h1 className="text-3xl font-bold text-[#2B2520] mb-2">إنشاء حساب جديد</h1>
            <p className="text-[#8B6F47] mb-8">انضم إلينا اليوم واستمتع بأفضل التوابل المصرية</p>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#2B2520] mb-2">الاسم الأول</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-[#D9D4C8] rounded-lg focus:outline-none focus:border-[#E8A835]"
                    placeholder="اسمك"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#2B2520] mb-2">الاسم الأخير</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-[#D9D4C8] rounded-lg focus:outline-none focus:border-[#E8A835]"
                    placeholder="اسم العائلة"
                  />
                </div>
              </div>

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

              <div>
                <label className="block text-sm font-semibold text-[#2B2520] mb-2">تأكيد كلمة المرور</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-[#D9D4C8] rounded-lg focus:outline-none focus:border-[#E8A835]"
                    placeholder="تأكيد كلمة المرور"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute left-3 top-3 text-[#8B6F47]"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-8 py-3 bg-[#E8A835] text-white rounded-lg font-bold hover:bg-[#D9941E] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "جاري الإنشاء..." : "إنشاء حساب"}
              </button>
            </form>

            <p className="text-center text-[#8B6F47] mt-6">
              هل لديك حساب بالفعل؟{" "}
              <Link href="/auth/sign-in" className="text-[#E8A835] font-semibold hover:underline">
                تسجيل الدخول
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
