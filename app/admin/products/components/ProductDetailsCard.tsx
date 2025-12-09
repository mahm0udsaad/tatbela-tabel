"use client"

import { Edit2, Plus, Star, Building2, Package, Tag, DollarSign, Box } from "lucide-react"
import type { CategoryOption, ProductFormState } from "../types"

type ProductDetailsCardProps = {
  productForm: ProductFormState
  onFieldChange: (field: keyof ProductFormState, value: string | boolean) => void
  categoryOptions: CategoryOption[]
  productTypeOptions: string[]
  onAddCategory?: () => void
  lockCategory?: boolean
}

export function ProductDetailsCard({
  productForm,
  onFieldChange,
  categoryOptions,
  productTypeOptions,
  onAddCategory,
  lockCategory = false,
}: ProductDetailsCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#E8E2D1] overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#FFF8ED] to-white px-6 py-4 border-b border-[#E8E2D1]">
        <h2 className="text-xl font-bold text-[#2B2520] flex items-center gap-2">
          <Edit2 size={20} className="text-[#E8A835]" /> بيانات المنتج
        </h2>
      </div>

      <div className="p-6 space-y-6">
        {/* Basic Information Section */}
        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-[#8B6F47] uppercase tracking-wide flex items-center gap-2">
            <Package size={16} /> المعلومات الأساسية
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-[#2B2520]">اسم المنتج *</label>
              <input
                type="text"
                value={productForm.name_ar}
                onChange={(e) => onFieldChange("name_ar", e.target.value)}
                placeholder="أدخل اسم المنتج"
                className="w-full rounded-lg border border-[#D9D4C8] px-4 py-2.5 text-sm transition-all focus:border-[#E8A835] focus:ring-2 focus:ring-[#E8A835]/20 focus:outline-none hover:border-[#E8A835]/50"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-[#2B2520]">العلامة التجارية</label>
              <select
                value={productForm.brand}
                onChange={(e) => onFieldChange("brand", e.target.value)}
                className="w-full rounded-lg border border-[#D9D4C8] px-4 py-2.5 text-sm bg-white transition-all focus:border-[#E8A835] focus:ring-2 focus:ring-[#E8A835]/20 focus:outline-none hover:border-[#E8A835]/50 cursor-pointer"
              >
                <option value="">اختر العلامة التجارية</option>
                <option value="Tabel">Tabel</option>
                <option value="Tatbeelah">Tatbeelah</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-[#2B2520]">نوع المنتج *</label>
              <select
                value={productForm.type}
                onChange={(e) => onFieldChange("type", e.target.value)}
                className="w-full rounded-lg border border-[#D9D4C8] px-4 py-2.5 text-sm bg-white transition-all focus:border-[#E8A835] focus:ring-2 focus:ring-[#E8A835]/20 focus:outline-none hover:border-[#E8A835]/50 cursor-pointer"
              >
                <option value="">اختر نوع المنتج</option>
                {productTypeOptions.map((typeOption) => (
                  <option key={typeOption} value={typeOption}>
                    {typeOption}
                  </option>
                ))}
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
            <label className="block text-sm font-semibold text-[#2B2520]">وصف المنتج</label>
            <textarea
              value={productForm.description_ar}
              onChange={(e) => onFieldChange("description_ar", e.target.value)}
              placeholder="أدخل وصف المنتج..."
              rows={4}
              className="w-full rounded-lg border border-[#D9D4C8] px-4 py-3 text-sm transition-all focus:border-[#E8A835] focus:ring-2 focus:ring-[#E8A835]/20 focus:outline-none hover:border-[#E8A835]/50 resize-none"
            />
          </div>
        </section>

        {/* Divider */}
        <div className="border-t border-[#E8E2D1]" />

        {/* Category Section */}
        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-[#8B6F47] uppercase tracking-wide flex items-center gap-2">
            <Box size={16} /> الفئة
          </h3>
          <div className="flex gap-2">
            {lockCategory ? (
              <div className="flex-1 rounded-lg border-2 border-[#E8A835] bg-[#FFF8ED] px-4 py-3 text-sm text-[#2B2520] flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#E8A835]" />
                سيتم حفظ المنتج ضمن الفئة المختارة
              </div>
            ) : (
              <>
                <select
                  value={productForm.category_id}
                  onChange={(e) => onFieldChange("category_id", e.target.value)}
                  className="flex-1 rounded-lg border border-[#D9D4C8] px-4 py-2.5 text-sm bg-white transition-all focus:border-[#E8A835] focus:ring-2 focus:ring-[#E8A835]/20 focus:outline-none hover:border-[#E8A835]/50 cursor-pointer"
                >
                  <option value="">اختر الفئة</option>
                  {categoryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {onAddCategory && (
                  <button
                    type="button"
                    onClick={onAddCategory}
                    className="px-4 py-2.5 bg-[#E8A835] text-white rounded-lg hover:bg-[#D9941E] transition-all flex items-center gap-2 whitespace-nowrap shadow-sm hover:shadow-md"
                    title="إضافة فئة جديدة"
                  >
                    <Plus size={18} />
                    <span className="hidden sm:inline">فئة جديدة</span>
                  </button>
                )}
              </>
            )}
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
                  productForm.pricing_mode === "unit"
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
                  productForm.pricing_mode === "per_kilo"
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
                {productForm.pricing_mode === "per_kilo" ? "السعر لكل كيلو (ج.م) *" : "السعر بعد الخصم (ج.م) *"}
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={productForm.pricing_mode === "per_kilo" ? productForm.price_per_kilo : productForm.price}
                  onChange={(e) => {
                    const value = e.target.value
                    if (productForm.pricing_mode === "per_kilo") {
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
              {productForm.pricing_mode === "per_kilo" && (
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
                  value={productForm.original_price}
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
                value={productForm.stock}
                onChange={(e) => onFieldChange("stock", e.target.value)}
                placeholder="0"
                className="w-full rounded-lg border border-[#D9D4C8] px-4 py-2.5 text-sm transition-all focus:border-[#E8A835] focus:ring-2 focus:ring-[#E8A835]/20 focus:outline-none hover:border-[#E8A835]/50"
              />
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="border-t border-[#E8E2D1]" />

        {/* Product Options Section */}
        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-[#8B6F47] uppercase tracking-wide">خيارات المنتج</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Featured Product */}
            <label
              className={`flex items-start gap-3 rounded-xl border-2 p-4 cursor-pointer transition-all ${
                productForm.is_featured
                  ? "border-[#E8A835] bg-[#FFF8ED]"
                  : "border-[#D9D4C8] hover:border-[#E8A835]/50 hover:bg-[#FFF8ED]/30"
              }`}
            >
              <div className="mt-0.5">
                <input
                  type="checkbox"
                  checked={productForm.is_featured}
                  onChange={(e) => onFieldChange("is_featured", e.target.checked)}
                  className="accent-[#E8A835] w-5 h-5 cursor-pointer"
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Star size={16} className={`${productForm.is_featured ? "text-[#E8A835]" : "text-[#8B6F47]"}`} />
                  <p className="text-sm font-semibold text-[#2B2520]">تمييز المنتج</p>
                </div>
                <p className="text-xs text-[#8B6F47] leading-relaxed">
                  إظهار في المنتجات المميزة - يظهر في الصفحة الرئيسية وقسم المنتجات المختارة
                </p>
              </div>
            </label>

            {/* B2B Product */}
            <label
              className={`flex items-start gap-3 rounded-xl border-2 p-4 cursor-pointer transition-all ${
                productForm.is_b2b
                  ? "border-[#E8A835] bg-[#FFF8ED]"
                  : "border-[#D9D4C8] hover:border-[#E8A835]/50 hover:bg-[#FFF8ED]/30"
              }`}
            >
              <div className="mt-0.5">
                <input
                  type="checkbox"
                  checked={productForm.is_b2b}
                  onChange={(e) => onFieldChange("is_b2b", e.target.checked)}
                  className="accent-[#E8A835] w-5 h-5 cursor-pointer"
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Building2 size={16} className={`${productForm.is_b2b ? "text-[#E8A835]" : "text-[#8B6F47]"}`} />
                  <p className="text-sm font-semibold text-[#2B2520]">منتجات الجملة (B2B)</p>
                </div>
                <p className="text-xs text-[#8B6F47] leading-relaxed">
                  تعيين كمنتج جملة - لن يظهر في متجر B2C، فقط في صفحة منتجات الجملة
                </p>
              </div>
            </label>
          </div>
        </section>
      </div>
    </div>
  )
}
