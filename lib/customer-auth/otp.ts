import crypto from 'crypto'

const getOtpSecret = () =>
  process.env.CUSTOMER_AUTH_SECRET ||
  process.env.TWILIO_AUTH_TOKEN ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'local-dev-secret'

export const generateOtpCode = () => `${Math.floor(100000 + Math.random() * 900000)}`

export const hashOtpCode = (phone: string, code: string) => {
  return crypto.createHash('sha256').update(`${phone}:${code}:${getOtpSecret()}`).digest('hex')
}

export const isValidOtpCode = (code: string) => /^\d{4,8}$/.test(code.trim())
