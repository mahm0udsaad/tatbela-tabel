"use client"

import { useState, useEffect } from "react"
import { getSupabaseClient } from "@/lib/supabase"
import { AdminSidebar } from "../sidebar"
import { CheckCircle, Clock, Truck, Package, Eye, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog"

interface Order {
  id: string
  user_id: string
  total_amount: number
  status: "pending" | "processing" | "shipped" | "delivered"
  created_at: string
  order_number: string
  customer_email: string
  first_name: string
  last_name: string
  phone: string
  address: string
  city: string
  postal_code: string
  payment_method: string
  subtotal: number
  shipping_cost: number
  tax_amount: number
}

interface OrderItem {
  id: string
  product_name: string
  product_brand: string
  quantity: number
  price: number
  total: number
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [itemsLoading, setItemsLoading] = useState(false)
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

  const fetchOrderItems = async (orderId: string) => {
    setItemsLoading(true)
    try {
      const { data, error } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", orderId)
      
      if (error) throw error
      setOrderItems(data || [])
    } catch (error) {
      console.error("Error fetching order items:", error)
    } finally {
      setItemsLoading(false)
    }
  }

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order)
    fetchOrderItems(order.id)
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
      <AdminSidebar />
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
                        <div className="flex items-center gap-2">
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

                          <Dialog>
                            <DialogTrigger asChild>
                              <button
                                onClick={() => handleViewOrder(order)}
                                className="p-1 text-[#8B6F47] hover:text-[#E8A835] transition-colors"
                                title="عرض التفاصيل"
                              >
                                <Eye size={20} />
                              </button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>تفاصيل الطلب #{selectedOrder?.order_number}</DialogTitle>
                                <DialogDescription>
                                  تم الطلب في {selectedOrder && new Date(selectedOrder.created_at).toLocaleDateString("ar-EG")}
                                </DialogDescription>
                              </DialogHeader>

                              {selectedOrder && (
                                <div className="mt-4 space-y-6">
                                  {/* Customer Info */}
                                  <div className="grid md:grid-cols-2 gap-4">
                                    <div className="bg-[#F9F7F3] p-4 rounded-lg">
                                      <h3 className="font-bold text-[#2B2520] mb-2">بيانات العميل</h3>
                                      <p className="text-sm text-[#8B6F47]">{selectedOrder.first_name} {selectedOrder.last_name}</p>
                                      <p className="text-sm text-[#8B6F47]">{selectedOrder.customer_email}</p>
                                      <p className="text-sm text-[#8B6F47]">{selectedOrder.phone}</p>
                                    </div>
                                    <div className="bg-[#F9F7F3] p-4 rounded-lg">
                                      <h3 className="font-bold text-[#2B2520] mb-2">عنوان التوصيل</h3>
                                      <p className="text-sm text-[#8B6F47]">{selectedOrder.address}</p>
                                      <p className="text-sm text-[#8B6F47]">{selectedOrder.city}, {selectedOrder.postal_code}</p>
                                    </div>
                                  </div>

                                  {/* Order Items */}
                                  <div>
                                    <h3 className="font-bold text-[#2B2520] mb-3">المنتجات</h3>
                                    {itemsLoading ? (
                                      <p className="text-center text-[#8B6F47]">جاري تحميل المنتجات...</p>
                                    ) : (
                                      <div className="border rounded-lg overflow-hidden">
                                        <table className="w-full text-sm">
                                          <thead className="bg-[#F5F1E8]">
                                            <tr>
                                              <th className="px-4 py-2 text-right">المنتج</th>
                                              <th className="px-4 py-2 text-right">الكمية</th>
                                              <th className="px-4 py-2 text-right">السعر</th>
                                              <th className="px-4 py-2 text-right">الإجمالي</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {orderItems.map((item) => (
                                              <tr key={item.id} className="border-t">
                                                <td className="px-4 py-2">
                                                  <p className="font-semibold">{item.product_name}</p>
                                                  <p className="text-xs text-[#8B6F47]">{item.product_brand}</p>
                                                </td>
                                                <td className="px-4 py-2">{item.quantity}</td>
                                                <td className="px-4 py-2">{item.price} ج.م</td>
                                                <td className="px-4 py-2 font-bold text-[#C41E3A]">{item.total} ج.م</td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    )}
                                  </div>

                                  {/* Financial Summary */}
                                  <div className="bg-[#F9F7F3] p-4 rounded-lg">
                                    <div className="flex justify-between mb-2 text-sm">
                                      <span className="text-[#8B6F47]">المجموع الفرعي:</span>
                                      <span className="font-semibold">{selectedOrder.subtotal} ج.م</span>
                                    </div>
                                    <div className="flex justify-between mb-2 text-sm">
                                      <span className="text-[#8B6F47]">الشحن:</span>
                                      <span className="font-semibold">{selectedOrder.shipping_cost} ج.م</span>
                                    </div>
                                    <div className="flex justify-between mb-2 text-sm">
                                      <span className="text-[#8B6F47]">الضريبة:</span>
                                      <span className="font-semibold">{selectedOrder.tax_amount} ج.م</span>
                                    </div>
                                    <div className="flex justify-between pt-2 border-t border-[#D9D4C8] mt-2">
                                      <span className="font-bold text-[#2B2520]">الإجمالي:</span>
                                      <span className="font-bold text-[#C41E3A] text-lg">{selectedOrder.total_amount} ج.م</span>
                                    </div>
                                    <div className="mt-2 pt-2 border-t border-[#D9D4C8] flex justify-between text-sm">
                                      <span className="text-[#8B6F47]">طريقة الدفع:</span>
                                      <span className="font-semibold">
                                        {selectedOrder.payment_method === "online" ? "دفع إلكتروني" : "دفع عند الاستلام"}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </div>
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
