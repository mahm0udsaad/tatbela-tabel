import { createClient } from "@supabase/supabase-js"

let supabaseAdminClient: ReturnType<typeof createClient> | null = null

export function getSupabaseAdminClient() {
  if (supabaseAdminClient) return supabaseAdminClient

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable")
  }

  supabaseAdminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  return supabaseAdminClient
}


