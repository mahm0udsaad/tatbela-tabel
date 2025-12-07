"use client"

import { Edit2, Plus } from "lucide-react"
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
    <div className="bg-white rounded-2xl shadow p-6 space-y-4">
      <h2 className="text-xl font-bold text-[#2B2520] flex items-center gap-2">
        <Edit2 size={18} /> بيانات المنتج
      </h2>
      <div className="grid md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-semibold text-[#2B2520] mb-2">اسم المنتج</label>
          <input
            type="text"
            value={productForm.name_ar}
            onChange={(e) => onFieldChange("name_ar", e.target.value)}
            className="w-full rounded-lg border border-[#D9D4C8] px-4 py-2 focus:border-[#E8A835] focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-[#2B2520] mb-2">العلامة التجارية</label>
          <select
            value={productForm.brand}
            onChange={(e) => onFieldChange("brand", e.target.value)}
            className="w-full rounded-lg border border-[#D9D4C8] px-4 py-2 focus:border-[#E8A835] focus:outline-none"
          >
            <option value="">اختر العلامة التجارية</option>
            <option value="Tabel">Tabel</option>
            <option value="Tatbeelah">Tatbeelah</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-[#2B2520] mb-2">نوع المنتج</label>
          <select
            value={productForm.type}
            onChange={(e) => onFieldChange("type", e.target.value)}
            className="w-full rounded-lg border border-[#D9D4C8] px-4 py-2 focus:border-[#E8A835] focus:outline-none"
          >
            <option value="">اختر نوع المنتج</option>
            {productTypeOptions.map((typeOption) => (
              <option key={typeOption} value={typeOption}>
                {typeOption}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col justify-end">
          <label className="block text-sm font-semibold text-[#2B2520] mb-2">تمييز المنتج</label>
          <label className="flex items-center gap-3 rounded-lg border border-[#D9D4C8] px-4 py-2 cursor-pointer">
            <input
              type="checkbox"
              checked={productForm.is_featured}
              onChange={(e) => onFieldChange("is_featured", e.target.checked)}
              className="accent-[#E8A835] w-5 h-5"
            />
            <div>
              <p className="text-sm font-semibold text-[#2B2520]">إظهار في المنتجات المميزة</p>
              <p className="text-xs text-[#8B6F47]">يظهر في الصفحة الرئيسية وقسم المنتجات المختارة</p>
            </div>
          </label>
        </div>
      </div>
      <div>
        <label className="block text-sm font-semibold text-[#2B2520] mb-2">الوصف</label>
        <textarea
          value={productForm.description_ar}
          onChange={(e) => onFieldChange("description_ar", e.target.value)}
          className="w-full rounded-lg border border-[#D9D4C8] px-4 py-2 h-28 focus:border-[#E8A835] focus:outline-none"
        />
      </div>
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-semibold text-[#2B2520]">طريقة التسعير</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onFieldChange("pricing_mode", "unit")}
              className={`px-3 py-2 rounded-lg border text-sm ${productForm.pricing_mode === "unit" ? "border-[#E8A835] bg-[#FFF8ED] text-[#2B2520]" : "border-[#D9D4C8] text-[#8B6F47]"}`}
            >
              سعر ثابت
            </button>
            <button
              type="button"
              onClick={() => onFieldChange("pricing_mode", "per_kilo")}
              className={`px-3 py-2 rounded-lg border text-sm ${productForm.pricing_mode === "per_kilo" ? "border-[#E8A835] bg-[#FFF8ED] text-[#2B2520]" : "border-[#D9D4C8] text-[#8B6F47]"}`}
            >
              سعر للكيلو
            </button>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-[#2B2520] mb-2">
              {productForm.pricing_mode === "per_kilo" ? "السعر لكل كيلو (ج.م)" : "السعر بعد الخصم"}
            </label>
            <input
              type="number"
              value={productForm.pricing_mode === "per_kilo" ? productForm.price_per_kilo : productForm.price}
              onChange={(e) => {
                const value = e.target.value
                if (productForm.pricing_mode === "per_kilo") {
                  onFieldChange("price_per_kilo", value)
                } else {
                  onFieldChange("price", value)
                }
              }}
              className="w-full rounded-lg border border-[#D9D4C8] px-4 py-2 focus:border-[#E8A835]"
            />
            {productForm.pricing_mode === "per_kilo" && (
              <p className="text-xs text-[#8B6F47] mt-1">سيتم حساب سعر كل وزن تلقائياً في المتغيرات</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#2B2520] mb-2">السعر قبل الخصم</label>
            <input
              type="number"
              value={productForm.original_price}
              onChange={(e) => onFieldChange("original_price", e.target.value)}
              className="w-full rounded-lg border border-[#D9D4C8] px-4 py-2 focus:border-[#E8A835]"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#2B2520] mb-2">المخزون</label>
            <input
              type="number"
              value={productForm.stock}
              onChange={(e) => onFieldChange("stock", e.target.value)}
              className="w-full rounded-lg border border-[#D9D4C8] px-4 py-2 focus:border-[#E8A835]"
            />
          </div>
        </div>
      </div>
      <div>
        <label className="block text-sm font-semibold text-[#2B2520] mb-2">الفئة</label>
        <div className="flex gap-2">
          {lockCategory ? (
            <div className="flex-1 rounded-lg border border-[#D9D4C8] px-4 py-3 bg-gray-50 text-[#8B6F47]">
              سيتم حفظ المنتج ضمن الفئة المختارة
            </div>
          ) : (
            <>
              <select
                value={productForm.category_id}
                onChange={(e) => onFieldChange("category_id", e.target.value)}
                className="flex-1 rounded-lg border border-[#D9D4C8] px-4 py-2 focus:border-[#E8A835] focus:outline-none"
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
                  className="px-4 py-2 bg-[#E8A835] text-white rounded-lg hover:bg-[#D9941E] transition-colors flex items-center gap-2 whitespace-nowrap"
                  title="إضافة فئة جديدة"
                >
                  <Plus size={18} />
                  <span className="hidden sm:inline">فئة جديدة</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
