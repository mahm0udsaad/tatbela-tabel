"use client"

import Link from "next/link"
import { ShoppingCart, User, LogOut, Home, Store, Blend, Soup, Phone, Search, Tag } from "lucide-react"
import { useState, useEffect } from "react"
import { getSupabaseClient } from "@/lib/supabase"
import Image from "next/image"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { useCart } from "@/components/cart-provider"
import { SearchAutocomplete } from "@/components/search-autocomplete"
import type { CategoryRecord } from "@/app/store/category-helpers"

function getCategoryIcon(slug: string) {
  switch (slug) {
    case "atara":
      return Store
    case "blends":
      return Blend
    case "sauces":
      return Soup
    default:
      return Store
  }
}

export function Navbar() {
  const [user, setUser] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [mainCategories, setMainCategories] = useState<CategoryRecord[]>([])
  const supabase = getSupabaseClient()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { cart } = useCart()
  const isB2BRoute = pathname?.startsWith("/b2b")

  const cartCount = cart?.items.reduce((acc, item) => acc + item.quantity, 0) || 0

  // Sync search input with URL params
  useEffect(() => {
    const searchFromUrl = searchParams.get("search") || ""
    setSearchTerm(searchFromUrl)
  }, [searchParams])

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

  // Fetch only main (root) categories for navigation
  useEffect(() => {
    const fetchMainCategories = async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name_ar, parent_id, slug, sort_order")
        .is("parent_id", null)
        .order("sort_order", { ascending: true })

      if (!error && data) {
        setMainCategories(data as CategoryRecord[])
      }
    }

    fetchMainCategories()
  }, [supabase])

  const baseNavLinks = [
    { href: "/", label: "الرئيسية", icon: Home, shortLabel: "الرئيسية" },
    { href: "/b2b", label: "الجمله", icon: ShoppingCart, shortLabel: "جملة" },
    { href: "/offers", label: "العروض", icon: Tag, shortLabel: "العروض" },
    { href: "/contact", label: "تواصل معنا", icon: Phone, shortLabel: "اتصل" },
  ] as const

  const categoryNavLinks =
    mainCategories?.map((category) => {
      const Icon = getCategoryIcon(category.slug)
      return {
        href: `/store?category=${category.slug}`,
        label: category.name_ar,
        icon: Icon,
        shortLabel: category.name_ar,
      }
    }) ?? []

  const navLinks = [
    baseNavLinks[0],
    ...categoryNavLinks,
    ...baseNavLinks.slice(1),
  ]

  const handleSearchSubmit = (searchValue?: string | React.FormEvent) => {
    // Handle both string (from SearchAutocomplete) and form event (for backward compatibility)
    let query: string
    
    if (typeof searchValue === 'string') {
      query = searchValue.trim()
    } else if (searchValue && 'preventDefault' in searchValue) {
      searchValue.preventDefault()
      query = searchTerm.trim()
    } else {
      query = searchTerm.trim()
    }
    
    const targetPath = isB2BRoute ? "/b2b" : "/store"
    const params = new URLSearchParams(searchParams)
    
    if (query) {
      params.set("search", query)
    } else {
      params.delete("search")
    }
    
    const queryString = params.toString()
    router.push(queryString ? `${targetPath}?${queryString}` : targetPath)
    setMobileSearchOpen(false)
  }

  return (
   <>
    <nav className="overflow-visible bg-white/80 backdrop-blur-sm border-b border-primary/20 fixed top-0 left-0 right-0 z-50">
      <div className="sm:mx-2 sm:px-2">
        <div className="flex items-center justify-between h-20">
          {/* Left Side - Desktop Menu + Mobile Search */}
          <div className="flex items-center gap-4 flex-1">
            {/* Mobile Search Button */}
            <button
              type="button"
              onClick={() => setMobileSearchOpen((prev) => !prev)}
              className="md:hidden p-2 rounded-lg border border-primary text-foreground"
              aria-label="فتح البحث"
            >
              <Search size={22} />
            </button>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-0">
              {navLinks.map((link, index) => (
                <div key={link.href} className="flex items-center">
                  <Link
                    href={link.href}
                    className="text-foreground hover:text-primary transition-colors px-4 py-2"
                  >
                    {link.label}
                  </Link>
                  {index < navLinks.length - 1 && (
                    <div
                      className={`h-5 w-[1px] ${
                        index === 0 ? 'bg-primary' : 'bg-gray-400'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Logo - Centered */}
          <Link href="/" className="overflow-y-hidden h-full flex items-center justify-center flex-shrink-0 mx-4">
            <Image src="/icon.png" alt="logo" width={100} height={100} className="md:w-64 md:h-40 w-[225px] h-auto" />
          </Link>

          {/* Right Side - Search + Cart + Auth */}
          <div className="flex items-center gap-4 justify-end flex-1">
            {/* Desktop Search */}
            <div                 className="hidden md:flex items-center px-4 py-2 w-72 lg:w-[360px] border border-transparent focus-within:border-primary">
              <SearchAutocomplete
                value={searchTerm}
                onChange={setSearchTerm}
                onSubmit={handleSearchSubmit}
                placeholder="ابحث عن منتج أو خلطة"
                className="flex-1 bg-transparent border-none outline-none px-3 text-sm text-foreground placeholder:text-muted-foreground"
                showRecentSearches={true}
                showPopularSearches={true}
              />
            </div>

            {/* Desktop Cart */}
            <Link href={isB2BRoute ? "/b2b/cart" : "/cart"} className="p-2 hover:bg-muted rounded-lg transition-colors hidden md:flex relative">
              <ShoppingCart size={24} className="text-foreground" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-brand-red text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Desktop User Auth Menu */}
            <div className="hidden md:flex items-center gap-2">
              {user ? (
                <>
                  <Link
                    href="/user/orders"
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                    title="طلباتي"
                  >
                    <User size={24} className="text-foreground" />
                  </Link>
                  <button
                    onClick={async () => {
                      await supabase.auth.signOut()
                      setUser(null)
                    }}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                  >
                    <LogOut size={24} className="text-foreground" />
                  </button>
                </>
              ) : (
                <Link
                  href="/auth/sign-in"
                  className="px-1 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-brand-green-dark transition-colors"
                >
                  تسجيل الدخول
                </Link>
              )}
            </div>

            {/* Mobile User + Cart */}
            <div className="md:hidden flex items-center gap-2">
              {user ? (
                <Link href="/user/orders" className="p-2 hover:bg-muted rounded-lg transition-colors">
                  <User size={24} className="text-foreground" />
                </Link>
              ) : (
                <Link href="/auth/sign-in" className="p-2 hover:bg-muted rounded-lg transition-colors">
                  <User size={24} className="text-foreground" />
                </Link>
              )}
              <Link href={isB2BRoute ? "/b2b/cart" : "/cart"} className="p-2 hover:bg-muted rounded-lg transition-colors relative">
                <ShoppingCart size={24} className="text-foreground" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-brand-red text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                    {cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile search drawer */}
      {mobileSearchOpen && (
        <div className="md:hidden px-4 pb-4 bg-white/80 backdrop-blur-sm border-b border-primary/20">
          <div className="flex items-center gap-3 bg-muted rounded-2xl px-4 py-3">
            <SearchAutocomplete
              value={searchTerm}
              onChange={setSearchTerm}
              onSubmit={(value) => {
                handleSearchSubmit(value)
                setMobileSearchOpen(false)
              }}
              placeholder="ابحث عن منتجات"
              className="flex-1 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground"
            />
            <button
              type="button"
              onClick={() => setMobileSearchOpen(false)}
              className="text-sm text-muted-foreground"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar */}
    </nav>
      <div className="md:hidden fixed bottom-0 right-0 left-0 bg-white/80 backdrop-blur-sm border-t border-primary/20 pb-safe z-50">
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
                    ? 'text-primary bg-primary/10' 
                    : 'text-foreground hover:text-primary hover:bg-muted'
                }`}
              >
                <Icon size={20} />
                <span className="text-xs font-medium">{link.shortLabel}</span>
              </Link>
            )
          })}
          <Link
            href={isB2BRoute ? "/b2b/cart" : "/cart"}
            className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all relative ${
              pathname === '/cart' || pathname === '/b2b/cart'
                ? 'text-primary bg-primary/10'
                : 'text-foreground hover:text-primary hover:bg-muted'
            }`}
          >
            <div className="relative">
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-brand-red text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                  {cartCount}
                </span>
              )}
            </div>
            <span className="text-xs font-medium">السلة</span>
          </Link>
        </div>
      </div>
   </>
  )
}