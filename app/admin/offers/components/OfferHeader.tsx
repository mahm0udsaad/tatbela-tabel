"use client"

import { Loader2, Plus } from "lucide-react"

type OfferHeaderProps = {
  onCreateNew: () => void
  onSave: () => void
  isPending: boolean
}

export function OfferHeader({ onCreateNew, onSave, isPending }: OfferHeaderProps) {
  return (
    <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold text-[#2B2520]">إدارة العروض</h1>
        <p className="text-[#8B6F47]">تحكم كامل بالعروض، المتغيرات، ومستوى المخزون</p>
      </div>
      <div className="flex gap-3">
        <button
          className="px-4 py-2 rounded-lg border border-[#E8A835] text-[#E8A835] font-semibold hover:bg-white flex items-center gap-2"
          onClick={onCreateNew}
        >
          <Plus size={16} />
          عرض جديد
        </button>
        <button className="px-5 py-2 rounded-lg bg-[#E8A835] text-white font-bold hover:bg-[#D9941E]" onClick={onSave} disabled={isPending}>
          {isPending ? <Loader2 className="animate-spin" size={18} /> : "حفظ التغييرات"}
        </button>
      </div>
    </header>
  )
}

