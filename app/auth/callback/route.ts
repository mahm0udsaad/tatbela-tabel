import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/user/orders"
  const errorDescription = searchParams.get("error_description")

  console.log("=== SERVER-SIDE AUTH CALLBACK DEBUG ===")
  console.log("1. Code received:", code ? `${code.substring(0, 10)}...` : "NO CODE")
  console.log("2. Next URL:", next)
  console.log("3. Error from URL:", errorDescription)

  // Handle error from URL params
  if (errorDescription) {
    console.error("❌ Error from URL params:", errorDescription)
    return NextResponse.redirect(`${origin}/auth/sign-in?error=${encodeURIComponent(errorDescription)}`)
  }

  // Validate code exists
  if (!code) {
    console.error("❌ No code found in URL")
    return NextResponse.redirect(`${origin}/auth/sign-in?error=invalid_code`)
  }

  // Exchange code for session
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
    return NextResponse.redirect(`${origin}/auth/sign-in?error=${encodeURIComponent(error.message)}`)
  }

  // Success! Redirect to the next page
  console.log("✅ Auth successful! Redirecting to:", next)
  return NextResponse.redirect(`${origin}${next}`)
}

