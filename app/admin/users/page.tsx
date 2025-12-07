"use client"

import { useEffect, useRef, useState } from "react"
import { getSupabaseClient } from "@/lib/supabase"
import { Mail, Calendar } from "lucide-react"

interface User {
  id: string
  email: string
  created_at: string
}

const PAGE_SIZE = 25

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const supabase = getSupabaseClient()

  useEffect(() => {
    fetchUsers(true)
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          fetchUsers()
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

  const fetchUsers = async (reset = false) => {
    if (!reset && (loading || loadingMore)) return

    if (reset) {
      setLoading(true)
      setHasMore(true)
    } else {
      setLoadingMore(true)
    }

    const from = reset ? 0 : users.length
    const to = from + PAGE_SIZE - 1

    try {
      const { data: profiles, error, count } = await supabase
        .from("profiles")
        .select("id, email, created_at", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to)

      if (error) throw error
      const received = profiles?.length ?? 0
      const previousLength = reset ? 0 : users.length
      const totalLoaded = previousLength + received

      setUsers((prev) => (reset ? profiles || [] : [...prev, ...(profiles || [])]))
      setHasMore(count ? totalLoaded < count : received === PAGE_SIZE)
    } catch (error) {
      console.error("خطأ في جلب المستخدمين:", error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  return (
    <div className="bg-[#F5F1E8] rounded-lg">
      <h1 className="text-3xl font-bold text-[#2B2520] mb-8">إدارة المستخدمين</h1>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-[#8B6F47]">جاري التحميل...</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-[#F5F1E8] border-b border-[#D9D4C8]">
                <tr>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-[#2B2520]">المعرف</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-[#2B2520]">البريد الإلكتروني</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-[#2B2520]">تاريخ التسجيل</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-[#8B6F47]">
                      لا يوجد مستخدمين
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="border-b border-[#D9D4C8] hover:bg-[#F9F7F3]">
                      <td className="px-6 py-4 text-[#8B6F47] font-mono text-sm">{user.id.substring(0, 8)}...</td>
                      <td className="px-6 py-4 text-[#2B2520] flex items-center gap-2">
                        <Mail size={16} className="text-[#E8A835]" />
                        {user.email}
                      </td>
                      <td className="px-6 py-4 text-[#8B6F47] flex items-center gap-2">
                        <Calendar size={16} />
                        {new Date(user.created_at).toLocaleDateString("ar-EG")}
                      </td>
                    </tr>
                  ))
                )}
                {!loading && loadingMore && (
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-center text-[#8B6F47]">
                      جاري تحميل المزيد...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <div ref={loadMoreRef} className="h-8" aria-hidden />
          </div>
        )}
    </div>
  )
}
