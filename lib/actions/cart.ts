'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export type CartItem = {
  id: string
  product_id: string
  quantity: number
  product: {
    id: string
    name: string
    name_ar: string
    price: number
    image_url: string | null
    brand: string
    category: string
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
      quantity,
      products (
        id,
        name,
        name_ar,
        price,
        image_url,
        brand,
        category
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

  const items = data.cart_items.map((item: any) => ({
    id: item.id,
    product_id: item.product_id,
    quantity: item.quantity,
    product: item.products
  }))

  const subtotal = items.reduce((sum: number, item: CartItem) => {
    return sum + (item.product.price * item.quantity)
  }, 0)

  return {
    id: data.id,
    items,
    subtotal
  }
}

export async function addToCart(productId: string, quantity: number = 1) {
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

  // Now add item to cart
  // Check if item exists
  const { data: existingItem } = await supabase
    .from('cart_items')
    .select('id, quantity')
    .eq('cart_id', cartIdToUse)
    .eq('product_id', productId)
    .single()

  if (existingItem) {
    const { error } = await supabase
      .from('cart_items')
      .update({ quantity: existingItem.quantity + quantity, updated_at: new Date().toISOString() })
      .eq('id', existingItem.id)
    
    if (error) throw error
  } else {
    const { error } = await supabase
      .from('cart_items')
      .insert({
        cart_id: cartIdToUse,
        product_id: productId,
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

