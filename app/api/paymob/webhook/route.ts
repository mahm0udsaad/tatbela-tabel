import { NextRequest, NextResponse } from "next/server"

import { verifyPaymobHmac } from "@/lib/payments/paymob-hmac"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"

const PAYMOB_HMAC_SECRET = process.env.PAYMOB_HMAC_SECRET
type PaymobWebhookPayload = {
  type?: string
  hmac?: string
  obj?: Record<string, any>
}

async function parsePayload(request: NextRequest): Promise<PaymobWebhookPayload> {
  const contentType = request.headers.get("content-type") || ""

  if (contentType.includes("application/json")) {
    return await request.json()
  }

  if (contentType.includes("application/x-www-form-urlencoded")) {
    const formData = await request.formData()
    const record: Record<string, any> = {}
    formData.forEach((value, key) => {
      record[key] = value
    })

    if (typeof record.obj === "string") {
      try {
        record.obj = JSON.parse(record.obj)
      } catch {
        record.obj = undefined
      }
    }

    return record as PaymobWebhookPayload
  }

  return await request.json()
}

export async function POST(request: NextRequest) {
  try {
    if (!PAYMOB_HMAC_SECRET) {
      return NextResponse.json({ error: "PAYMOB_HMAC_SECRET is not configured" }, { status: 500 })
    }

    const payload = await parsePayload(request)

    if (!payload?.obj || !payload?.hmac) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
    }

    const transaction = payload.obj

    if (!verifyPaymobHmac(transaction, payload.hmac, "webhook")) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    const merchantOrderId = transaction?.order?.merchant_order_id
    if (!merchantOrderId) {
      return NextResponse.json({ error: "Missing merchant order id" }, { status: 400 })
    }

    const supabaseAdmin = getSupabaseAdminClient()

    const paymentStatus = transaction.success ? "paid" : transaction.pending ? "pending" : "failed"
    const orderStatus = transaction.success ? "confirmed" : transaction.pending ? "processing" : "payment_failed"

    const { data: existingOrder, error: fetchError } = await supabaseAdmin
      .from("orders")
      .select("id, payment_status, status")
      .eq("order_number", merchantOrderId)
      .single()

    if (fetchError || !existingOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    const updates: Record<string, any> = {}

    if (existingOrder.payment_status !== paymentStatus) {
      updates.payment_status = paymentStatus
    }

    if (existingOrder.status !== orderStatus) {
      updates.status = orderStatus
    }

    if (Object.keys(updates).length) {
      const { error: updateError } = await supabaseAdmin
        .from("orders")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("order_number", merchantOrderId)

      if (updateError) {
        console.error("[Paymob webhook] Failed to update order", updateError)
        return NextResponse.json({ error: "Failed to update order" }, { status: 500 })
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[Paymob webhook] Unexpected error", error)
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 })
  }
}


