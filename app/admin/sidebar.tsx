"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ShoppingBag, Package, BarChart3, Users, LogOut, Images } from "lucide-react"

export function AdminSidebar({ onLogout }: { onLogout: () => void }) {
  const pathname = usePathname()

  const navItems = [
    { href: "/admin/dashboard", label: "لوحة التحكم", icon: BarChart3 },
    { href: "/admin/orders", label: "الطلبات", icon: ShoppingBag },
    { href: "/admin/products", label: "المنتجات", icon: Package },
    { href: "/admin/carousel", label: "صور السلايدر", icon: Images },
    { href: "/admin/revenue", label: "الإيرادات", icon: BarChart3 },
    { href: "/admin/users", label: "المستخدمين", icon: Users },
  ]

  return (
    <aside className="w-64 bg-[#2B2520] text-white min-h-screen p-6">
      <h1 className="text-2xl font-bold mb-8">لوحة التحكم</h1>
      <nav className="space-y-4 mb-8">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive ? "bg-[#E8A835] text-white" : "text-[#D9D4C8] hover:bg-[#3d3630]"
              }`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
      <button
        onClick={onLogout}
        className="w-full flex items-center gap-3 px-4 py-3 bg-red-600 hover:bg-red-700 rounded-lg text-white transition-colors"
      >
        <LogOut size={20} />
        <span>تسجيل الخروج</span>
      </button>
    </aside>
  )
}
