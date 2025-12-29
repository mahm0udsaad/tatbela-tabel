import React from "react"

interface ComingSoonProps {
  title?: string
  message: string
  description?: string
  icon?: string
}

export function ComingSoon({
  title = "قريباً...",
  message,
  description = "نعمل على تقديم تشكيلة مميزة من المنتجات التي ستضيف نكهة استثنائية لأطباقك",
  icon = "🍲",
}: ComingSoonProps) {
  return (
    <section className="py-24 px-4">
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-28 h-28 rounded-full bg-gradient-to-br from-[#F5F1E8] to-[#E8E2D1] shadow-lg">
            <span className="text-6xl">{icon}</span>
          </div>
        </div>

        <h2 className="text-4xl md:text-5xl font-bold text-[#2B2520] mb-6 leading-tight">
          {title}
        </h2>
        <p className="text-2xl md:text-3xl font-bold text-[#C41E3A] mb-4">
          {message}
        </p>
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="w-16 h-0.5 bg-gradient-to-r from-transparent to-[#E8A835]"></div>
          <span className="text-2xl">✨</span>
          <div className="w-16 h-0.5 bg-gradient-to-l from-transparent to-[#E8A835]"></div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <span className="px-4 py-2 rounded-full bg-[#F5F1E8] text-[#8B6F47] text-sm font-medium">
            مكونات طبيعية 100%
          </span>
          <span className="px-4 py-2 rounded-full bg-[#F5F1E8] text-[#8B6F47] text-sm font-medium">
            وصفات أصلية
          </span>
          <span className="px-4 py-2 rounded-full bg-[#F5F1E8] text-[#8B6F47] text-sm font-medium">
            جودة عالية
          </span>
        </div>
      </div>
    </section>
  )
}

