import crypto from 'crypto'
import { NextResponse } from 'next/server'

import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { hashOtpCode, isValidOtpCode } from '@/lib/customer-auth/otp'
import { normalizePhone, isValidEgyptPhone } from '@/lib/customer-auth/phone'
import { createCustomerSessionToken, setCustomerSessionCookie } from '@/lib/customer-auth/session'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const normalizedPhone = normalizePhone(String(body?.phone ?? ''))
    const code = String(body?.code ?? '').trim()

    if (!normalizedPhone || !isValidEgyptPhone(normalizedPhone) || !isValidOtpCode(code)) {
      return NextResponse.json({ error: 'بيانات التحقق غير صالحة' }, { status: 400 })
    }

    const admin = getSupabaseAdminClient() as any
    const { data: otpRecord, error: otpError } = await admin
      .from('customer_otp_codes')
      .select('id, phone, code_hash, attempts, expires_at, consumed_at')
      .eq('phone', normalizedPhone)
      .is('consumed_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (otpError || !otpRecord) {
      return NextResponse.json({ error: 'رمز التحقق غير صحيح أو منتهي الصلاحية' }, { status: 400 })
    }

    if (new Date(otpRecord.expires_at).getTime() < Date.now()) {
      return NextResponse.json({ error: 'رمز التحقق منتهي الصلاحية' }, { status: 400 })
    }

    const expectedHash = hashOtpCode(normalizedPhone, code)
    const expectedBuffer = Buffer.from(expectedHash, 'utf8')
    const actualBuffer = Buffer.from(otpRecord.code_hash, 'utf8')
    const isMatch =
      expectedBuffer.length === actualBuffer.length && crypto.timingSafeEqual(expectedBuffer, actualBuffer)

    if (!isMatch) {
      const attempts = (otpRecord.attempts ?? 0) + 1
      await admin.from('customer_otp_codes').update({ attempts }).eq('id', otpRecord.id)
      return NextResponse.json({ error: 'رمز التحقق غير صحيح' }, { status: 400 })
    }

    await admin
      .from('customer_otp_codes')
      .update({ consumed_at: new Date().toISOString() })
      .eq('id', otpRecord.id)

    const { data: existingCustomer } = await admin
      .from('customer_users')
      .select('id')
      .eq('phone', normalizedPhone)
      .maybeSingle()

    let customerId = existingCustomer?.id as string | undefined
    if (!customerId) {
      const { data: insertedCustomer, error: createCustomerError } = await admin
        .from('customer_users')
        .insert({ phone: normalizedPhone, last_login_at: new Date().toISOString() })
        .select('id')
        .single()

      if (createCustomerError || !insertedCustomer) {
        return NextResponse.json({ error: 'تعذر إنشاء حساب العميل' }, { status: 500 })
      }
      customerId = insertedCustomer.id
    } else {
      await admin
        .from('customer_users')
        .update({ last_login_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', customerId)
    }

    if (!customerId) {
      return NextResponse.json({ error: 'تعذر إنشاء جلسة العميل' }, { status: 500 })
    }

    const token = createCustomerSessionToken(customerId, normalizedPhone)
    await setCustomerSessionCookie(token)

    return NextResponse.json({
      success: true,
      customer: {
        id: customerId,
        phone: normalizedPhone,
      },
    })
  } catch (error) {
    console.error('customer-auth/verify-otp error:', error)
    return NextResponse.json({ error: 'تعذر التحقق من الرمز حالياً' }, { status: 500 })
  }
}
