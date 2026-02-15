const getRequiredEnv = (key: string) => {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Missing ${key}`)
  }
  return value
}

export const sendOtpSms = async (toPhone: string, code: string) => {
  const accountSid = getRequiredEnv('TWILIO_ACCOUNT_SID')
  const authToken = getRequiredEnv('TWILIO_AUTH_TOKEN')
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID
  const fromPhone = process.env.TWILIO_FROM_PHONE

  const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64')
  if (!messagingServiceSid && !fromPhone) {
    throw new Error('Missing TWILIO_MESSAGING_SERVICE_SID or TWILIO_FROM_PHONE')
  }

  const body = new URLSearchParams({
    To: toPhone,
    Body: `رمز التحقق الخاص بك: ${code}`,
  })
  if (messagingServiceSid) {
    body.set('MessagingServiceSid', messagingServiceSid)
  } else if (fromPhone) {
    body.set('From', fromPhone)
  }

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
    cache: 'no-store',
  })

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => null)
    const message =
      errorPayload?.message ||
      errorPayload?.detail ||
      `Twilio SMS failed with status ${response.status}`
    const code = errorPayload?.code ? ` [${errorPayload.code}]` : ''
    throw new Error(`${message}${code}`)
  }
}
