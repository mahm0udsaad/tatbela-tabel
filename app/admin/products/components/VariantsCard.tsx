"use client"

import { Layers } from "lucide-react"
import { formatCurrency, type Product, type ProductVariant, type VariantFormState } from "../types"

type VariantsCardProps = {
  selectedProduct: Product | null
  variantForm: VariantFormState
  onFieldChange: (field: keyof VariantFormState, value: string) => void
  onSubmit: () => void
  onEditVariant: (variant: ProductVariant) => void
  onDeleteVariant: (variantId: string) => void
}

export function VariantsCard({
  selectedProduct,
  variantForm,
  onFieldChange,
  onSubmit,
  onEditVariant,
  onDeleteVariant,
}: VariantsCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#2B2520] flex items-center gap-2">
          <Layers size={18} className="text-[#E8A835]" /> المتغيرات
        </h2>
        {selectedProduct?.product_variants && selectedProduct.product_variants.length > 0 && (
          <span className="text-sm text-[#8B6F47]">({selectedProduct.product_variants.length}) متغير</span>
        )}
      </div>
      {selectedProduct?.product_variants && selectedProduct.product_variants.length > 0 ? (
        <div className="space-y-3">
          {selectedProduct.product_variants.map((variant) => (
            <div key={variant.id} className="p-4 rounded-xl border border-[#D9D4C8] flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-[#2B2520]">{variant.variant_type || "متغير"}</p>
                <p className="text-sm text-[#8B6F47]">
                  {variant.size ? `الحجم: ${variant.size}` : ""}{" "}
                  {variant.weight ? `- الوزن: ${variant.weight} جم` : ""}
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
        <p className="text-sm text-[#8B6F47]">لا توجد متغيرات لهذا المنتج.</p>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        <input
          placeholder="رمز SKU"
          value={variantForm.sku}
          onChange={(e) => onFieldChange("sku", e.target.value)}
          className="rounded-lg border border-[#D9D4C8] px-3 py-2"
        />
        <input
          placeholder="الوزن (جرام)"
          type="number"
          value={variantForm.weight}
          onChange={(e) => onFieldChange("weight", e.target.value)}
          className="rounded-lg border border-[#D9D4C8] px-3 py-2"
        />
        <input
          placeholder="الحجم"
          value={variantForm.size}
          onChange={(e) => onFieldChange("size", e.target.value)}
          className="rounded-lg border border-[#D9D4C8] px-3 py-2"
        />
        <input
          placeholder="النوع"
          value={variantForm.variant_type}
          onChange={(e) => onFieldChange("variant_type", e.target.value)}
          className="rounded-lg border border-[#D9D4C8] px-3 py-2"
        />
        <input
          placeholder="سعر خاص"
          type="number"
          value={variantForm.price}
          onChange={(e) => onFieldChange("price", e.target.value)}
          className="rounded-lg border border-[#D9D4C8] px-3 py-2"
        />
        <input
          placeholder="المخزون"
          type="number"
          value={variantForm.stock}
          onChange={(e) => onFieldChange("stock", e.target.value)}
          className="rounded-lg border border-[#D9D4C8] px-3 py-2"
        />
      </div>
      <div className="flex justify-end">
        <button className="px-4 py-2 rounded-lg bg-[#2B2520] text-white font-semibold hover:bg-[#473e36]" onClick={onSubmit}>
          {variantForm.id ? "تحديث المتغير" : "إضافة متغير"}
        </button>
      </div>
    </div>
  )
}
