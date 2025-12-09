"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowRight, Package, MapPin, CreditCard, Calendar, ShoppingBag } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase"

interface OrderItem {
  id: string
  product_name: string
  product_brand: string
  quantity: number
  price: number
  total: number
  products: {
    image_url: string | null
  }
}

interface Order {
  id: string
  order_number: string
  created_at: string
  status: "pending" | "processing" | "shipped" | "delivered"
  subtotal: number
  shipping_cost: number
  tax_amount: number
  total_amount: number
  payment_method: string
  payment_status: string
  address: string
  city: string
  postal_code: string
}

import Image from "next/image"

export default function OrderDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = getSupabaseClient()
  const [order, setOrder] = useState<Order | null>(null)
  const [items, setItems] = useState<OrderItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession()
        if (!sessionData.session) {
          router.push("/auth/sign-in")
          return
        }

        if (!params.id) return

        // Fetch order
        const { data: orderData, error: orderError } = await supabase
          .from("orders")
          .select("*")
          .eq("id", params.id)
          .eq("user_id", sessionData.session.user.id)
          .single()

        if (orderError) throw orderError
        setOrder(orderData)

        // Fetch order items
        const { data: itemsData, error: itemsError } = await supabase
          .from("order_items")
          .select(`
            *,
            products (
              image_url
            )
          `)
          .eq("order_id", params.id)

        if (itemsError) throw itemsError
        setItems(itemsData || [])

      } catch (error) {
        console.error("Error fetching order details:", error)
        // Handle error (e.g. redirect to orders list if not found)
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrderDetails()
  }, [supabase, params.id, router])

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending": return "قيد الانتظار"
      case "processing": return "قيد المعالجة"
      case "shipped": return "تم الشحن"
      case "delivered": return "تم التسليم"
      default: return status
    }
  }

  const getPaymentMethodLabel = (method: string) => {
    return method === "online" ? "دفع إلكتروني" : "دفع عند الاستلام"
  }

  if (isLoading) {
    return (
      <div className="min-h-screen py-20 text-center">
        <p className="text-[#8B6F47]">جاري تحميل تفاصيل الطلب...</p>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen py-20 text-center">
        <p className="text-red-500 mb-4">لم يتم العثور على الطلب</p>
        <Link href="/user/orders" className="text-[#E8A835] hover:underline">
          العودة للطلبات
        </Link>
      </div>
    )
  }

  return (
    <main className="min-h-screen pb-12">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link 
            href="/user/orders" 
            className="inline-flex items-center text-[#8B6F47] hover:text-[#E8A835] transition-colors"
          >
            <ArrowRight size={20} className="ml-2" />
            العودة للطلبات
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#2B2520] mb-2">تفاصيل الطلب #{order.order_number}</h1>
            <div className="flex items-center text-[#8B6F47] text-sm">
              <Calendar size={16} className="ml-2" />
              {new Date(order.created_at).toLocaleDateString("ar-EG", {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-[#E8E2D1] text-[#E8A835] font-semibold text-sm">
            {getStatusLabel(order.status)}
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-[#E8E2D1] overflow-hidden mb-6">
          <div className="p-4 border-b border-[#F5F1E8] bg-[#FAF9F6]">
            <h2 className="font-bold text-[#2B2520] flex items-center gap-2">
              <ShoppingBag size={20} className="text-[#E8A835]" />
              المنتجات ({items.length})
            </h2>
          </div>
          <div className="divide-y divide-[#F5F1E8]">
            {items.map((item) => (
              <div key={item.id} className="p-4 flex gap-4 items-start">
                <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-[#E8E2D1] shrink-0">
                  <Image
                    src={item.products?.image_url || "/placeholder.jpg"}
                    alt={item.product_name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-[#2B2520]">{item.product_name}</p>
                    <p className="text-sm text-[#8B6F47]">{item.product_brand}</p>
                    <p className="text-xs text-[#8B6F47] mt-1">
                      {item.quantity} × {item.price} ج.م
                    </p>
                  </div>
                  <p className="font-bold text-[#C41E3A]">{item.total} ج.م</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary & Info */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Financial Summary */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-[#E8E2D1] overflow-hidden h-fit">
            <div className="p-4 border-b border-[#F5F1E8] bg-[#FAF9F6]">
              <h2 className="font-bold text-[#2B2520] flex items-center gap-2">
                <CreditCard size={20} className="text-[#E8A835]" />
                ملخص الدفع
              </h2>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex justify-between text-[#8B6F47]">
                <span>المجموع الفرعي</span>
                <span>{order.subtotal} ج.م</span>
              </div>
              <div className="flex justify-between text-[#8B6F47]">
                <span>الشحن</span>
                <span>{order.shipping_cost} ج.م</span>
              </div>
              <div className="flex justify-between text-[#8B6F47]">
                <span>الضريبة</span>
                <span>{order.tax_amount} ج.م</span>
              </div>
              <div className="pt-3 border-t border-[#F5F1E8] flex justify-between items-center">
                <span className="font-bold text-[#2B2520]">الإجمالي</span>
                <span className="font-bold text-[#C41E3A] text-xl">{order.total_amount} ج.م</span>
              </div>
              <div className="mt-4 pt-4 border-t border-[#F5F1E8]">
                <p className="text-sm text-[#8B6F47] mb-1">طريقة الدفع</p>
                <p className="font-semibold text-[#2B2520]">{getPaymentMethodLabel(order.payment_method)}</p>
              </div>
            </div>
          </div>

          {/* Shipping Info */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-[#E8E2D1] overflow-hidden h-fit">
            <div className="p-4 border-b border-[#F5F1E8] bg-[#FAF9F6]">
              <h2 className="font-bold text-[#2B2520] flex items-center gap-2">
                <MapPin size={20} className="text-[#E8A835]" />
                عنوان التوصيل
              </h2>
            </div>
            <div className="p-4">
              <p className="text-[#2B2520] mb-1">{order.address}</p>
              <p className="text-[#8B6F47]">{order.city}, {order.postal_code}</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

