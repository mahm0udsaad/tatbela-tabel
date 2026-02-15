import { NextResponse } from 'next/server'

import { readCustomerSession } from '@/lib/customer-auth/session'

export async function GET() {
  const session = await readCustomerSession()
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }

  return NextResponse.json({
    authenticated: true,
    customer: {
      id: session.customerId,
      phone: session.phone,
    },
  })
}
