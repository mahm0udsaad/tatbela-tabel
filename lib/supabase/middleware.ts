import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const isAdminRoute = pathname.startsWith("/admin")
  const isAdminLoginRoute = pathname === "/admin/login"

  // Protect admin routes (but allow unauthenticated access to the login screen)
  if (isAdminRoute && !isAdminLoginRoute) {
    if (!user) {
      console.log("[Middleware] No user, redirecting to /admin/login")
      const url = request.nextUrl.clone()
      url.pathname = "/admin/login"
      return NextResponse.redirect(url)
    }

    // Check if user is admin
    console.log("[Middleware] Checking admin status for user:", user.id)
    const { data: profile, error } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single()

    console.log("[Middleware] Profile query result:", { 
      profile, 
      error: error?.message,
      is_admin: profile?.is_admin 
    })

    if (!profile?.is_admin) {
      console.log("[Middleware] User is not admin, redirecting to /")
      return NextResponse.redirect(new URL("/", request.url))
    }
    
    console.log("[Middleware] User is admin, allowing access")
  }

  return supabaseResponse
}
