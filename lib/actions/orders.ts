'use server'

import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'

type OrderItem = {
  product_id: string
  product_name: string
  product_brand: string
  price: number
  quantity: number
  total: number
}

type PlaceOrderInput = {
  orderNumber: string
  subtotal: number
  shippingCost: number
  taxAmount: number
  totalAmount: number
  channel: string
  shippingZoneId: string | null
  customerEmail: string
  firstName: string
  lastName: string
  phone: string
  address: string
  city: string
  postalCode: string
  paymentMethod: string
  items: OrderItem[]
}

export async function placeOrder(input: PlaceOrderInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Use admin client for guest orders since RLS blocks anonymous inserts
  const dbClient = user ? supabase : getSupabaseAdminClient()

  const { data: orderData, error: orderError } = await dbClient
    .from('orders')
    .insert([
      {
        user_id: user?.id ?? null,
        order_number: input.orderNumber,
        status: 'processing',
        subtotal: input.subtotal,
        shipping_cost: input.shippingCost,
        tax_amount: input.taxAmount,
        total_amount: input.totalAmount,
        channel: input.channel,
        shipping_zone_id: input.shippingZoneId,
        customer_email: input.customerEmail,
        first_name: input.firstName,
        last_name: input.lastName,
        phone: input.phone,
        address: input.address,
        city: input.city,
        postal_code: input.postalCode,
        payment_method: input.paymentMethod,
        payment_status: 'pending',
      },
    ])
    .select()

  if (orderError) throw orderError

  const newOrderId = orderData?.[0]?.id

  if (!newOrderId) {
    throw new Error('لم نتمكن من إنشاء الطلب في قاعدة البيانات')
  }

  if (input.items.length > 0) {
    const itemsToInsert = input.items.map((item) => ({
      order_id: newOrderId,
      product_id: item.product_id,
      product_name: item.product_name,
      product_brand: item.product_brand,
      price: item.price,
      quantity: item.quantity,
      total: item.total,
    }))

    const { error: itemsError } = await dbClient.from('order_items').insert(itemsToInsert)
    if (itemsError) throw itemsError
  }

  return { newOrderId }
}
