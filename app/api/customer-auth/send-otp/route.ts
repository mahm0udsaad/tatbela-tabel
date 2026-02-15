import { NextResponse } from 'next/server'

import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { generateOtpCode, hashOtpCode } from '@/lib/customer-auth/otp'
import { normalizePhone, isValidEgyptPhone } from '@/lib/customer-auth/phone'
import { sendOtpSms } from '@/lib/customer-auth/sms'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const normalizedPhone = normalizePhone(String(body?.phone ?? ''))

    if (!normalizedPhone || !isValidEgyptPhone(normalizedPhone)) {
      return NextResponse.json({ error: 'رقم الهاتف غير صالح' }, { status: 400 })
    }

    const admin = getSupabaseAdminClient() as any
    const now = Date.now()
    const rateLimitWindow = new Date(now - 15 * 60 * 1000).toISOString()

    const { count } = await admin
      .from('customer_otp_codes')
      .select('*', { count: 'exact', head: true })
      .eq('phone', normalizedPhone)
      .gte('created_at', rateLimitWindow)

    if ((count ?? 0) >= 5) {
      return NextResponse.json({ error: 'تم تجاوز عدد المحاولات. حاول بعد قليل.' }, { status: 429 })
    }

    const code = generateOtpCode()
    const codeHash = hashOtpCode(normalizedPhone, code)
    const expiresAt = new Date(now + 10 * 60 * 1000).toISOString()

    const { error: insertError } = await admin.from('customer_otp_codes').insert({
      phone: normalizedPhone,
      code_hash: codeHash,
      expires_at: expiresAt,
    })

    if (insertError) {
      const details = process.env.NODE_ENV !== 'production' ? insertError.message : undefined
      return NextResponse.json({ error: 'تعذر إنشاء رمز التحقق', details }, { status: 500 })
    }

    try {
      await sendOtpSms(normalizedPhone, code)
    } catch (smsError) {
      console.error('Twilio sendOtpSms failed:', smsError)
      await admin
        .from('customer_otp_codes')
        .delete()
        .eq('phone', normalizedPhone)
        .eq('code_hash', codeHash)

      const details = smsError instanceof Error ? smsError.message : 'unknown_sms_error'
      return NextResponse.json(
        {
          error: 'تعذر إرسال الرسالة النصية',
          details: process.env.NODE_ENV !== 'production' ? details : undefined,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({ success: true, phone: normalizedPhone })
  } catch (error) {
    console.error('customer-auth/send-otp error:', error)
    const details = error instanceof Error ? error.message : 'unknown_error'
    return NextResponse.json(
      { error: 'تعذر إرسال رمز التحقق حالياً', details: process.env.NODE_ENV !== 'production' ? details : undefined },
      { status: 500 },
    )
  }
}
