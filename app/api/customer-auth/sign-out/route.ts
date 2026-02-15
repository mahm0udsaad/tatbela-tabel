import { NextResponse } from 'next/server'

import { clearCustomerSessionCookie } from '@/lib/customer-auth/session'

export async function POST() {
  await clearCustomerSessionCookie()
  return NextResponse.json({ success: true })
}
