import { NextRequest, NextResponse } from "next/server"
import { ZodError } from "zod"

import { createPaymobPayment, type PaymobItem } from "@/lib/payments/paymob"
import { paymobRequestSchema } from "@/lib/validation/paymob"

export async function POST(request: NextRequest) {
  try {
    const payload = paymobRequestSchema.parse(await request.json())

    const amountCents = Math.round(payload.amount * 100)
    const paymobItems: PaymobItem[] = payload.items.map((item) => ({
      name: item.name,
      amount_cents: Math.round(item.price * 100),
      quantity: item.quantity,
      description: item.description,
    }))

    const payment = await createPaymobPayment({
      amountCents,
      currency: payload.currency,
      merchantOrderId: payload.merchantOrderId,
      items: paymobItems,
      billingData: {
        first_name: payload.billing.firstName,
        last_name: payload.billing.lastName,
        email: payload.billing.email,
        phone_number: payload.billing.phone,
        street: payload.billing.address,
        city: payload.billing.city,
        state: payload.billing.state,
        postal_code: payload.billing.postalCode,
        country: payload.billing.country || "EG",
      },
    })

    return NextResponse.json({
      iframeUrl: payment.iframeUrl,
      paymobOrderId: payment.orderId,
      paymentToken: payment.paymentToken,
    })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Invalid request payload", details: error.issues }, { status: 400 })
    }

    console.error("[Paymob] Failed to create payment", error)
    return NextResponse.json({ error: "Unable to initiate Paymob payment" }, { status: 500 })
  }
}


