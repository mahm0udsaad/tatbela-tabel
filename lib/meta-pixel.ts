// Meta (Facebook) Pixel helper
// Provides a typed, safe wrapper around the global `fbq` function so that we can
// fire standard e-commerce events (ViewContent, AddToCart, InitiateCheckout,
// AddPaymentInfo, Purchase, Search, ...) from anywhere in the client.

export const META_PIXEL_ID =
  process.env.NEXT_PUBLIC_META_PIXEL_ID || '2530942230712042'

// Currency used across the store (Egyptian Pound).
const CURRENCY = 'EGP'

// Standard Meta events we use. Keeping them typed avoids typos that would make
// Meta silently drop the event.
export type MetaStandardEvent =
  | 'PageView'
  | 'ViewContent'
  | 'AddToCart'
  | 'InitiateCheckout'
  | 'AddPaymentInfo'
  | 'Purchase'
  | 'Search'
  | 'Lead'
  | 'CompleteRegistration'
  | 'Contact'

type FbqFunction = (
  command: 'track' | 'trackCustom' | 'init' | 'consent',
  eventNameOrId: string,
  params?: Record<string, unknown>,
) => void

declare global {
  interface Window {
    fbq?: FbqFunction & { queue?: unknown[] }
    _fbq?: unknown
  }
}

const isBrowser = () => typeof window !== 'undefined'

/** True once the pixel base code has been loaded on the page. */
export const isPixelReady = () => isBrowser() && typeof window.fbq === 'function'

/** Fire a standard Meta Pixel event. Safe to call before the pixel loads. */
export function trackEvent(
  event: MetaStandardEvent,
  params?: Record<string, unknown>,
) {
  if (!isPixelReady()) return
  try {
    window.fbq!('track', event, params)
  } catch (error) {
    console.error(`[MetaPixel] failed to track ${event}`, error)
  }
}

/** Fire a custom (non-standard) Meta Pixel event. */
export function trackCustomEvent(event: string, params?: Record<string, unknown>) {
  if (!isPixelReady()) return
  try {
    window.fbq!('trackCustom', event, params)
  } catch (error) {
    console.error(`[MetaPixel] failed to track custom ${event}`, error)
  }
}

// ---------------------------------------------------------------------------
// Convenience helpers for common e-commerce events. These normalise the payload
// into the shape Meta expects (content_ids, content_type, value, currency, ...).
// ---------------------------------------------------------------------------

export type PixelContentItem = {
  id: string
  quantity: number
  price: number
  name?: string
}

const toContents = (items: PixelContentItem[]) =>
  items.map((item) => ({
    id: item.id,
    quantity: item.quantity,
    item_price: item.price,
  }))

const sumValue = (items: PixelContentItem[]) =>
  Number(
    items
      .reduce((total, item) => total + item.price * item.quantity, 0)
      .toFixed(2),
  )

export function trackViewContent(item: {
  id: string
  name?: string
  price: number
}) {
  trackEvent('ViewContent', {
    content_ids: [item.id],
    content_name: item.name,
    content_type: 'product',
    value: Number(item.price.toFixed(2)),
    currency: CURRENCY,
  })
}

export function trackAddToCart(item: PixelContentItem) {
  trackEvent('AddToCart', {
    content_ids: [item.id],
    content_name: item.name,
    content_type: 'product',
    contents: toContents([item]),
    value: sumValue([item]),
    currency: CURRENCY,
  })
}

export function trackInitiateCheckout(items: PixelContentItem[]) {
  trackEvent('InitiateCheckout', {
    content_ids: items.map((item) => item.id),
    content_type: 'product',
    contents: toContents(items),
    num_items: items.reduce((total, item) => total + item.quantity, 0),
    value: sumValue(items),
    currency: CURRENCY,
  })
}

export function trackAddPaymentInfo(items: PixelContentItem[], value?: number) {
  trackEvent('AddPaymentInfo', {
    content_ids: items.map((item) => item.id),
    content_type: 'product',
    contents: toContents(items),
    value: value ?? sumValue(items),
    currency: CURRENCY,
  })
}

export function trackPurchase(params: {
  items: PixelContentItem[]
  value: number
  orderId?: string
}) {
  trackEvent('Purchase', {
    content_ids: params.items.map((item) => item.id),
    content_type: 'product',
    contents: toContents(params.items),
    num_items: params.items.reduce((total, item) => total + item.quantity, 0),
    value: Number(params.value.toFixed(2)),
    currency: CURRENCY,
    order_id: params.orderId,
  })
}

export function trackSearch(query: string) {
  if (!query.trim()) return
  trackEvent('Search', { search_string: query })
}
