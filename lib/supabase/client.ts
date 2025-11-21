import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const value = document.cookie
            .split("; ")
            .find((row) => row.startsWith(`${name}=`))
            ?.split("=")[1]
          return value
        },
        set(name: string, value: string, options: any) {
          
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
          
          document.cookie = cookie
        },
        remove(name: string, options: any) {
          const path = options?.path || "/"
          document.cookie = `${name}=; max-age=0; path=${path}`
        },
      },
    }
  )
}
