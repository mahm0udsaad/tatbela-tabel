import { z } from "zod"

const paymobItemSchema = z.object({
  name: z.string().trim().min(1, { message: "اسم المنتج مطلوب" }),
  price: z.number().positive({ message: "سعر المنتج غير صالح" }),
  quantity: z.number().int().positive({ message: "كمية المنتج غير صالحة" }),
  description: z.string().optional(),
})

export const paymobBillingSchema = z.object({
  firstName: z.string().trim().min(1, { message: "الاسم الأول مطلوب" }),
  lastName: z.string().trim().min(1, { message: "الاسم الأخير مطلوب" }),
  email: z.string().trim().email({ message: "البريد الإلكتروني غير صالح" }),
  phone: z.string().trim().min(5, { message: "يرجى إدخال رقم هاتف صالح" }),
  address: z.string().trim().min(3, { message: "الرجاء إدخال عنوان مكون من 3 أحرف على الأقل" }),
  city: z.string().trim().min(2, { message: "اسم المدينة يجب أن يحتوي على حرفين على الأقل" }),
  state: z.string().trim().optional(),
  postalCode: z.string().trim().optional(),
  country: z.string().trim().optional(),
})

export const paymobRequestSchema = z.object({
  amount: z.number().positive({ message: "إجمالي الدفع يجب أن يكون أكبر من صفر" }),
  currency: z.string().trim().min(1, { message: "رمز العملة مطلوب" }).default("EGP"),
  merchantOrderId: z.string().trim().min(3, { message: "رقم الطلب غير صالح" }),
  billing: paymobBillingSchema,
  items: z.array(paymobItemSchema).min(1, { message: "يجب أن تحتوي الطلبية على عنصر واحد على الأقل" }),
})

export type PaymobBillingData = z.infer<typeof paymobBillingSchema>
export type PaymobRequestPayload = z.infer<typeof paymobRequestSchema>

