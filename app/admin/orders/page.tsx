"use client"

import { useEffect, useRef, useState } from "react"
import { getSupabaseClient } from "@/lib/supabase"
import { CheckCircle, Clock, Truck, Package, Eye, Printer } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

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

const PAGE_SIZE = 20

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [itemsLoading, setItemsLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState<"all" | Order["status"]>("all")
  const [paymentFilter, setPaymentFilter] = useState<"all" | "online" | "cash">("all")
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set())
  const [bulkActionStatus, setBulkActionStatus] = useState<Order["status"] | "">("")
  const [showExportConfirmModal, setShowExportConfirmModal] = useState(false)
  const [csvPreviewData, setCsvPreviewData] = useState<{ csvString: string, headers: string[], rows: string[][] }>({ csvString: "", headers: [], rows: [] })
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const supabase = getSupabaseClient()

  useEffect(() => {
    fetchOrders(true)
  }, [statusFilter, paymentFilter])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          fetchOrders()
        }
      },
      { rootMargin: "200px" },
    )

    const target = loadMoreRef.current
    if (target) observer.observe(target)

    return () => {
      if (target) observer.unobserve(target)
    }
  }, [hasMore, loading, loadingMore])

  const fetchOrders = async (reset = false) => {
    if (!reset && (loading || loadingMore)) return

    if (reset) {
      setLoading(true)
      setHasMore(true)
    } else {
      setLoadingMore(true)
    }

    const from = reset ? 0 : orders.length
    const to = from + PAGE_SIZE - 1

    try {
      let query = supabase
        .from("orders")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to)

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter)
      }

      if (paymentFilter !== "all") {
        query = query.eq("payment_method", paymentFilter)
      }

      const { data, error, count } = await query

      if (error) throw error
      const received = data?.length ?? 0
      const previousLength = reset ? 0 : orders.length
      const totalLoaded = previousLength + received

      setOrders((prev) => (reset ? data || [] : [...prev, ...(data || [])]))
      setHasMore(count ? totalLoaded < count : received === PAGE_SIZE)
    } catch (error) {
      console.error("خطأ في جلب الطلبات:", error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const handleSelectAllOrders = () => {
    if (selectedOrderIds.size === orders.length && orders.length > 0) {
      setSelectedOrderIds(new Set())
    } else {
      setSelectedOrderIds(new Set(orders.map((order) => order.id)))
    }
  }

  const handleSelectOrder = (orderId: string) => {
    setSelectedOrderIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(orderId)) {
        newSet.delete(orderId)
      } else {
        newSet.add(orderId)
      }
      return newSet
    })
  }

  const handleBulkStatusChange = async () => {
    if (!bulkActionStatus || selectedOrderIds.size === 0) {
      alert("الرجاء تحديد حالة وتحديد طلب واحد على الأقل.")
      return
    }

    if (!confirm(`هل أنت متأكد من تغيير حالة ${selectedOrderIds.size} طلب إلى ${getStatusLabel(bulkActionStatus)}؟`)) {
      return
    }

    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: bulkActionStatus })
        .in("id", Array.from(selectedOrderIds))

      if (error) throw error
      
      setOrders((prev) =>
        prev.map((order) =>
          selectedOrderIds.has(order.id) ? { ...order, status: bulkActionStatus as Order["status"] } : order
        )
      )
      setSelectedOrderIds(new Set()) // Clear selection after bulk update
      setBulkActionStatus("") // Clear bulk action status
      alert("تم تحديث حالة الطلبات بنجاح.")
    } catch (error) {
      console.error("خطأ في تحديث حالة الطلبات المجمعة:", error)
      alert("حدث خطأ أثناء تحديث حالة الطلبات.")
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

  const handlePrintOrder = () => {
    if (!selectedOrder) return

    // Create a new window for printing
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      alert('الرجاء السماح بالنوافذ المنبثقة لطباعة الطلب')
      return
    }

    // Generate HTML content for printing
    const printContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>طلب #${selectedOrder.order_number || selectedOrder.id}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            padding: 40px;
            color: #2B2520;
            line-height: 1.6;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 3px solid #E8A835;
            padding-bottom: 20px;
          }
          .header h1 {
            color: #2B2520;
            font-size: 28px;
            margin-bottom: 10px;
          }
          .header .order-number {
            font-size: 20px;
            color: #8B6F47;
            font-weight: bold;
          }
          .header .order-date {
            font-size: 14px;
            color: #8B6F47;
            margin-top: 5px;
          }
          .section {
            margin-bottom: 25px;
          }
          .section-title {
            background-color: #F5F1E8;
            padding: 10px 15px;
            font-weight: bold;
            font-size: 16px;
            color: #2B2520;
            margin-bottom: 15px;
            border-right: 4px solid #E8A835;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
          }
          .info-box {
            background-color: #F9F7F3;
            padding: 15px;
            border-radius: 8px;
          }
          .info-box h3 {
            font-size: 14px;
            color: #8B6F47;
            margin-bottom: 8px;
            font-weight: 600;
          }
          .info-box p {
            font-size: 13px;
            color: #2B2520;
            margin: 3px 0;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          table thead {
            background-color: #F5F1E8;
          }
          table th {
            padding: 12px;
            text-align: right;
            font-size: 14px;
            color: #2B2520;
            border-bottom: 2px solid #D9D4C8;
          }
          table td {
            padding: 10px 12px;
            text-align: right;
            font-size: 13px;
            border-bottom: 1px solid #D9D4C8;
          }
          table tbody tr:hover {
            background-color: #F9F7F3;
          }
          .product-name {
            font-weight: 600;
            color: #2B2520;
          }
          .product-brand {
            font-size: 11px;
            color: #8B6F47;
            margin-top: 2px;
          }
          .summary {
            background-color: #F9F7F3;
            padding: 20px;
            border-radius: 8px;
            margin-top: 20px;
          }
          .summary-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            font-size: 14px;
          }
          .summary-row.total {
            border-top: 2px solid #D9D4C8;
            margin-top: 10px;
            padding-top: 15px;
            font-size: 18px;
            font-weight: bold;
            color: #C41E3A;
          }
          .badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
          }
          .badge-online {
            background-color: #d4edda;
            color: #155724;
          }
          .badge-cash {
            background-color: #d1ecf1;
            color: #0c5460;
          }
          .status-pending { color: #856404; }
          .status-processing { color: #004085; }
          .status-shipped { color: #d63384; }
          .status-delivered { color: #155724; }
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #D9D4C8;
            color: #8B6F47;
            font-size: 12px;
          }
          @media print {
            body {
              padding: 20px;
            }
            .no-print {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>تفاصيل الطلب</h1>
          <div class="order-number">رقم الطلب: #${selectedOrder.order_number || selectedOrder.id}</div>
          <div class="order-date">تاريخ الطلب: ${new Date(selectedOrder.created_at).toLocaleDateString("ar-EG")} - ${new Date(selectedOrder.created_at).toLocaleTimeString("ar-EG", { hour: '2-digit', minute: '2-digit' })}</div>
          <div style="margin-top: 10px;">
            <span class="badge ${selectedOrder.payment_method === 'online' ? 'badge-online' : 'badge-cash'}">
              ${getPaymentMethodLabel(selectedOrder.payment_method)}
            </span>
            <span class="badge status-${selectedOrder.status}" style="margin-right: 10px; background-color: #F5F1E8;">
              الحالة: ${getStatusLabel(selectedOrder.status)}
            </span>
          </div>
        </div>

        <div class="section">
          <div class="section-title">معلومات العميل والتوصيل</div>
          <div class="info-grid">
            <div class="info-box">
              <h3>بيانات العميل</h3>
              <p><strong>الاسم:</strong> ${selectedOrder.first_name} ${selectedOrder.last_name}</p>
              <p><strong>البريد الإلكتروني:</strong> ${selectedOrder.customer_email}</p>
              <p><strong>الهاتف:</strong> ${selectedOrder.phone}</p>
            </div>
            <div class="info-box">
              <h3>عنوان التوصيل</h3>
              <p><strong>العنوان:</strong> ${selectedOrder.address}</p>
              <p><strong>المدينة:</strong> ${selectedOrder.city}</p>
              <p><strong>الرمز البريدي:</strong> ${selectedOrder.postal_code}</p>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">المنتجات المطلوبة</div>
          <table>
            <thead>
              <tr>
                <th>المنتج</th>
                <th>الكمية</th>
                <th>السعر</th>
                <th>الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              ${orderItems.map(item => `
                <tr>
                  <td>
                    <div class="product-name">${item.product_name}</div>
                    <div class="product-brand">${item.product_brand}</div>
                  </td>
                  <td>${item.quantity}</td>
                  <td>${item.price.toFixed(2)} ج.م</td>
                  <td><strong>${item.total.toFixed(2)} ج.م</strong></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="summary">
          <div class="summary-row">
            <span>المجموع الفرعي:</span>
            <span><strong>${selectedOrder.subtotal.toFixed(2)} ج.م</strong></span>
          </div>
          <div class="summary-row">
            <span>تكلفة الشحن:</span>
            <span><strong>${selectedOrder.shipping_cost.toFixed(2)} ج.م</strong></span>
          </div>
          <div class="summary-row">
            <span>الضريبة:</span>
            <span><strong>${selectedOrder.tax_amount.toFixed(2)} ج.م</strong></span>
          </div>
          <div class="summary-row total">
            <span>الإجمالي النهائي:</span>
            <span>${selectedOrder.total_amount.toFixed(2)} ج.م</span>
          </div>
          <div class="summary-row" style="border-top: 1px solid #D9D4C8; margin-top: 10px; padding-top: 10px; font-size: 13px;">
            <span>طريقة الدفع:</span>
            <span><strong>${getPaymentMethodLabel(selectedOrder.payment_method)}</strong></span>
          </div>
        </div>

        <div class="footer">
          <p>شكراً لتعاملكم معنا</p>
          <p style="margin-top: 5px;">تم الطباعة في: ${new Date().toLocaleDateString("ar-EG")} - ${new Date().toLocaleTimeString("ar-EG")}</p>
        </div>

        <script>
          // Auto print when page loads
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `

    printWindow.document.write(printContent)
    printWindow.document.close()
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", orderId)

      if (error) throw error
      setOrders((prev) => prev.map((order) => (order.id === orderId ? { ...order, status: newStatus as Order["status"] } : order)))
      setSelectedOrder((prev) => (prev && prev.id === orderId ? { ...prev, status: newStatus as Order["status"] } : prev))
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

  const getPaymentMethodLabel = (method: string) => {
    return method === "online" ? "دفع إلكتروني" : "دفع عند الاستلام"
  }

  const getPaymentMethodClasses = (method: string) => {
    return method === "online" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
  }

  const generateCsvContent = async (data: Order[]) => { // Now returns content and parsed data
    if (data.length === 0) return { csvString: "", headers: [], rows: [] };

    // Collect all order IDs from selected orders
    const orderIds = data.map(order => order.id);

    // Fetch all order items for the selected orders in a single query
    const { data: allOrderItems, error: itemsError } = await supabase
      .from("order_items")
      .select("product_name, product_brand, quantity")
      .in("order_id", orderIds);
    
    if (itemsError) {
      console.error("Error fetching order items for CSV aggregation:", itemsError);
      alert("حدث خطأ أثناء جلب تفاصيل المنتجات للتصدير.");
      return { csvString: "", headers: [], rows: [] };
    }

    if (!allOrderItems || allOrderItems.length === 0) {
      return { csvString: "", headers: [], rows: [] };
    }

    // Aggregate quantities for each product
    const productAggregation = new Map<string, { brand: string, quantity: number }>();

    allOrderItems.forEach(item => {
      const key = `${item.product_name}::${item.product_brand}`; // Use product name and brand as a unique key
      if (productAggregation.has(key)) {
        const existing = productAggregation.get(key)!;
        existing.quantity += item.quantity;
        productAggregation.set(key, existing);
      } else {
        productAggregation.set(key, { brand: item.product_brand, quantity: item.quantity });
      }
    });

    const headers = [
      "Product Name",
      "Product Brand",
      "Total Quantity"
    ]
    
    let csvString = headers.map(h => `"${h}"`).join(",") + "\n"
    const rows: string[][] = [];

    productAggregation.forEach((value, key) => {
      const [productName] = key.split("::");
      const row = [
        productName,
        value.brand,
        value.quantity.toString() // Convert number to string for CSV
      ];
      csvString += row.map(field => `"${field}"`).join(",") + "\n";
      rows.push(row);
    });

    return { csvString, headers, rows };
  }

  const triggerCsvDownload = (csvString: string) => {
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", "inventory_summary.csv")
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const handleExportCsv = async () => {
    if (selectedOrderIds.size === 0) {
      alert("الرجاء تحديد طلب واحد على الأقل للتصدير.")
      return
    }

    const selectedOrders = orders.filter(order => selectedOrderIds.has(order.id));
    const { csvString, headers, rows } = await generateCsvContent(selectedOrders);

    if (csvString) {
      setCsvPreviewData({ headers, rows });
      setShowExportConfirmModal(true);
    } else {
      alert("لم يتم العثور على بيانات للتصدير.");
    }
  };

  return (
    <div className=" rounded-lg">
      <h1 className="text-3xl font-bold text-[#2B2520] mb-8">إدارة الطلبات</h1>

      <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex flex-col md:flex-row gap-4 md:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <label className="text-sm text-[#8B6F47] font-semibold">حالة الطلب</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as Order["status"] | "all")}
              className="px-3 py-2 border border-[#D9D4C8] rounded-lg text-sm focus:outline-none focus:border-[#E8A835]"
            >
              <option value="all">الكل</option>
              <option value="pending">قيد الانتظار</option>
              <option value="processing">قيد المعالجة</option>
              <option value="shipped">تم الشحن</option>
              <option value="delivered">تم التسليم</option>
            </select>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <label className="text-sm text-[#8B6F47] font-semibold">طريقة الدفع</label>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value as "all" | "online" | "cash")}
              className="px-3 py-2 border border-[#D9D4C8] rounded-lg text-sm focus:outline-none focus:border-[#E8A835]"
            >
              <option value="all">الكل</option>
              <option value="online">دفع إلكتروني</option>
              <option value="cash">دفع عند الاستلام</option>
            </select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={bulkActionStatus}
            onChange={(e) => setBulkActionStatus(e.target.value as Order["status"])}
            disabled={selectedOrderIds.size === 0}
            className="px-3 py-2 border border-[#D9D4C8] rounded-lg text-sm focus:outline-none focus:border-[#E8A835] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">تغيير الحالة</option>
            <option value="pending">قيد الانتظار</option>
            <option value="processing">قيد المعالجة</option>
            <option value="shipped">تم الشحن</option>
            <option value="delivered">تم التسليم</option>
          </select>
          <button
            onClick={handleBulkStatusChange}
            disabled={!bulkActionStatus || selectedOrderIds.size === 0}
            className="px-4 py-2 bg-[#8B6F47] text-white rounded-lg text-sm font-semibold hover:bg-[#8B6F47]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            تطبيق ({selectedOrderIds.size})
          </button>
        </div>
        <button
          onClick={handleExportCsv}
          disabled={selectedOrderIds.size === 0}
          className="px-4 py-2 bg-[#E8A835] text-white rounded-lg text-sm font-semibold hover:bg-[#E8A835]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          تصدير CSV ({selectedOrderIds.size})
        </button>
      </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-[#8B6F47]">جاري التحميل...</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-[#F5F1E8] border-b border-[#D9D4C8]">
                <tr>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-[#2B2520]">
                    <input
                      type="checkbox"
                      checked={orders.length > 0 && selectedOrderIds.size === orders.length}
                      onChange={handleSelectAllOrders}
                      className="accent-[#E8A835] size-4"
                    />
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-[#2B2520]">رقم الطلب</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-[#2B2520]">المبلغ</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-[#2B2520]">الحالة</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-[#2B2520]">طريقة الدفع</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-[#2B2520]">التاريخ</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-[#2B2520]">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-[#8B6F47]">
                      لا توجد طلبات حالياً
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order.id} className="border-b border-[#D9D4C8] hover:bg-[#F9F7F3]">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedOrderIds.has(order.id)}
                          onChange={() => handleSelectOrder(order.id)}
                          className="accent-[#E8A835] size-4"
                        />
                      </td>
                      <td className="px-6 py-4 text-[#2B2520] font-semibold">
                        {order.order_number || order.id}
                      </td>
                      <td className="px-6 py-4 text-[#C41E3A] font-semibold">{order.total_amount.toFixed(2)} ج.م</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(order.status)}
                          <span>{getStatusLabel(order.status)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getPaymentMethodClasses(order.payment_method)}`}
                        >
                          {getPaymentMethodLabel(order.payment_method)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[#8B6F47]">
                        <div className="flex flex-col">
                          <span>{new Date(order.created_at).toLocaleDateString("ar-EG")}</span>
                          <span className="text-xs text-[#8B6F47]/70">{new Date(order.created_at).toLocaleTimeString("ar-EG", { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
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
                                <DialogTitle className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                  <span>تفاصيل الطلب #{selectedOrder?.order_number || selectedOrder?.id}</span>
                                  <div className="flex items-center gap-2">
                                    {selectedOrder && (
                                      <>
                                        <span
                                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getPaymentMethodClasses(selectedOrder.payment_method)}`}
                                        >
                                          {getPaymentMethodLabel(selectedOrder.payment_method)}
                                        </span>
                                        <Button
                                          onClick={handlePrintOrder}
                                          variant="outline"
                                          size="sm"
                                          className="flex items-center gap-2"
                                        >
                                          <Printer size={16} />
                                          طباعة
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </DialogTitle>
                                <DialogDescription>
                                  تم الطلب في {selectedOrder && new Date(selectedOrder.created_at).toLocaleDateString("ar-EG")} - {selectedOrder && new Date(selectedOrder.created_at).toLocaleTimeString("ar-EG", { hour: '2-digit', minute: '2-digit' })}
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
                                        {getPaymentMethodLabel(selectedOrder.payment_method)}
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
                {!loading && loadingMore && (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-[#8B6F47]">
                      جاري تحميل المزيد...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <div ref={loadMoreRef} className="h-8" aria-hidden />
          </div>
        )}

      <Dialog open={showExportConfirmModal} onOpenChange={setShowExportConfirmModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تأكيد تصدير المنتجات إلى CSV</DialogTitle>
            <DialogDescription>
              سيتم تصدير المنتجات المجمعة من الطلبات المحددة إلى ملف CSV. يرجى مراجعة المعاينة أدناه:
            </DialogDescription>
          </DialogHeader>
          {csvPreviewData.rows.length > 0 ? (
            <div className="mt-4 border rounded-lg overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-[#F5F1E8]">
                  <tr>
                    {csvPreviewData.headers.map((header, index) => (
                      <th key={index} className="px-4 py-2 text-right text-sm font-semibold text-[#2B2520] whitespace-nowrap">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {csvPreviewData.rows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="border-t border-[#D9D4C8]">
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} className="px-4 py-2 text-right text-[#2B2520] whitespace-nowrap">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-4 text-[#8B6F47]">لا توجد بيانات للمعاينة.</p>
          )}
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setShowExportConfirmModal(false)}>
              إلغاء
            </Button>
            <Button
              onClick={() => {
                triggerCsvDownload(csvPreviewData.csvString);
                setShowExportConfirmModal(false);
                setSelectedOrderIds(new Set()); // Clear selection after export
              }}
              disabled={csvPreviewData.csvString === ""}
            >
              تأكيد التصدير
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
