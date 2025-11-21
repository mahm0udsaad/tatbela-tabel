'use client'

import { useEffect, useState } from "react"
import { AdminSidebar } from "../sidebar"
import { getSupabaseClient } from "@/lib/supabase"
import { ShoppingCart, Clock, AlertCircle } from "lucide-react"

type CartItem = {
  id: string
  quantity: number
  products: {
    name_ar: string
    price: number
    image_url: string | null
  }
}

type Cart = {
  id: string
  created_at: string
  updated_at: string
  user_id: string | null
  session_id: string | null
  status: string
  cart_items: CartItem[]
}

export default function AbandonedCartsPage() {
  const [carts, setCarts] = useState<Cart[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = getSupabaseClient()

  useEffect(() => {
    fetchAbandonedCarts()
  }, [])

  const fetchAbandonedCarts = async () => {
    try {
      // Fetch active carts that haven't been updated in the last 1 hour
      // Note: Supabase filtering on dates can be tricky with client-side time, 
      // so we'll fetch active carts and filter client-side or use a simple cutoff if needed.
      // For now, let's fetch all 'active' carts.
      
      const { data, error } = await supabase
        .from('carts')
        .select(`
          *,
          cart_items (
            id,
            quantity,
            products (
              name_ar,
              price,
              image_url
            )
          )
        `)
        .eq('status', 'active')
        .order('updated_at', { ascending: false })

      if (error) throw error

      setCarts(data || [])
    } catch (error) {
      console.error('Error fetching carts:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateTotal = (items: CartItem[]) => {
    return items.reduce((sum, item) => sum + (item.products?.price || 0) * item.quantity, 0)
  }

  return (
    <div className="flex min-h-screen bg-[#F5F1E8]">
      <AdminSidebar />
      <main className="flex-1 p-8">
        <h1 className="text-3xl font-bold text-[#2B2520] mb-8">السلات المتروكة</h1>
        
        {loading ? (
          <div className="text-center py-12">
            <p className="text-[#8B6F47]">جاري التحميل...</p>
          </div>
        ) : carts.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 text-green-600 rounded-full mb-4">
              <CheckCircle size={32} />
            </div>
            <h3 className="text-xl font-bold text-[#2B2520] mb-2">لا توجد سلات متروكة</h3>
            <p className="text-[#8B6F47]">جميع السلات نشطة أو تم تحويلها لطلبات.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {carts.map((cart) => {
              const total = calculateTotal(cart.cart_items)
              const itemsCount = cart.cart_items.reduce((acc, item) => acc + item.quantity, 0)
              const lastUpdate = new Date(cart.updated_at)
              const isAbandoned = (new Date().getTime() - lastUpdate.getTime()) > 1000 * 60 * 60 // 1 hour

              return (
                <div key={cart.id} className="bg-white rounded-xl shadow overflow-hidden border border-[#E8E2D1]">
                  <div className="p-4 border-b border-[#F5F1E8] flex flex-col sm:flex-row sm:items-center justify-between bg-gray-50 gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-full ${isAbandoned ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                        {isAbandoned ? <AlertCircle size={20} /> : <Clock size={20} />}
                      </div>
                      <div>
                        <p className="font-bold text-[#2B2520]">
                          {cart.user_id ? 'مستخدم مسجل' : 'زائر'} 
                          <span className="text-xs font-normal text-[#8B6F47] mr-2">({cart.id.slice(0, 8)})</span>
                        </p>
                        <p className="text-sm text-[#8B6F47]">
                          آخر تحديث: {lastUpdate.toLocaleString('ar-EG')}
                        </p>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-2xl font-bold text-[#C41E3A]">{total.toFixed(2)} ج.م</p>
                      <p className="text-sm text-[#8B6F47]">{itemsCount} منتجات</p>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <h4 className="font-semibold text-[#2B2520] mb-3">محتويات السلة:</h4>
                    <div className="space-y-3">
                      {cart.cart_items.map((item) => (
                        <div key={item.id} className="flex items-center gap-4 py-2 border-b border-[#F5F1E8] last:border-0">
                          {item.products?.image_url ? (
                            <img src={item.products.image_url} alt="" className="w-12 h-12 rounded-md object-cover" />
                          ) : (
                            <div className="w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center">
                              <ShoppingCart size={16} className="text-gray-400" />
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="font-medium text-[#2B2520]">{item.products?.name_ar}</p>
                            <p className="text-sm text-[#8B6F47]">
                              {item.quantity} × {item.products?.price} ج.م
                            </p>
                          </div>
                          <p className="font-semibold text-[#2B2520]">
                            {(item.quantity * (item.products?.price || 0)).toFixed(2)} ج.م
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

function CheckCircle({ size }: { size: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
  )
}

