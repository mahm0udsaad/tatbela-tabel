"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { LogOut, ShoppingBag, Package, Truck, CheckCircle } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase"

interface Order {
  id: string
  order_number: string
  created_at: string
  total_amount: number
  status: "pending" | "processing" | "shipped" | "delivered"
  items_count: number
}

export default function OrdersPage() {
  const router = useRouter()
  const supabase = getSupabaseClient()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const fetchUserAndOrders = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession()
        if (!sessionData.session) {
          router.push("/auth/sign-in")
          return
        }

        setUser(sessionData.session.user)

        // Fetch orders from the database
        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .eq("user_id", sessionData.session.user.id)
          .order("created_at", { ascending: false })

        if (error) throw error
        setOrders(data || [])
      } catch (error) {
        console.error("Error fetching orders:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserAndOrders()
  }, [supabase, router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <ShoppingBag className="text-yellow-500" size={20} />
      case "processing":
        return <Package className="text-blue-500" size={20} />
      case "shipped":
        return <Truck className="text-purple-500" size={20} />
      case "delivered":
        return <CheckCircle className="text-green-500" size={20} />
      default:
        return null
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "قيد الانتظار"
      case "processing":
        return "قيد المعالجة"
      case "shipped":
        return "تم الشحن"
      case "delivered":
        return "تم التسليم"
      default:
        return status
    }
  }

  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      <section className="bg-[#F5F1E8] py-8">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-[#2B2520]">طلباتي</h1>
            <p className="text-[#8B6F47]">تتبع حالة طلباتك</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold"
          >
            تسجيل الخروج
            <LogOut size={20} />
          </button>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4">
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-[#8B6F47]">جاري التحميل...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12 bg-[#F5F1E8] rounded-xl">
              <ShoppingBag size={48} className="mx-auto text-[#E8A835] mb-4" />
              <h2 className="text-2xl font-bold text-[#2B2520] mb-2">لا توجد طلبات</h2>
              <p className="text-[#8B6F47] mb-6">لم تقم بأي طلبات حتى الآن</p>
              <Link
                href="/store"
                className="inline-block px-6 py-3 bg-[#E8A835] text-white rounded-lg font-bold hover:bg-[#D9941E] transition-colors"
              >
                تصفح المنتجات
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white border border-[#E8E2D1] rounded-xl p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="grid md:grid-cols-5 gap-4 items-center">
                    <div>
                      <p className="text-sm text-[#8B6F47]">رقم الطلب</p>
                      <p className="font-bold text-[#2B2520]">{order.order_number}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#8B6F47]">التاريخ</p>
                      <p className="font-semibold text-[#2B2520]">
                        {new Date(order.created_at).toLocaleDateString("ar-EG")}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-[#8B6F47]">المبلغ</p>
                      <p className="font-bold text-[#C41E3A]">{order.total_amount} ج.م</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(order.status)}
                      <div>
                        <p className="text-sm text-[#8B6F47]">الحالة</p>
                        <p className="font-semibold text-[#2B2520]">{getStatusLabel(order.status)}</p>
                      </div>
                    </div>
                    <div className="text-left">
                      <Link
                        href={`/user/orders/${order.id}`}
                        className="px-4 py-2 bg-[#E8A835] text-white rounded-lg text-sm font-semibold hover:bg-[#D9941E] transition-colors"
                      >
                        التفاصيل
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  )
}
