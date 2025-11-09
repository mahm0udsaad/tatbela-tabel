"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase"
import { AdminSidebar } from "../sidebar"
import { Mail, Calendar } from "lucide-react"

interface User {
  id: string
  email: string
  created_at: string
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = getSupabaseClient()

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, email, created_at")
        .order("created_at", { ascending: false })

      if (error) throw error
      setUsers(profiles || [])
    } catch (error) {
      console.error("خطأ في جلب المستخدمين:", error)
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
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
