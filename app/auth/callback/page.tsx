import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export default async function AuthCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const code = typeof params.code === "string" ? params.code : null
  const next = typeof params.next === "string" ? params.next : "/user/orders"
  const errorDescription = typeof params.error_description === "string" ? params.error_description : null

  console.log("=== SERVER-SIDE AUTH CALLBACK DEBUG ===")
  console.log("1. Code received:", code ? `${code.substring(0, 10)}...` : "NO CODE")
  console.log("2. Next URL:", next)
  console.log("3. Error from URL:", errorDescription)

  // Handle error from URL params
  if (errorDescription) {
    console.error("❌ Error from URL params:", errorDescription)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F3EB] px-4">
        <div className="max-w-md w-full bg-white border border-[#E8E2D1] rounded-2xl p-8 text-center shadow-lg">
          <div className="h-16 w-16 mx-auto mb-6 rounded-full flex items-center justify-center bg-[#FFF7E1] text-red-500 text-2xl">
            ⚠️
          </div>
          <h1 className="text-2xl font-bold text-[#2B2520] mb-4">تعذر التحقق</h1>
          <p className="text-[#6B5B4A] leading-relaxed mb-6">{decodeURIComponent(errorDescription)}</p>
          <a
            href="/auth/sign-in"
            className="inline-block w-full py-3 bg-[#E8A835] text-white rounded-lg font-semibold hover:bg-[#D9941E]"
          >
            العودة إلى تسجيل الدخول
          </a>
        </div>
      </div>
    )
  }

  // Validate code exists
  if (!code) {
    console.error("❌ No code found in URL")
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F3EB] px-4">
        <div className="max-w-md w-full bg-white border border-[#E8E2D1] rounded-2xl p-8 text-center shadow-lg">
          <div className="h-16 w-16 mx-auto mb-6 rounded-full flex items-center justify-center bg-[#FFF7E1] text-red-500 text-2xl">
            ⚠️
          </div>
          <h1 className="text-2xl font-bold text-[#2B2520] mb-4">تعذر التحقق</h1>
          <p className="text-[#6B5B4A] leading-relaxed mb-6">هذا الرابط غير صالح أو منتهي الصلاحية.</p>
          <a
            href="/auth/sign-in"
            className="inline-block w-full py-3 bg-[#E8A835] text-white rounded-lg font-semibold hover:bg-[#D9941E]"
          >
            العودة إلى تسجيل الدخول
          </a>
        </div>
      </div>
    )
  }

  // Exchange code for session on the server
  console.log("4. Creating server-side Supabase client...")
  const supabase = await createClient()

  console.log("5. Exchanging code for session...")
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  console.log("6. Exchange response:")
  console.log("   - Has data:", !!data)
  console.log("   - Has error:", !!error)

  if (data?.session) {
    console.log("   - Session created successfully:")
    console.log("     - User ID:", data.session.user.id)
    console.log("     - Email:", data.session.user.email)
    console.log("     - Expires:", new Date(data.session.expires_at! * 1000).toLocaleString())
  }

  if (error) {
    console.error("❌ Exchange error:", {
      message: error.message,
      status: error.status,
      name: error.name,
    })
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F3EB] px-4">
        <div className="max-w-md w-full bg-white border border-[#E8E2D1] rounded-2xl p-8 text-center shadow-lg">
          <div className="h-16 w-16 mx-auto mb-6 rounded-full flex items-center justify-center bg-[#FFF7E1] text-red-500 text-2xl">
            ⚠️
          </div>
          <h1 className="text-2xl font-bold text-[#2B2520] mb-4">تعذر التحقق</h1>
          <p className="text-[#6B5B4A] leading-relaxed mb-6">{error.message}</p>
          <a
            href="/auth/sign-in"
            className="inline-block w-full py-3 bg-[#E8A835] text-white rounded-lg font-semibold hover:bg-[#D9941E]"
          >
            العودة إلى تسجيل الدخول
          </a>
        </div>
      </div>
    )
  }

  // Success! Redirect to the next page
  console.log("✅ Auth successful! Redirecting to:", next)
  redirect(next)
}
