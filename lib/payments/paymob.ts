// New Intention API configuration
const PAYMOB_API_BASE = (process.env.PAYMOB_API_BASE || "https://accept.paymob.com").replace(/\/api\/?$/, "")
const PAYMOB_SECRET_KEY = process.env.PAYMOB_SECRET_KEY
const PAYMOB_PUBLIC_KEY = process.env.PAYMOB_PUBLIC_KEY
const PAYMOB_INTEGRATION_ID = process.env.PAYMOB_INTEGRATION_ID

if (!PAYMOB_SECRET_KEY || !PAYMOB_INTEGRATION_ID || !PAYMOB_PUBLIC_KEY) {
  console.warn("[Paymob] Missing required environment variables. Please configure PAYMOB_SECRET_KEY, PAYMOB_PUBLIC_KEY, and PAYMOB_INTEGRATION_ID.")
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

// New Intention API - Single step payment creation
async function createIntention({
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
  const response = await fetch(`${PAYMOB_API_BASE}/v1/intention/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Token ${PAYMOB_SECRET_KEY}`,
    },
    body: JSON.stringify({
      amount: amountCents,
      currency,
      payment_methods: [Number(PAYMOB_INTEGRATION_ID)],
      items: items.map(item => ({
        name: item.name,
        amount: item.amount_cents,
        description: item.description || "",
        quantity: item.quantity,
      })),
      billing_data: {
        first_name: billingData.first_name,
        last_name: billingData.last_name,
        email: billingData.email,
        phone_number: billingData.phone_number,
        apartment: billingData.apartment ?? "NA",
        floor: billingData.floor ?? "NA",
        street: billingData.street || "NA",
        building: billingData.building ?? "NA",
        city: billingData.city || "Cairo",
        state: billingData.state ?? "NA",
        country: billingData.country || "EGY",
        postal_code: billingData.postal_code ?? "NA",
      },
      special_reference: merchantOrderId,
      // Redirect URLs for payment status
      redirection_url: process.env.NEXT_PUBLIC_BASE_URL
        ? `${process.env.NEXT_PUBLIC_BASE_URL}/payment-status`
        : undefined,
    }),
  })

  const contentType = response.headers.get("content-type") || ""
  const isJson = contentType.includes("application/json")
  const payload = isJson ? await response.json() : await response.text()

  if (!response.ok) {
    console.error("[Paymob] Intention creation error", payload)
    const errorMessage = isJson
      ? payload?.detail || payload?.message || "Failed to create payment intention"
      : `Unexpected response from Paymob (status ${response.status})`
    throw new Error(errorMessage)
  }

  // Extract the iframe URL from payment_keys or construct it
  const iframeUrl = payload.iframe_url ||
    (payload.payment_keys && payload.payment_keys.length > 0
      ? `https://accept.paymob.com/unifiedcheckout/?publicKey=${PAYMOB_PUBLIC_KEY}&clientSecret=${payload.client_secret}`
      : `https://accept.paymob.com/unifiedcheckout/?publicKey=${PAYMOB_PUBLIC_KEY}&clientSecret=${payload.client_secret}`)

  return {
    id: payload.id,
    client_secret: payload.client_secret,
    iframe_url: iframeUrl,
    payment_keys: payload.payment_keys || [],
  }
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
  if (!PAYMOB_SECRET_KEY || !PAYMOB_INTEGRATION_ID) {
    throw new Error("Paymob configuration is missing")
  }

  // Use new Intention API
  const intention = await createIntention({
    amountCents,
    currency,
    merchantOrderId,
    items,
    billingData,
  })

  return {
    orderId: intention.id,
    paymentToken: intention.client_secret,
    iframeUrl: intention.iframe_url,
    clientSecret: intention.client_secret,
    intentionId: intention.id,
  }
}
