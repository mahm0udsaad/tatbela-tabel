import crypto from "crypto"

type PaymobHmacType = "webhook" | "redirect"

const WEBHOOK_FIELD_PATHS = [
  "id",
  "pending",
  "amount_cents",
  "success",
  "is_auth",
  "is_capture",
  "is_standalone_payment",
  "is_voided",
  "is_refunded",
  "is_3d_secure",
  "integration_id",
  "profile_id",
  "has_parent_transaction",
  "order.id",
  "created_at",
  "transaction_processed_callback_responses",
  "currency",
  "source_data.type",
  "source_data.sub_type",
  "source_data.pan",
  "source_data.pin",
  "source_data.owner",
  "source_data.issuer_bank",
  "source_data.gateway_integration_pk",
  "error_occured",
  "is_live",
  "other_integration_id",
  "refunded_amount_cents",
  "captured_amount",
  "merchant_staff_tag",
  "owner",
  "parent_transaction.id",
  "redirect_url",
  "order.merchant_order_id",
  "data.message",
  "is_payment_locked",
  "payment_key_claims.sub",
  "payment_key_claims.user_id",
  "payment_key_claims.email",
  "payment_key_claims.order_id",
  "payment_key_claims.billing_data.apartment",
  "payment_key_claims.billing_data.floor",
  "payment_key_claims.billing_data.street",
  "payment_key_claims.billing_data.building",
  "payment_key_claims.billing_data.city",
  "payment_key_claims.billing_data.state",
  "payment_key_claims.billing_data.country",
  "payment_key_claims.billing_data.email",
  "payment_key_claims.billing_data.phone_number",
  "payment_key_claims.billing_data.postal_code",
  "payment_key_claims.billing_data.first_name",
  "payment_key_claims.billing_data.last_name",
  "payment_key_claims.billing_data.extra_description",
  "payment_key_claims.billing_data.additional_description",
  "payment_key_claims.billing_data.merchant_reference",
  "payment_key_claims.billing_data.national_id",
  "payment_key_claims.billing_data.neighborhood",
  "payment_key_claims.billing_data.unit",
]

const REDIRECT_FIELD_PATHS = [
  "amount_cents",
  "created_at",
  "currency",
  "error_occured",
  "has_parent_transaction",
  "id",
  "integration_id",
  "is_3d_secure",
  "is_auth",
  "is_capture",
  "is_refunded",
  "is_standalone_payment",
  "is_voided",
  "order",
  "owner",
  "pending",
  "source_data.pan",
  "source_data.sub_type",
  "source_data.type",
  "success",
]

const FIELD_PATHS: Record<PaymobHmacType, string[]> = {
  webhook: WEBHOOK_FIELD_PATHS,
  redirect: REDIRECT_FIELD_PATHS,
}

const stringifyValue = (value: unknown) => {
  if (value === null || value === undefined) return ""
  if (typeof value === "object") return JSON.stringify(value)
  return String(value)
}

const getValue = (obj: Record<string, any>, path: string) => {
  return path.split(".").reduce<any>((acc, part) => {
    if (acc === null || acc === undefined) return undefined
    return acc[part]
  }, obj)
}

export function verifyPaymobHmac(source: Record<string, any>, incomingHmac: string, type: PaymobHmacType) {
  const secret = process.env.PAYMOB_HMAC_SECRET

  if (!secret) {
    throw new Error("PAYMOB_HMAC_SECRET is not configured")
  }

  if (!incomingHmac) {
    return false
  }

  const normalizedIncoming = incomingHmac.toLowerCase()

  if (!/^[0-9a-f]+$/.test(normalizedIncoming)) {
    return false
  }

  const concatenated = FIELD_PATHS[type].map((path) => stringifyValue(getValue(source, path))).join("")
  const computed = crypto.createHmac("sha512", secret).update(concatenated).digest("hex")

  const computedBuffer = Buffer.from(computed, "hex")
  const incomingBuffer = Buffer.from(normalizedIncoming, "hex")

  if (computedBuffer.length !== incomingBuffer.length) {
    return false
  }

  return crypto.timingSafeEqual(computedBuffer, incomingBuffer)
}


