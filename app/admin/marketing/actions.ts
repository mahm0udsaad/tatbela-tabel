"use server"

import { z } from "zod"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"
import { normalizePhone, isValidEgyptPhone } from "@/lib/customer-auth/phone"

export type PhoneSource = "order" | "address" | "signin" | "multiple"

export type PhoneContact = {
  phone: string
  name: string | null
  source: PhoneSource
}

export type FetchPhonesResult = {
  contacts: PhoneContact[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export type SendSmsResult = {
  success: boolean
  sent: number
  failed: number
  errors: string[]
}

const fetchPhonesSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(25),
  search: z.string().optional(),
})

export async function fetchPhoneContactsAction(input: {
  page?: number
  pageSize?: number
  search?: string
}): Promise<FetchPhonesResult> {
  const { page, pageSize, search } = fetchPhonesSchema.parse(input)
  const admin = getSupabaseAdminClient()
  const offset = (page - 1) * pageSize

  const [orderRes, addressRes, customerRes] = await Promise.all([
    admin
      .from("orders")
      .select("phone, first_name, last_name")
      .not("phone", "is", null)
      .neq("phone", ""),
    admin
      .from("addresses")
      .select("phone, recipient_name")
      .not("phone", "is", null)
      .neq("phone", ""),
    admin
      .from("customer_users")
      .select("phone"),
  ])

  if (orderRes.error || addressRes.error || customerRes.error) {
    console.error("Failed to fetch phones:", orderRes.error, addressRes.error, customerRes.error)
    return { contacts: [], total: 0, page, pageSize, totalPages: 0 }
  }

  const phoneMap = new Map<string, PhoneContact>()

  function addToMap(normalized: string, name: string | null, source: PhoneSource) {
    if (phoneMap.has(normalized)) {
      const existing = phoneMap.get(normalized)!
      if (!existing.name && name) existing.name = name
      if (existing.source !== source) existing.source = "multiple"
    } else {
      phoneMap.set(normalized, { phone: normalized, name, source })
    }
  }

  // Customer users (sign-in via phone OTP)
  for (const row of customerRes.data ?? []) {
    if (!row.phone) continue
    const normalized = normalizePhone(row.phone)
    if (!normalized || !isValidEgyptPhone(normalized)) continue
    addToMap(normalized, null, "signin")
  }

  // Orders
  for (const row of orderRes.data ?? []) {
    const normalized = normalizePhone(row.phone)
    if (!normalized || !isValidEgyptPhone(normalized)) continue
    const name =
      [row.first_name, row.last_name].filter(Boolean).join(" ").trim() || null
    addToMap(normalized, name, "order")
  }

  // Addresses
  for (const row of addressRes.data ?? []) {
    const normalized = normalizePhone(row.phone)
    if (!normalized || !isValidEgyptPhone(normalized)) continue
    const name = row.recipient_name?.trim() || null
    addToMap(normalized, name, "address")
  }

  let contacts = Array.from(phoneMap.values())

  if (search) {
    const q = search.toLowerCase()
    contacts = contacts.filter(
      (c) => c.phone.includes(q) || c.name?.toLowerCase().includes(q)
    )
  }

  contacts.sort((a, b) => a.phone.localeCompare(b.phone))

  const total = contacts.length
  const totalPages = Math.ceil(total / pageSize)
  const paginated = contacts.slice(offset, offset + pageSize)

  return { contacts: paginated, total, page, pageSize, totalPages }
}

const sendSmsSchema = z.object({
  phones: z.array(z.string().min(1)).min(1).max(500),
  message: z.string().min(1, "نص الرسالة مطلوب").max(1600),
})

export async function sendBulkSmsAction(input: {
  phones: string[]
  message: string
}): Promise<SendSmsResult> {
  const { phones, message } = sendSmsSchema.parse(input)

  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID
  const fromPhone = process.env.TWILIO_FROM_PHONE

  if (!accountSid || !authToken || (!messagingServiceSid && !fromPhone)) {
    return {
      success: false,
      sent: 0,
      failed: phones.length,
      errors: ["بيانات Twilio غير مكتملة"],
    }
  }

  const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64")
  let sent = 0
  let failed = 0
  const errors: string[] = []

  for (const phone of phones) {
    try {
      const body = new URLSearchParams({
        To: phone,
        Body: message,
      })
      if (messagingServiceSid) {
        body.set("MessagingServiceSid", messagingServiceSid)
      } else if (fromPhone) {
        body.set("From", fromPhone)
      }

      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body,
          cache: "no-store",
        }
      )

      if (response.ok) {
        sent++
      } else {
        failed++
        const err = await response.text()
        errors.push(`${phone}: ${err}`)
      }
    } catch (e) {
      failed++
      errors.push(
        `${phone}: ${e instanceof Error ? e.message : "Unknown error"}`
      )
    }
  }

  return { success: failed === 0, sent, failed, errors }
}
