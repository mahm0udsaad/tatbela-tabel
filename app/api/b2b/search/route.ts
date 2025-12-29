import 'server-only'

import { NextResponse } from 'next/server'
import { z } from 'zod'

import { getSupabaseAdminClient } from '@/lib/supabase/admin'

const payloadSchema = z.object({
  query: z.string().optional().nullable(),
  categoryIds: z.array(z.string().uuid()).optional().nullable(),
  brands: z.array(z.string().min(1)).optional().nullable(),
  priceMin: z.number().optional().nullable(),
  priceMax: z.number().optional().nullable(),
  limit: z.number().int().min(1).max(200).default(50),
  offset: z.number().int().min(0).default(0),
  sortBy: z.string().optional().nullable(),
})

export async function POST(req: Request) {
  try {
    const json = await req.json()
    const payload = payloadSchema.parse(json)

    const supabase = getSupabaseAdminClient()
    const { data, error } = await supabase.rpc('search_products_enhanced', {
      search_query: payload.query?.trim() ? payload.query.trim() : null,
      category_ids: payload.categoryIds?.length ? payload.categoryIds : null,
      brand_filter: payload.brands?.length ? payload.brands : null,
      price_min: payload.priceMin ?? null,
      price_max: payload.priceMax ?? null,
      b2b_mode: true,
      limit_count: payload.limit,
      offset_count: payload.offset,
      sort_by: payload.sortBy ?? 'relevance',
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      data: data ?? [],
      count: (data ?? []).length,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid request'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}


