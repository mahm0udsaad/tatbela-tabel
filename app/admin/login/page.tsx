"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase"

export default function AdminLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = getSupabaseClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) throw authError

      // Verify user is admin
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", data.user?.id)
        .single()

      if (profileError || !profile?.is_admin) {
        await supabase.auth.signOut()
        throw new Error("أنت غير مخول للدخول")
      }

      router.push("/admin/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطأ في تسجيل الدخول")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2B2520] to-[#1a1815] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-[#2B2520] mb-2 text-center">لوحة التحكم</h1>
        <p className="text-center text-[#8B6F47] mb-8">تسجيل دخول الإدارة</p>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-[#2B2520] mb-2">البريد الإلكتروني</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@tatbeelah.com"
              className="w-full px-4 py-2 border border-[#D9D4C8] rounded-lg focus:outline-none focus:border-[#E8A835]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#2B2520] mb-2">كلمة المرور</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2 border border-[#D9D4C8] rounded-lg focus:outline-none focus:border-[#E8A835]"
              required
            />
          </div>

          {error && <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-[#E8A835] text-white font-bold rounded-lg hover:bg-[#D9941E] transition-colors disabled:opacity-50"
          >
            {isLoading ? "جاري الدخول..." : "تسجيل الدخول"}
          </button>
        </form>
      </div>
    </div>
  )
}
