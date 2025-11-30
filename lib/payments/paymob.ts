const PAYMOB_API_BASE = process.env.PAYMOB_API_BASE || "https://accept.paymobsolutions.com/api"
const PAYMOB_API_KEY = process.env.PAYMOB_API_KEY
const PAYMOB_INTEGRATION_ID = process.env.PAYMOB_INTEGRATION_ID
const PAYMOB_IFRAME_ID = process.env.PAYMOB_IFRAME_ID

if (!PAYMOB_API_KEY || !PAYMOB_INTEGRATION_ID || !PAYMOB_IFRAME_ID) {
  console.warn("[Paymob] Missing required environment variables. Please configure PAYMOB_API_KEY, PAYMOB_INTEGRATION_ID and PAYMOB_IFRAME_ID.")
}

export interface PaymobItem {
  name: string
  amount_cents: number
  quantity: number
  description?: string
}

interface BillingData {
  first_name: string
  last_name: string
  email: string
  phone_number: string
  apartment?: string
  floor?: string
  street: string
  building?: string
  city: string
  state?: string
  postal_code?: string
  country: string
}

export async function createPaymobPayment({
  amountCents,
  currency,
  merchantOrderId,
  items,
  billingData,
}: {
  amountCents: number
  currency: string
  merchantOrderId: string
  items: PaymobItem[]
  billingData: BillingData
}) {
  if (!PAYMOB_API_KEY || !PAYMOB_INTEGRATION_ID || !PAYMOB_IFRAME_ID) {
    throw new Error("Paymob configuration is missing")
  }

  const authToken = await authenticate()
  const orderId = await registerOrder({ authToken, amountCents, currency, merchantOrderId, items })
  const paymentToken = await requestPaymentKey({ authToken, orderId, amountCents, currency, billingData })
  const iframeUrl = `${PAYMOB_API_BASE}/acceptance/iframes/${PAYMOB_IFRAME_ID}?payment_token=${paymentToken}`

  return {
    orderId,
    paymentToken,
    iframeUrl,
  }
}

async function authenticate() {
  const response = await fetch(`${PAYMOB_API_BASE}/auth/tokens`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ api_key: PAYMOB_API_KEY }),
  })
  const payload = await response.json()
  if (!response.ok) {
    console.error("[Paymob] Auth error", payload)
    throw new Error(payload?.details || "Paymob authentication failed")
  }
  return payload.token as string
}

async function registerOrder({
  authToken,
  amountCents,
  currency,
  merchantOrderId,
  items,
}: {
  authToken: string
  amountCents: number
  currency: string
  merchantOrderId: string
  items: PaymobItem[]
}) {
  const response = await fetch(`${PAYMOB_API_BASE}/ecommerce/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      auth_token: authToken,
      delivery_needed: false,
      amount_cents: amountCents,
      currency,
      merchant_order_id: merchantOrderId,
      items,
    }),
  })
  const payload = await response.json()
  if (!response.ok) {
    console.error("[Paymob] Register order error", payload)
    throw new Error(payload?.details || "Paymob order registration failed")
  }
  return payload.id as number
}

async function requestPaymentKey({
  authToken,
  orderId,
  amountCents,
  currency,
  billingData,
}: {
  authToken: string
  orderId: number
  amountCents: number
  currency: string
  billingData: BillingData
}) {
  const response = await fetch(`${PAYMOB_API_BASE}/acceptance/payment_keys`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      auth_token: authToken,
      amount_cents: amountCents,
      currency,
      order_id: orderId,
      integration_id: Number(PAYMOB_INTEGRATION_ID),
      billing_data: {
        apartment: billingData.apartment ?? "NA",
        floor: billingData.floor ?? "NA",
        street: billingData.street || "NA",
        building: billingData.building ?? "NA",
        city: billingData.city || "Cairo",
        state: billingData.state ?? "NA",
        country: billingData.country || "EG",
        postal_code: billingData.postal_code ?? "NA",
        email: billingData.email,
        phone_number: billingData.phone_number,
        first_name: billingData.first_name,
        last_name: billingData.last_name,
      },
    }),
  })

  const payload = await response.json()
  if (!response.ok) {
    console.error("[Paymob] Payment key error", payload)
    throw new Error(payload?.details || "Paymob payment key request failed")
  }

  return payload.token as string
}

