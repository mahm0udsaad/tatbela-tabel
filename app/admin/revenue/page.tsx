"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase"
import { AdminSidebar } from "../sidebar"
import { TrendingUp, Calendar } from "lucide-react"

interface RevenueData {
  total: number
  thisMonth: number
  thisWeek: number
  lastWeek: number
  dailyData: Array<{ date: string; amount: number }>
}

export default function AdminRevenue() {
  const [revenue, setRevenue] = useState<RevenueData>({
    total: 0,
    thisMonth: 0,
    thisWeek: 0,
    lastWeek: 0,
    dailyData: [],
  })
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = getSupabaseClient()

  useEffect(() => {
    fetchRevenueData()
  }, [])

  const fetchRevenueData = async () => {
    try {
      const { data: orders, error } = await supabase.from("orders").select("total_amount, created_at")

      if (error) throw error

      const now = new Date()
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const thisWeekStart = new Date(now.getTime() - now.getDay() * 24 * 60 * 60 * 1000)
      const lastWeekStart = new Date(thisWeekStart.getTime() - 7 * 24 * 60 * 60 * 1000)

      let totalRevenue = 0
      let monthRevenue = 0
      let weekRevenue = 0
      let lastWeekRevenue = 0
      const dailyMap: Record<string, number> = {}

      orders?.forEach((order) => {
        const amount = order.total_amount || 0
        const date = new Date(order.created_at)

        totalRevenue += amount

        if (date >= thisMonth) monthRevenue += amount
        if (date >= thisWeekStart) weekRevenue += amount
        if (date >= lastWeekStart && date < thisWeekStart) lastWeekRevenue += amount

        const dateKey = date.toISOString().split("T")[0]
        dailyMap[dateKey] = (dailyMap[dateKey] || 0) + amount
      })

      const dailyData = Object.entries(dailyMap)
        .map(([date, amount]) => ({ date, amount }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-30)

      setRevenue({
        total: totalRevenue,
        thisMonth: monthRevenue,
        thisWeek: weekRevenue,
        lastWeek: lastWeekRevenue,
        dailyData,
      })
    } catch (error) {
      console.error("خطأ في جلب بيانات الإيرادات:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  return (
    <div className="flex">
      <AdminSidebar onLogout={handleLogout} />
      <main className="flex-1 bg-[#F5F1E8] p-8">
        <h1 className="text-3xl font-bold text-[#2B2520] mb-8">تحليل الإيرادات</h1>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-[#8B6F47]">جاري التحميل...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <RevenueCard title="إجمالي الإيرادات" amount={revenue.total} color="bg-green-50" />
              <RevenueCard title="إيرادات هذا الشهر" amount={revenue.thisMonth} color="bg-blue-50" />
              <RevenueCard title="إيرادات هذا الأسبوع" amount={revenue.thisWeek} color="bg-purple-50" />
              <RevenueCard title="إيرادات الأسبوع الماضي" amount={revenue.lastWeek} color="bg-orange-50" />
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-[#2B2520] mb-6 flex items-center gap-2">
                <Calendar size={24} />
                الإيرادات اليومية (آخر 30 يوم)
              </h2>

              <div className="overflow-x-auto">
                <div className="flex items-end gap-2 h-64 pb-4">
                  {revenue.dailyData.length === 0 ? (
                    <p className="text-[#8B6F47]">لا توجد بيانات</p>
                  ) : (
                    revenue.dailyData.map((data, index) => {
                      const maxAmount = Math.max(...revenue.dailyData.map((d) => d.amount))
                      const height = (data.amount / maxAmount) * 100 || 5

                      return (
                        <div key={index} className="flex-1 flex flex-col items-center gap-2">
                          <div
                            className="w-full bg-[#E8A835] rounded-t opacity-80 hover:opacity-100 transition-opacity"
                            style={{ height: `${height}%`, minHeight: "4px" }}
                            title={`${data.amount.toFixed(2)} ج.م`}
                          />
                          <span className="text-xs text-[#8B6F47]">{data.date.substring(5)}</span>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}

function RevenueCard({
  title,
  amount,
  color,
}: {
  title: string
  amount: number
  color: string
}) {
  return (
    <div className={`${color} rounded-xl p-6 shadow-md`}>
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-[#8B6F47] font-semibold">{title}</h3>
        <TrendingUp className="text-[#E8A835]" size={24} />
      </div>
      <p className="text-3xl font-bold text-[#2B2520]">{amount.toFixed(2)} ج.م</p>
    </div>
  )
}
