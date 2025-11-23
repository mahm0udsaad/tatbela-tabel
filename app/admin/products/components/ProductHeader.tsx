"use client"

import { Loader2, Plus, ArrowRight } from "lucide-react"

type ProductHeaderProps = {
  onCreateNew: () => void
  onSave: () => void
  isPending: boolean
  onBack?: () => void
}

export function ProductHeader({ onCreateNew, onSave, isPending, onBack }: ProductHeaderProps) {
  return (
    <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div className="flex items-center gap-4">
        {onBack && (
          <button 
            onClick={onBack}
            className="p-2 rounded-full hover:bg-black/5 transition-colors"
            title="العودة للفئات"
          >
            <ArrowRight size={24} className="text-[#2B2520]" />
          </button>
        )}
        <div>
          <h1 className="text-3xl font-bold text-[#2B2520]">إدارة المنتجات</h1>
          <p className="text-[#8B6F47]">تحكم كامل بالمنتجات، المتغيرات، ومستوى المخزون</p>
        </div>
      </div>
      <div className="flex gap-3">
        <button
          className="px-4 py-2 rounded-lg border border-[#E8A835] text-[#E8A835] font-semibold hover:bg-white flex items-center gap-2"
          onClick={onCreateNew}
        >
          <Plus size={16} />
          منتج جديد
        </button>
        <button className="px-5 py-2 rounded-lg bg-[#E8A835] text-white font-bold hover:bg-[#D9941E]" onClick={onSave} disabled={isPending}>
          {isPending ? <Loader2 className="animate-spin" size={18} /> : "حفظ التغييرات"}
        </button>
      </div>
    </header>
  )
}
