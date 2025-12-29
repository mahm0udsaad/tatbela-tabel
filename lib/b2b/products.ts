import 'server-only'

import { getSupabaseAdminClient } from '@/lib/supabase/admin'

const B2B_STORE_SELECT = `
  id,
  name_ar,
  description_ar,
  brand,
  type,
  price,
  original_price,
  rating,
  reviews_count,
  stock,
  category_id,
  created_at,
  is_featured,
  is_b2b,
  b2b_price_hidden,
  product_images (image_url, is_primary),
  product_variants (stock)
`

const B2B_PRODUCT_SELECT = `
  id,
  name_ar,
  description_ar,
  brand,
  price,
  price_per_kilo,
  pricing_mode,
  original_price,
  rating,
  reviews_count,
  stock,
  category_id,
  is_featured,
  is_b2b,
  b2b_price_hidden,
  product_images (id, image_url, is_primary),
  product_variants (id, sku, size, weight, variant_type, price, stock)
`

export async function fetchB2BStoreProducts() {
  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase
    .from('products')
    .select(B2B_STORE_SELECT)
    .eq('is_archived', false)
    .eq('is_b2b', true)
    .order('sort_order', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function fetchB2BProductById(id: string) {
  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase
    .from('products')
    .select(B2B_PRODUCT_SELECT)
    .eq('id', id)
    .eq('is_b2b', true)
    .single()

  if (error) throw error
  return data
}

export async function fetchB2BSimilarProducts(args: { categoryId: string; excludeId: string; limit?: number }) {
  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase
    .from('products')
    .select(B2B_PRODUCT_SELECT)
    .eq('category_id', args.categoryId)
    .eq('is_archived', false)
    .eq('is_b2b', true)
    .neq('id', args.excludeId)
    .limit(args.limit ?? 8)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function fetchB2BApprovedReviews(productId: string) {
  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase
    .from('product_reviews')
    .select('id, rating, title, content, created_at')
    .eq('product_id', productId)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}


