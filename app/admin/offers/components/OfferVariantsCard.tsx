"use client"

import { Layers } from "lucide-react"
import { formatCurrency, type Offer, type OfferVariant, type VariantFormState } from "../types"

type OfferVariantsCardProps = {
  selectedOffer: Offer | null
  variantForm: VariantFormState
  onFieldChange: (field: keyof VariantFormState, value: string) => void
  onSubmit: () => void
  onEditVariant: (variant: OfferVariant) => void
  onDeleteVariant: (variantId: string) => void
}

export function OfferVariantsCard({
  selectedOffer,
  variantForm,
  onFieldChange,
  onSubmit,
  onEditVariant,
  onDeleteVariant,
}: OfferVariantsCardProps) {
  const isPerKilo = selectedOffer?.pricing_mode === "per_kilo"
  const basePrice = selectedOffer?.price_per_kilo

  const formatWeight = (weight: number | null) => {
    if (!weight) return ""
    if (weight === 500) return "نصف كيلو"
    if (weight >= 1000) {
      const kiloValue = weight / 1000
      const formatted = Number.parseFloat(kiloValue.toFixed(2)).toString()
      return `${formatted} كجم`
    }
    return `${weight} جم`
  }

  return (
    <div className="bg-white rounded-2xl shadow p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#2B2520] flex items-center gap-2">
          <Layers size={18} className="text-[#E8A835]" /> المتغيرات
        </h2>
        {selectedOffer?.offer_variants && selectedOffer.offer_variants.length > 0 && (
          <span className="text-sm text-[#8B6F47]">({selectedOffer.offer_variants.length}) متغير</span>
        )}
      </div>
      {selectedOffer?.offer_variants && selectedOffer.offer_variants.length > 0 ? (
        <div className="space-y-3">
          {selectedOffer.offer_variants.map((variant) => (
            <div key={variant.id} className="p-4 rounded-xl border border-[#D9D4C8] flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-[#2B2520]">{variant.variant_type || "متغير"}</p>
                <p className="text-sm text-[#8B6F47]">
                  {variant.size ? `الحجم: ${variant.size}` : ""}
                  {variant.weight ? `${variant.size ? " - " : ""}${formatWeight(variant.weight)}` : ""}
                </p>
                <p className="text-sm">
                  {variant.price ? formatCurrency(variant.price) : "يعتمد على السعر الأساسي"} | مخزون: {variant.stock}
                </p>
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1 rounded-lg border border-[#E8A835] text-[#E8A835]" onClick={() => onEditVariant(variant)}>
                  تعديل
                </button>
                <button className="px-3 py-1 rounded-lg border border-red-200 text-red-600" onClick={() => onDeleteVariant(variant.id)}>
                  حذف
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-[#8B6F47]">لا توجد متغيرات لهذا العرض.</p>
      )}

      <div className="flex flex-wrap gap-4">
        <div className="flex gap-2">
          <input
            placeholder="الوزن"
            type="number"
            inputMode="decimal"
            step={variantForm.weight_unit === "kg" ? "0.1" : "1"}
            value={variantForm.weight}
            onChange={(e) => onFieldChange("weight", e.target.value)}
            className="rounded-lg border border-[#D9D4C8] px-3 py-2 flex-1"
          />
          <select
            value={variantForm.weight_unit}
            onChange={(e) => onFieldChange("weight_unit", e.target.value)}
            className="rounded-lg border border-[#D9D4C8] px-3 py-2 bg-white"
          >
            <option value="g">جم</option>
            <option value="kg">كجم</option>
          </select>
        </div>
        <input
          placeholder={isPerKilo ? "يُحسب تلقائياً" : "سعر خاص"}
          type="number"
          value={variantForm.price}
          onChange={(e) => onFieldChange("price", e.target.value)}
          readOnly={isPerKilo}
          className={`rounded-lg border border-[#D9D4C8] px-3 py-2 ${isPerKilo ? "bg-gray-50 text-[#8B6F47]" : ""}`}
        />
        <input
          placeholder="المخزون"
          type="number"
          value={variantForm.stock}
          onChange={(e) => onFieldChange("stock", e.target.value)}
          className="rounded-lg border border-[#D9D4C8] px-3 py-2"
        />
      </div>
      {isPerKilo && (
        <div className="text-xs text-[#8B6F47] space-y-1">
          <p>أدخل الوزن واختر الوحدة (جم أو كجم)، وسيتم حساب سعر المتغير تلقائياً بناءً على سعر الكيلو.</p>
          {basePrice ? <p>سعر الكيلو الحالي: {formatCurrency(basePrice)}</p> : <p className="text-red-600">يرجى ضبط سعر الكيلو في بيانات العرض.</p>}
        </div>
      )}
      <div className="flex justify-end">
        <button className="px-4 py-2 rounded-lg bg-[#2B2520] text-white font-semibold hover:bg-[#473e36]" onClick={onSubmit}>
          {variantForm.id ? "تحديث المتغير" : "إضافة متغير"}
        </button>
      </div>
    </div>
  )
}

