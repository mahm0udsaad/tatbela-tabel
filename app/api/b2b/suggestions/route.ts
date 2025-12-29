import 'server-only'

import { NextResponse } from 'next/server'
import { z } from 'zod'

import { getSupabaseAdminClient } from '@/lib/supabase/admin'

const payloadSchema = z.object({
  query: z.string().min(1),
  limit: z.number().int().min(1).max(50).default(10),
})

export async function POST(req: Request) {
  try {
    const json = await req.json()
    const payload = payloadSchema.parse(json)

    const supabase = getSupabaseAdminClient()
    const { data, error } = await supabase.rpc('get_search_suggestions', {
      query_prefix: payload.query.trim(),
      limit_count: payload.limit,
      b2b_mode: true,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: data ?? [] })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid request'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}


