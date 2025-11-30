import { NextRequest, NextResponse } from "next/server"
import { z, ZodError } from "zod"

import { createPaymobPayment, type PaymobItem } from "@/lib/payments/paymob"

const requestSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().default("EGP"),
  merchantOrderId: z.string().min(3),
  billing: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(5),
    address: z.string().min(3),
    city: z.string().min(2),
    state: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().optional(),
  }),
  items: z
    .array(
      z.object({
        name: z.string(),
        price: z.number().positive(),
        quantity: z.number().int().positive(),
        description: z.string().optional(),
      })
    )
    .min(1),
})

export async function POST(request: NextRequest) {
  try {
    const payload = requestSchema.parse(await request.json())

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


