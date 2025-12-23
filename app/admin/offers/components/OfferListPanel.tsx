"use client"

import { Edit, Trash2, GripVertical, Search, Star, Filter } from "lucide-react"
import { formatCurrency, type Offer } from "../types"
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

type OfferListPanelProps = {
  offers: Offer[]
  selectedOfferId: string | null
  onSelectOffer: (offer: Offer) => void
  onDeleteOffer: (offerId: string) => void
  isSavingOrder?: boolean
  searchTerm: string
  onSearchChange: (value: string) => void
  onlyFeatured: boolean
  onToggleOnlyFeatured: () => void
  stockFilter: "all" | "in_stock" | "out_of_stock"
  onStockFilterChange: (value: "all" | "in_stock" | "out_of_stock") => void
  brandOptions: string[]
  brandFilter: string
  onBrandFilterChange: (value: string) => void
}

function SortableOfferCard({
  offer,
  isSelected,
  onSelectOffer,
  onDeleteOffer,
}: {
  offer: Offer
  isSelected: boolean
  onSelectOffer: (offer: Offer) => void
  onDeleteOffer: (offerId: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: offer.id, data: { type: "offer" } })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.8 : 1,
  }

  const thumbnail = offer.offer_images?.find((img) => img.is_primary) ?? offer.offer_images?.[0]

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex gap-4 p-4 bg-white rounded-xl border ${
        isSelected ? "border-[#E8A835] shadow-lg" : "border-transparent shadow"
      } ${isDragging ? "shadow-2xl" : ""}`}
    >
      {/* Drag Handle */}
      <button
        className="flex-shrink-0 cursor-grab active:cursor-grabbing text-[#8B6F47] hover:text-[#E8A835] touch-none"
        {...attributes}
        {...listeners}
      >
        <GripVertical size={20} />
      </button>
      
      <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-[#F5F1E8]">
        {thumbnail ? (
          <img src={thumbnail.image_url} alt={offer.name_ar} className="w-full h-full object-contain" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl">🎁</div>
        )}
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1 gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-[#2B2520]">{offer.name_ar}</h3>
            {offer.is_featured && (
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-[#E8A835]/15 text-[#E8A835] border border-[#E8A835]/40">
                مميز
              </span>
            )}
          </div>
          <button className="text-sm text-[#E8A835] underline" onClick={() => onSelectOffer(offer)}>
            <Edit size={16} />
          </button>
        </div>
        <p className="text-xs text-[#8B6F47] mb-2">{offer.brand}</p>
        <div className="flex items-center justify-between text-sm">
          <span className="font-bold text-[#C41E3A]">{formatCurrency(offer.price)}</span>
          {offer.original_price && offer.original_price > offer.price && (
            <span className="text-xs text-gray-400 line-through">{formatCurrency(offer.original_price)}</span>
          )}
          <span
            className={`px-2 py-0.5 rounded-full text-xs ${offer.stock > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}
          >
            {offer.stock > 0 ? `متوفر (${offer.stock})` : "غير متوفر"}
          </span>
        </div>
      </div>
      <button className="text-red-500 hover:text-red-700" onClick={() => onDeleteOffer(offer.id)}>
        <Trash2 size={18} />
      </button>
    </div>
  )
}

export function OfferListPanel({
  offers,
  selectedOfferId,
  onSelectOffer,
  onDeleteOffer,
  isSavingOrder,
  searchTerm,
  onSearchChange,
  onlyFeatured,
  onToggleOnlyFeatured,
  stockFilter,
  onStockFilterChange,
  brandOptions,
  brandFilter,
  onBrandFilterChange,
}: OfferListPanelProps) {
  return (
    <div className="bg-white rounded-2xl shadow p-6 space-y-4">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-xl font-bold text-[#2B2520] flex items-center gap-2">
            <Filter size={18} className="text-[#E8A835]" />
            قائمة العروض
          </h2>
          <span className="text-sm text-[#8B6F47]">{offers.length} عرض</span>
        </div>

        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8B6F47]" size={16} />
            <input
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="ابحث بالاسم أو العلامة التجارية"
              className="w-full rounded-lg border border-[#D9D4C8] px-10 py-2 text-sm focus:border-[#E8A835] focus:ring-2 focus:ring-[#E8A835]/20 outline-none"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={onToggleOnlyFeatured}
              className={`px-3 py-1.5 rounded-full border text-sm flex items-center gap-1 transition ${
                onlyFeatured
                  ? "border-[#E8A835] bg-[#FFF8ED] text-[#2B2520]"
                  : "border-[#D9D4C8] text-[#8B6F47] hover:border-[#E8A835]/60"
              }`}
            >
              <Star size={14} /> العروض المميزة
            </button>

            <div className="flex items-center gap-1 text-sm">
              <span className="text-[#8B6F47]">المخزون:</span>
              {(["all", "in_stock", "out_of_stock"] as const).map((option) => (
                <button
                  key={option}
                  onClick={() => onStockFilterChange(option)}
                  className={`px-3 py-1 rounded-full border text-sm transition ${
                    stockFilter === option
                      ? "border-[#E8A835] bg-[#FFF8ED] text-[#2B2520]"
                      : "border-[#D9D4C8] text-[#8B6F47] hover:border-[#E8A835]/60"
                  }`}
                >
                  {option === "all" ? "الكل" : option === "in_stock" ? "متوفر" : "غير متوفر"}
                </button>
              ))}
            </div>

            <select
              value={brandFilter}
              onChange={(e) => onBrandFilterChange(e.target.value)}
              className="rounded-full border border-[#D9D4C8] px-3 py-1.5 text-sm bg-white text-[#2B2520] focus:border-[#E8A835] focus:ring-2 focus:ring-[#E8A835]/20"
            >
              <option value="">كل العلامات</option>
              {brandOptions.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      {isSavingOrder && (
        <div className="text-sm text-[#8B6F47] text-center py-2">جاري حفظ الترتيب...</div>
      )}
      {offers.length === 0 ? (
        <div className="text-center py-12 text-[#8B6F47]">
          <p className="mb-2">لا توجد عروض بعد</p>
          <p className="text-sm">انقر على "عرض جديد" لإضافة عرض</p>
        </div>
      ) : (
        <SortableContext items={offers.map((o) => o.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {offers.map((offer) => (
              <SortableOfferCard
                key={offer.id}
                offer={offer}
                isSelected={offer.id === selectedOfferId}
                onSelectOffer={onSelectOffer}
                onDeleteOffer={onDeleteOffer}
              />
            ))}
          </div>
        </SortableContext>
      )}
    </div>
  )
}

