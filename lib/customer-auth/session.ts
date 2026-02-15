import crypto from 'crypto'
import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'

export const CUSTOMER_SESSION_COOKIE = 'customer_session'
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7

type SessionPayload = {
  sub: string
  phone: string
  exp: number
}

export type CustomerSession = {
  customerId: string
  phone: string
}

const base64urlEncode = (input: string | Buffer) => Buffer.from(input).toString('base64url')
const base64urlDecode = (input: string) => Buffer.from(input, 'base64url').toString('utf8')

const getSessionSecret = () =>
  process.env.CUSTOMER_AUTH_SECRET ||
  process.env.TWILIO_AUTH_TOKEN ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'local-dev-secret'

const sign = (value: string) => {
  return crypto.createHmac('sha256', getSessionSecret()).update(value).digest('base64url')
}

export const createCustomerSessionToken = (customerId: string, phone: string) => {
  const header = base64urlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = base64urlEncode(
    JSON.stringify({
      sub: customerId,
      phone,
      exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
    } satisfies SessionPayload),
  )
  const unsigned = `${header}.${payload}`
  const signature = sign(unsigned)
  return `${unsigned}.${signature}`
}

const verifyToken = (token: string): SessionPayload | null => {
  const [header, payload, signature] = token.split('.')
  if (!header || !payload || !signature) return null

  const unsigned = `${header}.${payload}`
  const expectedSignature = sign(unsigned)
  const expectedBuffer = Buffer.from(expectedSignature)
  const providedBuffer = Buffer.from(signature)
  if (expectedBuffer.length !== providedBuffer.length) return null
  if (!crypto.timingSafeEqual(expectedBuffer, providedBuffer)) return null

  const parsed = JSON.parse(base64urlDecode(payload)) as SessionPayload
  if (!parsed?.sub || !parsed?.phone || !parsed?.exp) return null
  if (parsed.exp < Math.floor(Date.now() / 1000)) return null

  return parsed
}

export const readCustomerSession = async (): Promise<CustomerSession | null> => {
  const cookieStore = await cookies()
  const token = cookieStore.get(CUSTOMER_SESSION_COOKIE)?.value
  if (!token) return null
  const payload = verifyToken(token)
  if (!payload) return null

  return {
    customerId: payload.sub,
    phone: payload.phone,
  }
}

export const readCustomerSessionFromRequest = (request: NextRequest): CustomerSession | null => {
  const token = request.cookies.get(CUSTOMER_SESSION_COOKIE)?.value
  if (!token) return null
  const payload = verifyToken(token)
  if (!payload) return null

  return {
    customerId: payload.sub,
    phone: payload.phone,
  }
}

export const setCustomerSessionCookie = async (token: string) => {
  const cookieStore = await cookies()
  cookieStore.set(CUSTOMER_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  })
}

export const clearCustomerSessionCookie = async () => {
  const cookieStore = await cookies()
  cookieStore.delete(CUSTOMER_SESSION_COOKIE)
}
