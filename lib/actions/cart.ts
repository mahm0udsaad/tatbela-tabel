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

const buildCartItemKey = (productId: string, variantId?: string | null) =>
  `${productId}::${variantId ?? 'no-variant'}`

async function mergeGuestCartIntoUserCart(params: {
  channel: CartChannel
  userId: string
  guestCartId: string
  supabase: Awaited<ReturnType<typeof createClient>>
}) {
  const { channel, userId, guestCartId, supabase } = params
  const admin = getSupabaseAdminClient()
  const cookieStore = await cookies()
  const cartCookieKey = CART_COOKIE_BY_CHANNEL[channel]

  const { data: guestCart, error: guestCartError } = await (admin
    .from('carts')
    .select(
      `
        id,
        cart_items (
          id,
          product_id,
          product_variant_id,
          quantity,
          unit_price
        )
      `,
    )
    .eq('id', guestCartId)
    .eq('status', 'active')
    .eq('channel', channel)
    .maybeSingle()) as any

  if (guestCartError) throw guestCartError
  if (!guestCart) {
    cookieStore.delete(cartCookieKey)
    return
  }

  const guestItems: Array<{
    product_id: string
    product_variant_id: string | null
    quantity: number
    unit_price: number | null
  }> = (guestCart as any).cart_items ?? []
  if (guestItems.length === 0) {
    await admin.from('carts').delete().eq('id', guestCartId)
    cookieStore.delete(cartCookieKey)
    return
  }

  const { data: userCart, error: userCartError } = await (supabase
    .from('carts')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .eq('channel', channel)
    .maybeSingle()) as any

  if (userCartError) throw userCartError

  let userCartId = (userCart as any)?.id as string | undefined

  if (!userCartId) {
    const { data: createdUserCart, error: createUserCartError } = await (supabase
      .from('carts')
      .insert([{ user_id: userId, status: 'active', channel }])
      .select('id')
      .single()) as any

    if (createUserCartError) throw createUserCartError
    userCartId = createdUserCart.id
  }

  const { data: userCartItems, error: userCartItemsError } = await (supabase
    .from('cart_items')
    .select('id, product_id, product_variant_id, quantity')
    .eq('cart_id', userCartId)) as any

  if (userCartItemsError) throw userCartItemsError

  const existingItemsByKey = new Map(
    ((userCartItems ?? []) as any[]).map((item) => [
      buildCartItemKey(item.product_id, item.product_variant_id),
      item,
    ]),
  )

  for (const guestItem of guestItems) {
    const itemKey = buildCartItemKey(guestItem.product_id, guestItem.product_variant_id)
    const existingItem = existingItemsByKey.get(itemKey)

    if (existingItem) {
      const { error: updateItemError } = await supabase
        .from('cart_items')
        .update({
          quantity: existingItem.quantity + guestItem.quantity,
          unit_price: guestItem.unit_price,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingItem.id)

      if (updateItemError) throw updateItemError
      continue
    }

    const { error: insertItemError } = await supabase.from('cart_items').insert({
      cart_id: userCartId,
      product_id: guestItem.product_id,
      product_variant_id: guestItem.product_variant_id ?? null,
      quantity: guestItem.quantity,
      unit_price: guestItem.unit_price,
    })

    if (insertItemError) throw insertItemError
  }

  await Promise.all([
    admin.from('cart_items').delete().eq('cart_id', guestCartId),
    admin.from('carts').delete().eq('id', guestCartId),
    supabase.from('carts').update({ updated_at: new Date().toISOString() }).eq('id', userCartId),
  ])

  cookieStore.delete(cartCookieKey)
}

const isRuleActive = (rule: any | null) => {
  if (!rule) return false
  if (!rule.is_active) return false
  if (rule.expires_at && new Date(rule.expires_at).getTime() <= Date.now()) return false
  return true
}

export async function getCart(channel: CartChannel = 'b2c', overrideCartId?: string): Promise<Cart | null> {
  const supabase = await createClient()
  const cookieStore = await cookies()
  const cartCookieKey = CART_COOKIE_BY_CHANNEL[channel]
  const cartId = overrideCartId || cookieStore.get(cartCookieKey)?.value
  const { data: { user } } = await supabase.auth.getUser()

  if (user && cartId && cartId !== overrideCartId) {
    await mergeGuestCartIntoUserCart({
      channel,
      userId: user.id,
      guestCartId: cartId,
      supabase,
    })
  }

  // Use admin client for guest carts since RLS blocks anonymous access
  const dbClient = user ? supabase : getSupabaseAdminClient()
  const admin = getSupabaseAdminClient()

  let query = dbClient.from('carts').select(`
    id,
    channel,
    cart_items (
      id,
      product_id,
      product_variant_id,
      unit_price,
      quantity
    )
  `)

  if (user) {
    query = query.eq('user_id', user.id).eq('status', 'active').eq('channel', channel)
  } else if (cartId) {
    query = query.eq('id', cartId).eq('status', 'active').eq('channel', channel)
  } else {
    return null
  }

  const { data, error } = await query.maybeSingle()

  if (error || !data) {
    return null
  }

  const rawItems = (data.cart_items ?? []) as Array<{
    id: string
    product_id: string
    product_variant_id?: string | null
    unit_price?: number | null
    quantity: number
  }>

  if (rawItems.length === 0) {
    return {
      id: data.id,
      items: [],
      subtotal: 0,
      channel,
      freeShipping: null,
    }
  }

  const productIds = Array.from(new Set(rawItems.map((i) => i.product_id).filter(Boolean)))
  const variantIds = Array.from(
    new Set(rawItems.map((i) => i.product_variant_id).filter((v): v is string => Boolean(v))),
  )

  const [
    { data: productsData },
    { data: offersData },
    { data: productVariantsData },
    { data: offerVariantsData },
  ] = await Promise.all([
    productIds.length
      ? admin
          .from('products')
          .select(`
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
          `)
          .in('id', productIds)
      : Promise.resolve({ data: [] } as any),
    productIds.length
      ? admin
          .from('offers')
          .select(`
            id,
            name,
            name_ar,
            price,
            brand,
            has_tax,
            is_archived,
            offer_images (
              image_url,
              is_primary,
              sort_order
            )
          `)
          .in('id', productIds)
      : Promise.resolve({ data: [] } as any),
    variantIds.length
      ? admin
          .from('product_variants')
          .select('id, weight, size, variant_type, price')
          .in('id', variantIds)
      : Promise.resolve({ data: [] } as any),
    variantIds.length
      ? admin
          .from('offer_variants')
          .select('id, weight, size, variant_type, price')
          .in('id', variantIds)
      : Promise.resolve({ data: [] } as any),
  ])

  const productsById = new Map((productsData ?? []).map((p: any) => [p.id, p]))
  const offersById = new Map((offersData ?? []).map((o: any) => [o.id, o]))
  const variantsById = new Map((productVariantsData ?? []).map((v: any) => [v.id, v]))
  const offerVariantsById = new Map((offerVariantsData ?? []).map((v: any) => [v.id, v]))

  const items: CartItem[] = rawItems
    .map((item) => {
      let productObj: any = productsById.get(item.product_id)
      let variantObj: any = item.product_variant_id ? variantsById.get(item.product_variant_id) ?? null : null

      if (!productObj) {
        const offer = offersById.get(item.product_id)
        if (!offer || offer.is_archived) return null
        productObj = {
          id: offer.id,
          name: offer.name || offer.name_ar,
          name_ar: offer.name_ar,
          price: offer.price,
          image_url:
            offer.offer_images?.find((img: any) => img.is_primary)?.image_url ||
            offer.offer_images?.[0]?.image_url ||
            null,
          brand: offer.brand || 'Tatbeelah',
          category: 'offers',
          is_b2b: false,
          has_tax: offer.has_tax ?? false,
          product_images: offer.offer_images ?? null,
        }
        if (item.product_variant_id && !variantObj) {
          variantObj = offerVariantsById.get(item.product_variant_id) ?? null
        }
      }

      if (channel === 'b2c' && productObj.is_b2b) return null
      if (channel === 'b2b' && productObj.is_b2b !== true) return null

      return {
        id: item.id,
        product_id: item.product_id,
        product_variant_id: item.product_variant_id ?? null,
        unit_price: item.unit_price ?? variantObj?.price ?? productObj.price,
        quantity: item.quantity,
        variant: variantObj,
        product: {
          ...productObj,
          product_images: productObj.product_images ?? null,
        },
      } as CartItem
    })
    .filter((x): x is CartItem => Boolean(x))

  const subtotal = items.reduce((sum: number, item: CartItem) => {
    const priceToUse = item.unit_price ?? item.variant?.price ?? item.product.price
    return sum + priceToUse * item.quantity
  }, 0)

  let freeShipping: Cart['freeShipping'] = null
  if (channel === 'b2c') {
    const { data: rule } = await dbClient
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

  // Use admin client for guest carts since RLS blocks anonymous access
  const admin = getSupabaseAdminClient()

  // If no cart, create one
  let cartIdToUse = cartId

  if (!cartId && !user) {
    // Create new guest cart using admin client
    const { data: newCart, error: createError } = await admin
      .from('carts')
      .insert([{ status: 'active', channel }])
      .select('id')
      .single()

    if (createError) throw createError
    cartIdToUse = newCart.id

    // Set cookie
    cookieStore.set(cartCookieKey, cartIdToUse!, {
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

  // Fetch product or offer and optional variant to snapshot price and validate stock
  const clientToUse = channel === 'b2b' ? getSupabaseAdminClient() : supabase

  const { data: product } = await clientToUse
    .from('products')
    .select('id, price, stock, is_b2b, b2b_price_hidden')
    .eq('id', productId)
    .maybeSingle()

  let isOffer = false
  let targetItem: {
    id: string
    price: number
    stock: number
    is_b2b?: boolean
    b2b_price_hidden?: boolean
  } | null = product

  if (!targetItem) {
    const { data: offer } = await clientToUse
      .from('offers')
      .select('id, price, stock, is_archived')
      .eq('id', productId)
      .maybeSingle()

    if (offer && !offer.is_archived) {
      targetItem = {
        id: offer.id,
        price: offer.price,
        stock: offer.stock,
        is_b2b: false,
        b2b_price_hidden: false,
      }
      isOffer = true
    }
  }

  if (!targetItem) {
    throw new Error('المنتج غير متوفر')
  }

  if (channel === 'b2c' && targetItem.is_b2b) {
    throw new Error('هذا المنتج مخصص لمنتجات الجملة')
  }

  if (channel === 'b2b' && !targetItem.is_b2b) {
    throw new Error('هذا المنتج متاح للقطاع الفردي فقط')
  }

  if (channel === 'b2b' && targetItem.b2b_price_hidden) {
    throw new Error('يرجى التواصل مع المبيعات لإتمام هذا الطلب')
  }

  let variantData: { id: string; price: number | null; stock: number | null } | null = null
  if (productVariantId) {
    const table = isOffer ? 'offer_variants' : 'product_variants'
    const foreignKey = isOffer ? 'offer_id' : 'product_id'
    const { data: variant } = await clientToUse
      .from(table)
      .select('id, price, stock')
      .eq('id', productVariantId)
      .eq(foreignKey, productId)
      .maybeSingle()

    if (!variant) {
      throw new Error('هذا المتغير غير متاح')
    }
    variantData = variant
  }

  const availableStock = targetItem.stock ?? 0
  if (availableStock <= 0) {
    throw new Error('سيعود قريباً')
  }

  const snapshotPrice = variantData?.price ?? targetItem.price

  // Use admin client for guest cart item operations
  const cartClient = user ? supabase : admin

  // Now add item to cart
  let existingItemQuery = cartClient
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
    const nextQuantity = existingItem.quantity + quantity
    if (nextQuantity > availableStock) {
      throw new Error('الكمية المطلوبة غير متوفرة')
    }

    const updates: Record<string, any> = {
      quantity: nextQuantity,
      updated_at: new Date().toISOString(),
      unit_price: snapshotPrice,
    }

    // Persist variant selection (keeps items separated by variant)
    updates.product_variant_id = productVariantId ?? null

    const { error } = await cartClient.from('cart_items').update(updates).eq('id', existingItem.id)
    if (error) throw error
  } else {
    if (quantity > availableStock) {
      throw new Error('الكمية المطلوبة غير متوفرة')
    }

    const { error } = await cartClient.from('cart_items').insert({
      cart_id: cartIdToUse,
      product_id: productId,
      product_variant_id: productVariantId ?? null,
      unit_price: snapshotPrice,
      quantity: quantity,
    })

    if (error) throw error
  }

  // Update cart timestamp
  await cartClient
    .from('carts')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', cartIdToUse)
    
  const updatedCart = await getCart(channel, cartIdToUse)
  return { success: true, cart: updatedCart }
}

export async function updateCartItemQuantity(itemId: string, quantity: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (quantity <= 0) {
    return removeItemFromCart(itemId)
  }

  let cartChannel: CartChannel = 'b2c'

  if (user) {
    const { data: item } = await supabase
      .from('cart_items')
      .select('cart_id, carts(channel)')
      .eq('id', itemId)
      .single()
    if (item?.carts) {
      cartChannel = (item.carts as any).channel ?? 'b2c'
    }
    const { error } = await supabase
      .from('cart_items')
      .update({ quantity, updated_at: new Date().toISOString() })
      .eq('id', itemId)
    if (error) throw error
  } else {
    // Guest: use admin client, scoped to guest cart from cookie
    const cookieStore = await cookies()
    const guestCartId = cookieStore.get('cartId')?.value || cookieStore.get('b2bCartId')?.value
    if (!guestCartId) throw new Error('سلة التسوق غير موجودة')
    if (cookieStore.get('b2bCartId')?.value === guestCartId) {
      cartChannel = 'b2b'
    }
    const { error } = await getSupabaseAdminClient()
      .from('cart_items')
      .update({ quantity, updated_at: new Date().toISOString() })
      .eq('id', itemId)
      .eq('cart_id', guestCartId)
    if (error) throw error
  }

  const updatedCart = await getCart(cartChannel)
  return { success: true, cart: updatedCart }
}

export async function removeItemFromCart(itemId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let cartChannel: CartChannel = 'b2c'

  if (user) {
    const { data: item } = await supabase
      .from('cart_items')
      .select('cart_id, carts(channel)')
      .eq('id', itemId)
      .single()
    if (item?.carts) {
      cartChannel = (item.carts as any).channel ?? 'b2c'
    }
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', itemId)
    if (error) throw error
  } else {
    // Guest: use admin client, scoped to guest cart from cookie
    const cookieStore = await cookies()
    const guestCartId = cookieStore.get('cartId')?.value || cookieStore.get('b2bCartId')?.value
    if (!guestCartId) throw new Error('سلة التسوق غير موجودة')
    if (cookieStore.get('b2bCartId')?.value === guestCartId) {
      cartChannel = 'b2b'
    }
    const { error } = await getSupabaseAdminClient()
      .from('cart_items')
      .delete()
      .eq('id', itemId)
      .eq('cart_id', guestCartId)
    if (error) throw error
  }

  const updatedCart = await getCart(cartChannel)
  return { success: true, cart: updatedCart }
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

  // Use admin client for guest carts
  const clearClient = user ? supabase : getSupabaseAdminClient()

  const { error: deleteError } = await clearClient.from('cart_items').delete().eq('cart_id', cartIdToClear)
  if (deleteError) throw deleteError

  await clearClient.from('carts').update({ updated_at: new Date().toISOString() }).eq('id', cartIdToClear)

  if (!user && cartIdCookie) {
    cookieStore.delete(cartCookieKey)
  }

  return { success: true }
}
