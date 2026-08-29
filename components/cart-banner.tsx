"use client"

import Link from "next/link"
import { CheckCircle, X } from "lucide-react"
import { usePathname } from "next/navigation"

import { useCart } from "@/components/cart-provider"
import type { CartChannel } from "@/lib/actions/cart"

export function CartBanner({ channel = "b2c" }: { channel?: CartChannel }) {
  const pathname = usePathname()
  const { cart, isCartBannerVisible, hideCartBanner } = useCart()

  const isCartFlow = pathname === "/cart" || pathname === "/checkout" || pathname === "/b2b/cart" || pathname === "/b2b/checkout"
  if (!isCartBannerVisible || isCartFlow) return null

  const cartCount = cart?.items.reduce((total, item) => total + item.quantity, 0) ?? 0
  const cartHref = channel === "b2b" ? "/b2b/cart" : "/cart"

  return (
    <div className="pointer-events-none fixed inset-x-0 top-20 z-40 px-3 sm:px-4" role="status" aria-live="polite">
      <div className="pointer-events-auto mx-auto flex max-w-7xl items-center gap-3 rounded-xl border-2 border-primary bg-white px-3 py-3 shadow-lg sm:px-5">
        <CheckCircle className="shrink-0 text-primary" size={22} aria-hidden="true" />
        <p className="min-w-0 flex-1 text-sm font-semibold text-foreground sm:text-base">
          تمت إضافة المنتج إلى السلة
          {cartCount > 0 && <span className="mr-1 text-muted-foreground">({cartCount})</span>}
        </p>
        <Link
          href={cartHref}
          onClick={hideCartBanner}
          className="shrink-0 rounded-lg bg-primary px-4 py-2 text-center text-sm font-bold text-primary-foreground transition-colors hover:bg-brand-green-dark sm:px-5"
        >
          عرض السلة
        </Link>
        <button
          type="button"
          onClick={hideCartBanner}
          className="shrink-0 rounded-md p-1.5 text-brand-cumin transition-colors hover:bg-muted hover:text-foreground"
          aria-label="إغلاق رسالة السلة"
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
