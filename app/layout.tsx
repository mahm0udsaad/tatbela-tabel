import type React from "react"
import { Suspense } from "react"
import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import { Cairo } from "next/font/google"
import { WebsiteLayout } from "@/components/website-layout"
import "./globals.css"

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  display: "swap",
})

export const metadata: Metadata = {
  title: "تتبيلة & تابل - Tatbeelah & Tabel | متجر التوابل المصرية",
  description: "متجر التوابل والخلطات المصرية الأصلية من تتبيلة وتابل",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
  other: {
    "og:locale": "ar_EG",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ar" dir="rtl" className={cairo.variable}>
      <body className="font-sans antialiased">
        <Suspense fallback={null}>
          <WebsiteLayout>{children}</WebsiteLayout>
        </Suspense>
        <Analytics />
      </body>
    </html>
  )
}
