"use client"

import type React from "react"
import { usePathname } from "next/navigation"
import { AdminSidebar } from "./sidebar"
import { Toaster } from "@/components/ui/toaster"

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
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />
      <main className="flex-1 bg-[#F5F1E8] p-6 md:p-8">
        {children}
      </main>
      <Toaster />
    </div>
  )
}
