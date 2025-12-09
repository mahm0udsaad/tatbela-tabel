"use client"

import { usePathname } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Toaster } from "@/components/ui/toaster"
import { CartProvider } from "@/components/cart-provider"

export function WebsiteLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAdminRoute = pathname?.startsWith("/admin")
  const isB2BRoute = pathname?.startsWith("/b2b")

  // For admin routes, just render children without website layout
  if (isAdminRoute) {
    return <>{children}</>
  }

  // For website routes, wrap with Navbar and Footer
  return (
    <CartProvider channel={isB2BRoute ? "b2b" : "b2c"}>
      <div className="pt-22 md:pt-22">
        <Navbar />
        {children}
        <Footer />
      </div>
      <Toaster />
    </CartProvider>
  )
}

