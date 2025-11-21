import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        const allCookies = cookieStore.getAll()
        
        const pkceKeys = allCookies.filter(c => 
          c.name.includes('code-verifier') || 
          c.name.includes('auth-token')
        )
        
        return allCookies
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch (e) {
          console.error("[Server Cookie] Error setting cookies:", e)
          // Ignore errors in Server Components
        }
      },
    },
  })
}
