"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase"
import { AdminSidebar } from "../sidebar"
import { CheckCircle, Clock, Truck, Package } from "lucide-react"

interface Order {
  id: string
  user_id: string
  total_amount: number
  status: "pending" | "processing" | "shipped" | "delivered"
  created_at: string
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = getSupabaseClient()

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false })

      if (error) throw error
      setOrders(data || [])
    } catch (error) {
      console.error("خطأ في جلب الطلبات:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", orderId)

      if (error) throw error
      fetchOrders()
    } catch (error) {
      console.error("خطأ في تحديث حالة الطلب:", error)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="text-yellow-500" size={20} />
      case "processing":
        return <Package className="text-blue-500" size={20} />
      case "shipped":
        return <Truck className="text-orange-500" size={20} />
      case "delivered":
        return <CheckCircle className="text-green-500" size={20} />
      default:
        return null
    }
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "قيد الانتظار",
      processing: "قيد المعالجة",
      shipped: "تم الشحن",
      delivered: "تم التسليم",
    }
    return labels[status] || status
  }

  return (
    <div className="flex">
      <AdminSidebar onLogout={handleLogout} />
      <main className="flex-1 bg-[#F5F1E8] p-8">
        <h1 className="text-3xl font-bold text-[#2B2520] mb-8">إدارة الطلبات</h1>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-[#8B6F47]">جاري التحميل...</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-[#F5F1E8] border-b border-[#D9D4C8]">
                <tr>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-[#2B2520]">رقم الطلب</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-[#2B2520]">المبلغ</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-[#2B2520]">الحالة</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-[#2B2520]">التاريخ</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-[#2B2520]">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-[#8B6F47]">
                      لا توجد طلبات حالياً
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order.id} className="border-b border-[#D9D4C8] hover:bg-[#F9F7F3]">
                      <td className="px-6 py-4 text-[#2B2520] font-semibold">{order.id}</td>
                      <td className="px-6 py-4 text-[#C41E3A] font-semibold">{order.total_amount.toFixed(2)} ج.م</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(order.status)}
                          <span>{getStatusLabel(order.status)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[#8B6F47]">
                        {new Date(order.created_at).toLocaleDateString("ar-EG")}
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                          className="px-3 py-1 border border-[#D9D4C8] rounded text-sm focus:outline-none focus:border-[#E8A835]"
                        >
                          <option value="pending">قيد الانتظار</option>
                          <option value="processing">قيد المعالجة</option>
                          <option value="shipped">تم الشحن</option>
                          <option value="delivered">تم التسليم</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
