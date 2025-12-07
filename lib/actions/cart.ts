'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

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
    product_images: CartProductImage[] | null
  }
}

export type Cart = {
  id: string
  items: CartItem[]
  subtotal: number
}

export async function getCart(): Promise<Cart | null> {
  const supabase = await createClient()
  const cookieStore = await cookies()
  const cartId = cookieStore.get('cartId')?.value
  const { data: { user } } = await supabase.auth.getUser()

  let query = supabase.from('carts').select(`
    id,
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
        product_images (
          image_url,
          is_primary,
          sort_order
        )
      )
    )
  `)

  if (user) {
    query = query.eq('user_id', user.id).eq('status', 'active')
  } else if (cartId) {
    query = query.eq('id', cartId).eq('status', 'active')
  } else {
    return null
  }

  const { data, error } = await query.single()

  if (error || !data) {
    return null
  }

  const items = data.cart_items
    .filter((item: any) => Boolean(item.products))
    .map((item: any) => ({
      id: item.id,
      product_id: item.product_id,
      product_variant_id: item.product_variant_id ?? null,
      unit_price: item.unit_price ?? item.product_variants?.price ?? item.products.price,
      quantity: item.quantity,
      variant: item.product_variants ?? null,
      product: {
        ...item.products,
        product_images: item.products.product_images ?? null
      }
    }))

  const subtotal = items.reduce((sum: number, item: CartItem) => {
    const priceToUse = item.unit_price ?? item.variant?.price ?? item.product.price
    return sum + priceToUse * item.quantity
  }, 0)

  return {
    id: data.id,
    items,
    subtotal
  }
}

export async function addToCart(productId: string, quantity: number = 1, productVariantId?: string | null) {
  const supabase = await createClient()
  const cookieStore = await cookies()
  let cartId = cookieStore.get('cartId')?.value
  const { data: { user } } = await supabase.auth.getUser()

  // If no cart, create one
  let cartIdToUse = cartId

  if (!cartId && !user) {
    // Create new guest cart
    const { data: newCart, error: createError } = await supabase
      .from('carts')
      .insert([{ status: 'active' }])
      .select('id')
      .single()
    
    if (createError) throw createError
    cartIdToUse = newCart.id
    
    // Set cookie
    cookieStore.set('cartId', cartIdToUse, { 
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
      .single()
    
    if (userCart) {
      cartIdToUse = userCart.id
    } else {
      // Create user cart
      const { data: newCart, error: createError } = await supabase
        .from('carts')
        .insert([{ user_id: user.id, status: 'active' }])
        .select('id')
        .single()
      
      if (createError) throw createError
      cartIdToUse = newCart.id
    }
  }

  // Fetch product and optional variant to snapshot price and validate stock
  const { data: product } = await supabase
    .from('products')
    .select('id, price, stock')
    .eq('id', productId)
    .single()

  if (!product) {
    throw new Error('المنتج غير متوفر')
  }

  let variantData: { id: string; price: number | null; stock: number | null } | null = null
  if (productVariantId) {
    const { data: variant } = await supabase
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
  // Check if item exists (same product + same variant)
  const { data: existingItem } = await supabase
    .from('cart_items')
    .select('id, quantity')
    .eq('cart_id', cartIdToUse)
    .eq('product_id', productId)
    .eq('product_variant_id', productVariantId ?? null)
    .single()

  if (existingItem) {
    const { error } = await supabase
      .from('cart_items')
      .update({ quantity: existingItem.quantity + quantity, updated_at: new Date().toISOString(), unit_price: snapshotPrice })
      .eq('id', existingItem.id)
    
    if (error) throw error
  } else {
    const { error } = await supabase
      .from('cart_items')
      .insert({
        cart_id: cartIdToUse,
        product_id: productId,
        product_variant_id: productVariantId ?? null,
        unit_price: snapshotPrice,
        quantity: quantity
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

export async function clearCart() {
  const supabase = await createClient()
  const cookieStore = await cookies()
  const cartIdCookie = cookieStore.get('cartId')?.value
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
      .maybeSingle()

    if (error) throw error
    cartIdToClear = userCart?.id ?? null
  } else if (cartIdCookie) {
    cartIdToClear = cartIdCookie
  }

  if (!cartIdToClear) {
    if (cartIdCookie) {
      cookieStore.delete('cartId')
    }
    return { success: true }
  }

  const { error: deleteError } = await supabase.from('cart_items').delete().eq('cart_id', cartIdToClear)
  if (deleteError) throw deleteError

  await supabase.from('carts').update({ updated_at: new Date().toISOString() }).eq('id', cartIdToClear)

  if (!user && cartIdCookie) {
    cookieStore.delete('cartId')
  }

  return { success: true }
}

