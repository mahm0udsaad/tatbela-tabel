import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        const allCookies = cookieStore.getAll()
        console.log("[Server Cookie] getAll called, found", allCookies.length, "cookies")
        
        const pkceKeys = allCookies.filter(c => 
          c.name.includes('code-verifier') || 
          c.name.includes('auth-token')
        )
        
        if (pkceKeys.length > 0) {
          console.log("[Server Cookie] Auth-related cookies:")
          pkceKeys.forEach(c => {
            console.log(`  - ${c.name}: ${c.value.substring(0, 20)}...`)
          })
        }
        
        return allCookies
      },
      setAll(cookiesToSet) {
        try {
          console.log("[Server Cookie] setAll called with", cookiesToSet.length, "cookies")
          cookiesToSet.forEach(({ name, value, options }) => {
            console.log(`  - Setting: ${name}`)
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
