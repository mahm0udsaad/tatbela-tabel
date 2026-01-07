'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'

export type CartProductImage = {
  image_url: string | null
  is_primary: boolean | null
  sort_order: number | null
}

export type CartVariant = {
  id: string
  weight: number | null
  size: string | null
  variant_type: string | null
  price: number | null
}

export type CartItem = {
  id: string
  product_id: string
  product_variant_id?: string | null
  unit_price: number | null
  quantity: number
  variant: CartVariant | null
  product: {
    id: string
    name: string
    name_ar: string
    price: number
    image_url: string | null
    brand: string
    category: string
    is_b2b?: boolean
    has_tax?: boolean
    product_images: CartProductImage[] | null
  }
}

export type Cart = {
  id: string
  items: CartItem[]
  subtotal: number
  channel: CartChannel
  freeShipping?: {
    eligible: boolean
    threshold: number | null
    expiresAt: string | null
  } | null
}

export type CartChannel = 'b2c' | 'b2b'

const CART_COOKIE_BY_CHANNEL: Record<CartChannel, string> = {
  b2c: 'cartId',
  b2b: 'b2bCartId',
}

const isRuleActive = (rule: any | null) => {
  if (!rule) return false
  if (!rule.is_active) return false
  if (rule.expires_at && new Date(rule.expires_at).getTime() <= Date.now()) return false
  return true
}

export async function getCart(channel: CartChannel = 'b2c'): Promise<Cart | null> {
  const supabase = await createClient()
  const cookieStore = await cookies()
  const cartCookieKey = CART_COOKIE_BY_CHANNEL[channel]
  const cartId = cookieStore.get(cartCookieKey)?.value
  const { data: { user } } = await supabase.auth.getUser()

  // NOTE: B2B product data is fetched via service role on the server to guarantee isolation
  // after tightening public RLS. So we avoid joining products/product_variants for the b2b cart.
  let query = supabase.from('carts').select(
    channel === 'b2b'
      ? `
        id,
        channel,
        cart_items (
          id,
          product_id,
          product_variant_id,
          unit_price,
          quantity
        )
      `
      : `
        id,
        channel,
        cart_items (
          id,
          product_id,
          product_variant_id,
          unit_price,
          quantity,
          product_variants (
            id,
            weight,
            size,
            variant_type,
            price
          ),
          products (
            id,
            name,
            name_ar,
            price,
            image_url,
            brand,
            category,
            is_b2b,
            has_tax,
            product_images (
              image_url,
              is_primary,
              sort_order
            )
          )
        )
      `,
  )

  if (user) {
    query = query.eq('user_id', user.id).eq('status', 'active').eq('channel', channel)
  } else if (cartId) {
    query = query.eq('id', cartId).eq('status', 'active').eq('channel', channel)
  } else {
    return null
  }

  const { data, error } = await query.single()

  if (error || !data) {
    return null
  }

  let items: CartItem[] = []

  if (channel === 'b2b') {
    const rawItems = (data.cart_items ?? []) as Array<{
      id: string
      product_id: string
      product_variant_id?: string | null
      unit_price?: number | null
      quantity: number
    }>

    const productIds = Array.from(new Set(rawItems.map((i) => i.product_id).filter(Boolean)))
    const variantIds = Array.from(
      new Set(rawItems.map((i) => i.product_variant_id).filter((v): v is string => Boolean(v))),
    )

    const admin = getSupabaseAdminClient()
    const [{ data: productsData, error: productsError }, { data: variantsData, error: variantsError }] =
      await Promise.all([
        productIds.length
          ? admin
              .from('products')
              .select(
                `
                id,
                name,
                name_ar,
                price,
                image_url,
                brand,
                category,
                is_b2b,
                b2b_price_hidden,
                has_tax,
                product_images (
                  image_url,
                  is_primary,
                  sort_order
                )
              `,
              )
              .in('id', productIds)
          : Promise.resolve({ data: [], error: null } as any),
        variantIds.length
          ? admin
              .from('product_variants')
              .select('id, weight, size, variant_type, price')
              .in('id', variantIds)
          : Promise.resolve({ data: [], error: null } as any),
      ])

    if (productsError) throw productsError
    if (variantsError) throw variantsError

    const productsById = new Map((productsData ?? []).map((p: any) => [p.id, p]))
    const variantsById = new Map((variantsData ?? []).map((v: any) => [v.id, v]))

    items = rawItems
      .map((item) => {
        const product = productsById.get(item.product_id)
        if (!product) return null
        if (product.is_b2b !== true) return null
        const variant = item.product_variant_id ? variantsById.get(item.product_variant_id) ?? null : null
        return {
          id: item.id,
          product_id: item.product_id,
          product_variant_id: item.product_variant_id ?? null,
          unit_price: item.unit_price ?? variant?.price ?? product.price,
          quantity: item.quantity,
          variant,
          product: {
            ...product,
            product_images: product.product_images ?? null,
          },
        } as CartItem
      })
      .filter((x): x is CartItem => Boolean(x))
  } else {
    items = (data.cart_items ?? [])
      .filter((item: any) => {
        if (!item.products) return false
        if (channel === 'b2c' && item.products.is_b2b) return false
        if (channel === 'b2b' && item.products.is_b2b === false) return false
        return true
      })
      .map((item: any) => ({
        id: item.id,
        product_id: item.product_id,
        product_variant_id: item.product_variant_id ?? null,
        unit_price: item.unit_price ?? item.product_variants?.price ?? item.products.price,
        quantity: item.quantity,
        variant: item.product_variants ?? null,
        product: {
          ...item.products,
          product_images: item.products.product_images ?? null,
        },
      }))
  }

  const subtotal = items.reduce((sum: number, item: CartItem) => {
    const priceToUse = item.unit_price ?? item.variant?.price ?? item.product.price
    return sum + priceToUse * item.quantity
  }, 0)

  let freeShipping: Cart['freeShipping'] = null
  if (channel === 'b2c') {
    const { data: rule } = await supabase
      .from('free_shipping_rules')
      .select('threshold_amount, expires_at, is_active')
      .in('applies_to', ['b2c', 'all'])
      .order('applies_to', { ascending: false })
      .limit(1)
      .maybeSingle()

    const active = isRuleActive(rule)
    freeShipping = active
      ? {
          eligible: subtotal >= Number(rule?.threshold_amount ?? 0),
          threshold: Number(rule?.threshold_amount ?? 0),
          expiresAt: rule?.expires_at ?? null,
        }
      : null
  }

  return {
    id: data.id,
    items,
    subtotal,
    channel,
    freeShipping,
  }
}

export async function addToCart(
  productId: string,
  quantity: number = 1,
  productVariantId?: string | null,
  channel: CartChannel = 'b2c'
) {
  const supabase = await createClient()
  const cookieStore = await cookies()
  const cartCookieKey = CART_COOKIE_BY_CHANNEL[channel]
  let cartId = cookieStore.get(cartCookieKey)?.value
  const { data: { user } } = await supabase.auth.getUser()

  // If no cart, create one
  let cartIdToUse = cartId

  if (!cartId && !user) {
    // Create new guest cart
    const { data: newCart, error: createError } = await supabase
      .from('carts')
      .insert([{ status: 'active', channel }])
      .select('id')
      .single()
    
    if (createError) throw createError
    cartIdToUse = newCart.id
    
    // Set cookie
    cookieStore.set(cartCookieKey, cartIdToUse, { 
      path: '/',
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 30 // 30 days
    })
  } else if (user) {
    // Check if user has active cart
    const { data: userCart } = await supabase
      .from('carts')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .eq('channel', channel)
      .single()
    
    if (userCart) {
      cartIdToUse = userCart.id
    } else {
      // Create user cart
      const { data: newCart, error: createError } = await supabase
        .from('carts')
        .insert([{ user_id: user.id, status: 'active', channel }])
        .select('id')
        .single()
      
      if (createError) throw createError
      cartIdToUse = newCart.id
    }
  }

  // Fetch product and optional variant to snapshot price and validate stock
  const { data: product } =
    channel === 'b2b'
      ? await getSupabaseAdminClient()
          .from('products')
          .select('id, price, stock, is_b2b, b2b_price_hidden')
          .eq('id', productId)
          .single()
      : await supabase.from('products').select('id, price, stock, is_b2b, b2b_price_hidden').eq('id', productId).single()

  if (!product) {
    throw new Error('المنتج غير متوفر')
  }

  if (channel === 'b2c' && product.is_b2b) {
    throw new Error('هذا المنتج مخصص لمنتجات الجملة')
  }

  if (channel === 'b2b' && !product.is_b2b) {
    throw new Error('هذا المنتج متاح للقطاع الفردي فقط')
  }

  if (channel === 'b2b' && product.b2b_price_hidden) {
    throw new Error('يرجى التواصل مع المبيعات لإتمام هذا الطلب')
  }

  let variantData: { id: string; price: number | null; stock: number | null } | null = null
  if (productVariantId) {
    const { data: variant } =
      channel === 'b2b'
        ? await getSupabaseAdminClient()
            .from('product_variants')
            .select('id, price, stock')
            .eq('id', productVariantId)
            .eq('product_id', productId)
            .single()
        : await supabase
            .from('product_variants')
            .select('id, price, stock')
            .eq('id', productVariantId)
            .eq('product_id', productId)
            .single()

    if (!variant) {
      throw new Error('هذا المتغير غير متاح')
    }
    variantData = variant
  }

  const snapshotPrice = variantData?.price ?? product.price

  // Now add item to cart
  let existingItemQuery = supabase
    .from('cart_items')
    .select('id, quantity, product_variant_id')
    .eq('cart_id', cartIdToUse)
    .eq('product_id', productId)

  if (productVariantId) {
    existingItemQuery = existingItemQuery.eq('product_variant_id', productVariantId)
  } else {
    existingItemQuery = existingItemQuery.is('product_variant_id', null)
  }

  const { data: existingItem } = await existingItemQuery.maybeSingle()

  if (existingItem) {
    const updates: Record<string, any> = {
      quantity: existingItem.quantity + quantity,
      updated_at: new Date().toISOString(),
      unit_price: snapshotPrice,
    }

    // Persist variant selection (keeps items separated by variant)
    updates.product_variant_id = productVariantId ?? null

    const { error } = await supabase.from('cart_items').update(updates).eq('id', existingItem.id)
    if (error) throw error
  } else {
    const { error } = await supabase.from('cart_items').insert({
      cart_id: cartIdToUse,
      product_id: productId,
      product_variant_id: productVariantId ?? null,
      unit_price: snapshotPrice,
      quantity: quantity,
    })

    if (error) throw error
  }

  // Update cart timestamp
  await supabase
    .from('carts')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', cartIdToUse)
    
  return { success: true }
}

export async function updateCartItemQuantity(itemId: string, quantity: number) {
  const supabase = await createClient()
  
  if (quantity <= 0) {
    return removeItemFromCart(itemId)
  }

  const { error } = await supabase
    .from('cart_items')
    .update({ quantity, updated_at: new Date().toISOString() })
    .eq('id', itemId)

  if (error) throw error
  return { success: true }
}

export async function removeItemFromCart(itemId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('id', itemId)

  if (error) throw error
  return { success: true }
}

export async function clearCart(channel: CartChannel = 'b2c') {
  const supabase = await createClient()
  const cookieStore = await cookies()
  const cartCookieKey = CART_COOKIE_BY_CHANNEL[channel]
  const cartIdCookie = cookieStore.get(cartCookieKey)?.value
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let cartIdToClear: string | null = null

  if (user) {
    const { data: userCart, error } = await supabase
      .from('carts')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .eq('channel', channel)
      .maybeSingle()

    if (error) throw error
    cartIdToClear = userCart?.id ?? null
  } else if (cartIdCookie) {
    cartIdToClear = cartIdCookie
  }

  if (!cartIdToClear) {
    if (cartIdCookie) {
      cookieStore.delete(cartCookieKey)
    }
    return { success: true }
  }

  const { error: deleteError } = await supabase.from('cart_items').delete().eq('cart_id', cartIdToClear)
  if (deleteError) throw deleteError

  await supabase.from('carts').update({ updated_at: new Date().toISOString() }).eq('id', cartIdToClear)

  if (!user && cartIdCookie) {
    cookieStore.delete(cartCookieKey)
  }

  return { success: true }
}

