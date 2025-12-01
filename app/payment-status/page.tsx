import Link from "next/link"
import { CheckCircle2, Loader2, XCircle } from "lucide-react"

import { verifyPaymobHmac } from "@/lib/payments/paymob-hmac"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

type SearchParams = Record<string, string | string[] | undefined>

type RedirectParams = Record<string, string | undefined>

const normalizeParams = (params: SearchParams): RedirectParams => {
  return Object.fromEntries(
    Object.entries(params).map(([key, value]) => [key, Array.isArray(value) ? value.at(-1) : value])
  )
}

const toBoolean = (value?: string) => {
  if (!value) return false
  return value === "true" || value === "1"
}

const buildRedirectTransaction = (params: RedirectParams) => ({
  amount_cents: params.amount_cents,
  created_at: params.created_at,
  currency: params.currency,
  error_occured: params.error_occured,
  has_parent_transaction: params.has_parent_transaction,
  id: params.id,
  integration_id: params.integration_id,
  is_3d_secure: params.is_3d_secure,
  is_auth: params.is_auth,
  is_capture: params.is_capture,
  is_refunded: params.is_refunded,
  is_standalone_payment: params.is_standalone_payment,
  is_voided: params.is_voided,
  order: params.order,
  owner: params.owner,
  pending: params.pending,
  source_data: {
    pan: params["source_data.pan"] || params.source_data_pan,
    sub_type: params["source_data.sub_type"] || params.source_data_sub_type,
    type: params["source_data.type"] || params.source_data_type,
  },
  success: params.success,
})

const statusConfig = {
  success: {
    title: "تم الدفع بنجاح",
    description: "لقد استلمنا دفعتك وسيتم تجهيز الطلب مباشرة.",
    icon: <CheckCircle2 className="w-10 h-10 text-green-600" />,
    accent: "border-green-500 bg-green-50",
    pill: "bg-green-100 text-green-800",
  },
  pending: {
    title: "عملية الدفع قيد المراجعة",
    description: "جارٍ التأكد من حالة الدفع مع Paymob. سيتم تحديثك فور التأكيد.",
    icon: <Loader2 className="w-10 h-10 text-yellow-600 animate-spin" />,
    accent: "border-yellow-400 bg-yellow-50",
    pill: "bg-yellow-100 text-yellow-800",
  },
  failed: {
    title: "لم تكتمل عملية الدفع",
    description: "تعذر تأكيد الدفع. يمكنك إعادة المحاولة أو اختيار طريقة أخرى.",
    icon: <XCircle className="w-10 h-10 text-red-600" />,
    accent: "border-red-500 bg-red-50",
    pill: "bg-red-100 text-red-800",
  },
  invalid: {
    title: "تعذر التحقق من العملية",
    description: "رابط العودة غير صالح. يرجى التواصل مع خدمة العملاء للمساعدة.",
    icon: <XCircle className="w-10 h-10 text-gray-600" />,
    accent: "border-gray-400 bg-gray-50",
    pill: "bg-gray-200 text-gray-800",
  },
} as const

interface OrderInfo {
  order_number: string
  total_amount: number
  status: string
  payment_status: string
}

interface PaymentStatusPageProps {
  searchParams: Promise<SearchParams>
}

export default async function PaymentStatusPage({ searchParams }: PaymentStatusPageProps) {
  const resolvedSearchParams = await searchParams
  const params = normalizeParams(resolvedSearchParams)
  const hasRequiredParams = Boolean(params.hmac && params.merchant_order_id)

  let isSignatureValid = false

  if (hasRequiredParams) {
    try {
      const transaction = buildRedirectTransaction(params)
      isSignatureValid = verifyPaymobHmac(transaction, params.hmac as string, "redirect")
    } catch (error) {
      console.error("[Paymob redirect] Signature validation failed", error)
      isSignatureValid = false
    }
  }

  const successFlag = isSignatureValid && toBoolean(params.success)
  const pendingFlag = isSignatureValid && !successFlag && toBoolean(params.pending)

  const outcome: keyof typeof statusConfig = !isSignatureValid
    ? "invalid"
    : successFlag
      ? "success"
      : pendingFlag
        ? "pending"
        : "failed"

  let order: OrderInfo | null = null
  let orderError: string | null = null

  if (isSignatureValid && params.merchant_order_id) {
    try {
      const supabaseAdmin = getSupabaseAdminClient()
      const { data, error } = await supabaseAdmin
        .from("orders")
        .select("order_number,total_amount,status,payment_status")
        .eq("order_number", params.merchant_order_id)
        .single()

      if (error) {
        orderError = "تعذر جلب بيانات الطلب من قاعدة البيانات"
        console.error("[Paymob redirect] Failed to fetch order", error)
      } else {
        order = data as OrderInfo
      }
    } catch (error) {
      orderError = "حدث خطأ غير متوقع أثناء قراءة الطلب"
      console.error("[Paymob redirect] Unknown Supabase error", error)
    }
  }

  const statusEntry = statusConfig[outcome]
  const resolvedPaymentStatus = order?.payment_status
    ? order.payment_status === "paid"
      ? "مدفوع"
      : order.payment_status === "pending"
        ? "معلق"
        : "فشل الدفع"
    : outcome === "success"
      ? "مدفوع"
      : outcome === "pending"
        ? "معلق"
        : "غير مدفوع"

  const hasTotalAmount = typeof order?.total_amount === "number"

  return (
    <main className="min-h-screen bg-white">
      <section className="bg-[#F5F1E8] py-8">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl font-bold text-[#2B2520]">تتبع الدفع</h1>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-3xl mx-auto px-4">
          <div className={`rounded-2xl border p-8 text-center ${statusEntry.accent}`}>
            <div className="flex flex-col items-center gap-4">
              {statusEntry.icon}
              <span className={`px-4 py-1 rounded-full text-sm font-semibold ${statusEntry.pill}`}>
                {outcome === "success" && "تم التأكيد"}
                {outcome === "pending" && "بانتظار التأكيد"}
                {outcome === "failed" && "لم تنجح العملية"}
                {outcome === "invalid" && "رابط غير صالح"}
              </span>
              <h2 className="text-2xl font-bold text-[#2B2520]">{statusEntry.title}</h2>
              <p className="text-[#8B6F47]">{statusEntry.description}</p>
            </div>

            <div className="mt-8 bg-white rounded-xl p-6 text-right space-y-4">
              <div className="flex justify-between text-[#2B2520]">
                <span className="font-semibold">رقم الطلب</span>
                <span>{order?.order_number || params.merchant_order_id || "غير متوفر"}</span>
              </div>
              <div className="flex justify-between text-[#2B2520]">
                <span className="font-semibold">حالة الدفع</span>
                <span>{resolvedPaymentStatus}</span>
              </div>
              {hasTotalAmount && (
                <div className="flex justify-between text-[#2B2520]">
                  <span className="font-semibold">إجمالي المبلغ</span>
                  <span>{order?.total_amount} ج.م</span>
                </div>
              )}
              {orderError && <p className="text-sm text-red-600 text-left">{orderError}</p>}
            </div>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/user/orders"
                className="flex-1 px-6 py-3 bg-[#E8A835] text-white rounded-lg font-bold hover:bg-[#D9941E] transition-colors text-center"
              >
                عرض طلباتي
              </Link>
              <Link
                href="/checkout"
                className="flex-1 px-6 py-3 border-2 border-[#E8A835] text-[#E8A835] rounded-lg font-bold hover:bg-[#F5F1E8] transition-colors text-center"
              >
                العودة إلى الدفع
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}


