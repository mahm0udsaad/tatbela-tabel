'use client'

import { useEffect } from 'react'

import { trackPurchase, type PixelContentItem } from '@/lib/meta-pixel'

/**
 * Fires the Meta Pixel `Purchase` event once, on the payment-status page, after
 * an online (Paymob) payment succeeds. Line items are recovered from the order
 * record saved in localStorage at checkout time so the event carries content_ids
 * and per-item prices; it falls back to the total amount alone if unavailable.
 *
 * A per-order guard in localStorage prevents double counting if the user
 * refreshes or revisits the confirmation URL.
 */
export function PurchaseTracker({
  orderNumber,
  totalAmount,
}: {
  orderNumber: string
  totalAmount: number
}) {
  useEffect(() => {
    if (!orderNumber) return

    const guardKey = `tt_purchase_tracked_${orderNumber}`
    try {
      if (localStorage.getItem(guardKey)) return
    } catch {
      // localStorage unavailable — still fire, just without dedupe.
    }

    let items: PixelContentItem[] = []
    try {
      const orders = JSON.parse(
        localStorage.getItem('tatbeelah_guest_orders') || '[]',
      )
      const record = Array.isArray(orders)
        ? orders.find(
            (o: any) => o.orderNumber === orderNumber || o.order_number === orderNumber,
          )
        : null
      if (record?.items?.length) {
        items = record.items.map((item: any) => ({
          id: String(item.product_id ?? item.id),
          quantity: Number(item.quantity ?? 1),
          price: Number(item.price ?? 0),
          name: item.product_name,
        }))
      }
    } catch {
      // ignore malformed localStorage
    }

    trackPurchase({ items, value: totalAmount, orderId: orderNumber })

    try {
      localStorage.setItem(guardKey, '1')
    } catch {
      // ignore
    }
  }, [orderNumber, totalAmount])

  return null
}
