"use client"

import Link from "next/link"
import { ShoppingCart, User, LogOut, Home, Store, Blend, Soup, Phone, Search } from "lucide-react"
import { useState, useEffect } from "react"
import { getSupabaseClient } from "@/lib/supabase"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"

import { useCart } from "@/components/cart-provider"

export function Navbar() {
  const [user, setUser] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const supabase = getSupabaseClient()
  const pathname = usePathname()
  const router = useRouter()
  const { cart } = useCart()

  const cartCount = cart?.items.reduce((acc, item) => acc + item.quantity, 0) || 0

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession()
      setUser(data.session?.user || null)
    }
    checkUser()

    const { data: authListener } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setUser(session?.user || null)
    })

    return () => {
      authListener?.subscription.unsubscribe()
    }
  }, [supabase])

  const navLinks = [
    { href: "/", label: "الصفحة الرئيسية", icon: Home, shortLabel: "الرئيسية" },
    { href: "/store", label: "التوابل", icon: Store, shortLabel: "التوابل" },
    { href: "/blends", label: "الخلطات", icon: Blend, shortLabel: "الخلطات" },
    { href: "/sauces", label: "الصوصات", icon: Soup, shortLabel: "الصوصات" },
    { href: "/contact", label: "تواصل معنا", icon: Phone, shortLabel: "اتصل" },
  ]

  const handleSearchSubmit = async (event?: React.FormEvent) => {
    event?.preventDefault()
    const query = searchTerm.trim()
    if (!query) return
    router.push(`/store?search=${encodeURIComponent(query)}`)
    setMobileSearchOpen(false)
  }

  return (
    <nav className="overflow-hidden bg-white border-b border-[#E8A835]/20">
      <div className="sm:mx-8 sm:px-4 px-1">
        <div className="flex items-center justify-between h-20">
          {/* Logo - Hidden on Mobile */}
          <Link href="/" className="flex items-center gap-3 flex-1">
            <Image src="/icon.png" alt="logo" width={100} height={100} className="w-64 h-40" />
          </Link>

          {/* Desktop Menu */}
          <div className="hidden  md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[#2B2520] hover:text-[#E8A835] transition-colors font-bold text-lg"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop Search */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden md:flex items-center bg-[#F5F1E8] rounded-full px-4 py-2 w-72 lg:w-[360px] border border-transparent focus-within:border-[#E8A835] mx-6"
          >
            <Search size={18} className="text-[#8B6F47]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث عن منتج أو خلطة"
              className="flex-1 bg-transparent border-none outline-none px-3 text-sm text-[#2B2520] placeholder:text-[#8B6F47]"
            />
            <button type="submit" className="text-sm font-semibold text-[#E8A835]">
              بحث
            </button>
          </form>

          {/* Right side - Cart and Auth */}
          <div className="flex items-center gap-4 justify-end flex-1">
            <Link href="/cart" className="p-2 hover:bg-[#F5F1E8] rounded-lg transition-colors hidden md:flex relative">
              <ShoppingCart size={24} className="text-[#2B2520]" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#C41E3A] text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* User Auth Menu - Desktop Only */}
            <div className="hidden md:flex items-center gap-2">
              {user ? (
                <>
                  <Link
                    href="/user/orders"
                    className="p-2 hover:bg-[#F5F1E8] rounded-lg transition-colors"
                    title="طلباتي"
                  >
                    <User size={24} className="text-[#2B2520]" />
                  </Link>
                  <button
                    onClick={async () => {
                      await supabase.auth.signOut()
                      setUser(null)
                    }}
                    className="p-2 hover:bg-[#F5F1E8] rounded-lg transition-colors"
                  >
                    <LogOut size={24} className="text-[#2B2520]" />
                  </button>
                </>
              ) : (
                <Link
                  href="/auth/sign-in"
                  className="px-4 py-2 bg-[#E8A835] text-white rounded-lg font-semibold hover:bg-[#D9941E] transition-colors"
                >
                  تسجيل الدخول
                </Link>
              )}
            </div>

            {/* Mobile Auth Icon */}
            <div className="md:hidden flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMobileSearchOpen((prev) => !prev)}
                className="p-2 rounded-lg border border-[#E8A835] text-[#2B2520]"
                aria-label="فتح البحث"
              >
                <Search size={22} />
              </button>
              {user ? (
                <Link href="/user/orders" className="p-2 hover:bg-[#F5F1E8] rounded-lg transition-colors">
                  <User size={24} className="text-[#2B2520]" />
                </Link>
              ) : (
                <Link href="/auth/sign-in" className="p-2 hover:bg-[#F5F1E8] rounded-lg transition-colors">
                  <User size={24} className="text-[#2B2520]" />
                </Link>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Mobile search drawer */}
      {mobileSearchOpen && (
        <div className="md:hidden px-4 pb-4 bg-white border-b border-[#E8A835]/20">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-3 bg-[#F5F1E8] rounded-2xl px-4 py-3">
            <Search size={20} className="text-[#8B6F47]" />
            <input
              type="text"
              autoFocus
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث عن منتجات"
              className="flex-1 bg-transparent border-none outline-none text-sm text-[#2B2520] placeholder:text-[#8B6F47]"
            />
            <button type="submit" className="text-sm font-semibold text-[#E8A835]">
              بحث
            </button>
            <button
              type="button"
              onClick={() => setMobileSearchOpen(false)}
              className="text-sm text-[#8B6F47]"
            >
              إغلاق
            </button>
          </form>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 right-0 left-0 bg-white border-t border-[#E8A835]/20 pb-safe z-50">
        <div className="flex items-center justify-around h-16 px-2">
          {navLinks.map((link) => {
            const Icon = link.icon
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all ${
                  isActive 
                    ? 'text-[#E8A835] bg-[#E8A835]/10' 
                    : 'text-[#2B2520] hover:text-[#E8A835] hover:bg-[#F5F1E8]'
                }`}
              >
                <Icon size={20} />
                <span className="text-xs font-medium">{link.shortLabel}</span>
              </Link>
            )
          })}
          <Link
            href="/cart"
            className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all relative ${
              pathname === '/cart'
                ? 'text-[#E8A835] bg-[#E8A835]/10'
                : 'text-[#2B2520] hover:text-[#E8A835] hover:bg-[#F5F1E8]'
            }`}
          >
            <div className="relative">
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#C41E3A] text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                  {cartCount}
                </span>
              )}
            </div>
            <span className="text-xs font-medium">السلة</span>
          </Link>
        </div>
      </div>
    </nav>
  )
}
