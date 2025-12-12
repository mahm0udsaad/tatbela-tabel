"use client"

import { useEffect } from "react"
import { Edit2, Star, Package, Tag, DollarSign } from "lucide-react"
import type { OfferFormState } from "../types"

type OfferDetailsCardProps = {
  offerForm: OfferFormState
  onFieldChange: (field: keyof OfferFormState, value: string | boolean) => void
}

export function OfferDetailsCard({
  offerForm,
  onFieldChange,
}: OfferDetailsCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#E8E2D1] overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#FFF8ED] to-white px-6 py-4 border-b border-[#E8E2D1]">
        <h2 className="text-xl font-bold text-[#2B2520] flex items-center gap-2">
          <Edit2 size={20} className="text-[#E8A835]" /> بيانات العرض
        </h2>
      </div>

      <div className="p-6 space-y-6">
        {/* Basic Information Section */}
        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-[#8B6F47] uppercase tracking-wide flex items-center gap-2">
            <Package size={16} /> المعلومات الأساسية
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-[#2B2520]">اسم العرض *</label>
              <input
                type="text"
                value={offerForm.name_ar}
                onChange={(e) => onFieldChange("name_ar", e.target.value)}
                placeholder="أدخل اسم العرض"
                className="w-full rounded-lg border border-[#D9D4C8] px-4 py-2.5 text-sm transition-all focus:border-[#E8A835] focus:ring-2 focus:ring-[#E8A835]/20 focus:outline-none hover:border-[#E8A835]/50"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-[#2B2520]">العلامة التجارية</label>
              <select
                value={offerForm.brand}
                onChange={(e) => onFieldChange("brand", e.target.value)}
                className="w-full rounded-lg border border-[#D9D4C8] px-4 py-2.5 text-sm bg-white transition-all focus:border-[#E8A835] focus:ring-2 focus:ring-[#E8A835]/20 focus:outline-none hover:border-[#E8A835]/50 cursor-pointer"
              >
                <option value="">اختر العلامة التجارية</option>
                <option value="Tabel">Tabel</option>
                <option value="Tatbeelah">Tatbeelah</option>
              </select>
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="border-t border-[#E8E2D1]" />

        {/* Description Section */}
        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-[#8B6F47] uppercase tracking-wide flex items-center gap-2">
            <Tag size={16} /> الوصف
          </h3>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-[#2B2520]">وصف العرض</label>
            <textarea
              value={offerForm.description_ar}
              onChange={(e) => onFieldChange("description_ar", e.target.value)}
              placeholder="أدخل وصف العرض..."
              rows={4}
              className="w-full rounded-lg border border-[#D9D4C8] px-4 py-3 text-sm transition-all focus:border-[#E8A835] focus:ring-2 focus:ring-[#E8A835]/20 focus:outline-none hover:border-[#E8A835]/50 resize-none"
            />
          </div>
        </section>

        {/* Divider */}
        <div className="border-t border-[#E8E2D1]" />

        {/* Pricing Section */}
        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-[#8B6F47] uppercase tracking-wide flex items-center gap-2">
            <DollarSign size={16} /> التسعير والمخزون
          </h3>
          
          {/* Pricing Mode Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <span className="text-sm font-semibold text-[#2B2520] whitespace-nowrap">طريقة التسعير:</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onFieldChange("pricing_mode", "unit")}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                  offerForm.pricing_mode === "unit"
                    ? "border-[#E8A835] bg-[#FFF8ED] text-[#2B2520] shadow-sm"
                    : "border-[#D9D4C8] text-[#8B6F47] hover:border-[#E8A835]/50 hover:bg-[#FFF8ED]/50"
                }`}
              >
                سعر ثابت
              </button>
              <button
                type="button"
                onClick={() => onFieldChange("pricing_mode", "per_kilo")}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                  offerForm.pricing_mode === "per_kilo"
                    ? "border-[#E8A835] bg-[#FFF8ED] text-[#2B2520] shadow-sm"
                    : "border-[#D9D4C8] text-[#8B6F47] hover:border-[#E8A835]/50 hover:bg-[#FFF8ED]/50"
                }`}
              >
                سعر للكيلو
              </button>
            </div>
          </div>

          {/* Price Fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-[#2B2520]">
                {offerForm.pricing_mode === "per_kilo" ? "السعر لكل كيلو (ج.م) *" : "السعر بعد الخصم (ج.م) *"}
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={offerForm.pricing_mode === "per_kilo" ? offerForm.price_per_kilo : offerForm.price}
                  onChange={(e) => {
                    const value = e.target.value
                    if (offerForm.pricing_mode === "per_kilo") {
                      onFieldChange("price_per_kilo", value)
                    } else {
                      onFieldChange("price", value)
                    }
                  }}
                  placeholder="0.00"
                  className="w-full rounded-lg border border-[#D9D4C8] px-4 py-2.5 text-sm transition-all focus:border-[#E8A835] focus:ring-2 focus:ring-[#E8A835]/20 focus:outline-none hover:border-[#E8A835]/50"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#8B6F47]">ج.م</span>
              </div>
              {offerForm.pricing_mode === "per_kilo" && (
                <p className="text-xs text-[#8B6F47] mt-1 flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-[#E8A835]" />
                  سيتم حساب سعر كل وزن تلقائياً في المتغيرات
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-[#2B2520]">السعر قبل الخصم (ج.م)</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={offerForm.original_price}
                  onChange={(e) => onFieldChange("original_price", e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-lg border border-[#D9D4C8] px-4 py-2.5 text-sm transition-all focus:border-[#E8A835] focus:ring-2 focus:ring-[#E8A835]/20 focus:outline-none hover:border-[#E8A835]/50"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#8B6F47]">ج.م</span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-[#2B2520]">المخزون *</label>
              <input
                type="number"
                min="0"
                value={offerForm.stock}
                onChange={(e) => onFieldChange("stock", e.target.value)}
                placeholder="0"
                className="w-full rounded-lg border border-[#D9D4C8] px-4 py-2.5 text-sm transition-all focus:border-[#E8A835] focus:ring-2 focus:ring-[#E8A835]/20 focus:outline-none hover:border-[#E8A835]/50"
              />
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="border-t border-[#E8E2D1]" />

        {/* Offer Options Section */}
        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-[#8B6F47] uppercase tracking-wide">خيارات العرض</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Featured Offer */}
            <label
              className={`flex items-start gap-3 rounded-xl border-2 p-4 cursor-pointer transition-all ${
                offerForm.is_featured
                  ? "border-[#E8A835] bg-[#FFF8ED]"
                  : "border-[#D9D4C8] hover:border-[#E8A835]/50 hover:bg-[#FFF8ED]/30"
              }`}
            >
              <div className="mt-0.5">
                <input
                  type="checkbox"
                  checked={offerForm.is_featured}
                  onChange={(e) => onFieldChange("is_featured", e.target.checked)}
                  className="accent-[#E8A835] w-5 h-5 cursor-pointer"
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Star size={16} className={`${offerForm.is_featured ? "text-[#E8A835]" : "text-[#8B6F47]"}`} />
                  <p className="text-sm font-semibold text-[#2B2520]">تمييز العرض</p>
                </div>
                <p className="text-xs text-[#8B6F47] leading-relaxed">
                  إظهار في العروض المميزة
                </p>
              </div>
            </label>
          </div>
        </section>
      </div>
    </div>
  )
}

