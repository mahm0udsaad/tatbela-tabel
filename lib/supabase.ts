import { createBrowserClient } from "@supabase/ssr"

let supabaseClient: ReturnType<typeof createBrowserClient> | null = null

export function getSupabaseClient() {
  if (!supabaseClient) {
    supabaseClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            if (typeof document === "undefined") return undefined
            const value = document.cookie
              .split("; ")
              .find((row) => row.startsWith(`${name}=`))
              ?.split("=")[1]
            console.log(`[Cookie Get] ${name}:`, value ? `${value.substring(0, 20)}...` : "NOT FOUND")
            return value
          },
          set(name: string, value: string, options: any) {
            if (typeof document === "undefined") return
            console.log(`[Cookie Set] ${name}:`, value.substring(0, 20), "... options:", options)
            
            let cookie = `${name}=${value}`
            
            // Handle all cookie options properly
            if (options?.maxAge) {
              cookie += `; max-age=${options.maxAge}`
            }
            if (options?.expires) {
              cookie += `; expires=${options.expires}`
            }
            if (options?.path !== undefined) {
              cookie += `; path=${options.path}`
            } else {
              cookie += `; path=/`
            }
            if (options?.domain) {
              cookie += `; domain=${options.domain}`
            }
            if (options?.sameSite) {
              cookie += `; samesite=${options.sameSite}`
            }
            // Note: httpOnly and secure cannot be set from JavaScript
            
            document.cookie = cookie
            console.log(`[Cookie Set] Result:`, cookie)
          },
          remove(name: string, options: any) {
            if (typeof document === "undefined") return
            console.log(`[Cookie Remove] ${name}`)
            const path = options?.path || "/"
            document.cookie = `${name}=; max-age=0; path=${path}`
          },
        },
      }
    )
  }
  return supabaseClient
}
