"use client"

import type React from "react"
import { usePathname } from "next/navigation"
import { AdminSidebar } from "./sidebar"
import { Toaster } from "@/components/ui/toaster"
import { SidebarProvider } from "@/components/ui/sidebar"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isLoginPage = pathname === "/admin/login"

  // Login page should not have sidebar
  if (isLoginPage) {
    return (
      <>
        {children}
        <Toaster />
      </>
    )
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-[#f8f8f8] flex w-full">
        <AdminSidebar />
        <main className="flex-1 p-6 md:p-8">
          {children}
        </main>
      </div>
      <Toaster />
    </SidebarProvider>
  )
}
