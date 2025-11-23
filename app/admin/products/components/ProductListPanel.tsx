"use client"

import { Edit, Trash2 } from "lucide-react"
import { formatCurrency, type Product } from "../types"

type ProductListPanelProps = {
  products: Product[]
  selectedProductId: string | null
  onSelectProduct: (product: Product) => void
  onDeleteProduct: (productId: string) => void
}

export function ProductListPanel({ products, selectedProductId, onSelectProduct, onDeleteProduct }: ProductListPanelProps) {
  return (
    <div className="lg:col-span-2 space-y-4 max-h-[720px] overflow-y-auto pr-2">
      {products.length === 0 ? (
        <div className="p-6 bg-white rounded-xl text-center text-[#8B6F47] border border-dashed border-[#D9D4C8]">
          لا توجد منتجات بعد. ابدأ بإضافة منتج جديد.
        </div>
      ) : (
        products.map((product) => {
          const thumbnail = product.product_images?.find((img) => img.is_primary) ?? product.product_images?.[0]
          return (
            <div
              key={product.id}
              className={`flex gap-4 p-4 bg-white rounded-xl border ${
                selectedProductId === product.id ? "border-[#E8A835] shadow-lg" : "border-transparent shadow"
              }`}
            >
              <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-[#F5F1E8]">
                {thumbnail ? (
                  <img src={thumbnail.image_url} alt={product.name_ar} className="w-full h-full object-contain" loading="lazy" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl">🌶️</div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1 gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-[#2B2520]">{product.name_ar}</h3>
                    {product.is_featured && (
                      <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-[#E8A835]/15 text-[#E8A835] border border-[#E8A835]/40">
                        مميز
                      </span>
                    )}
                  </div>
                  <button className="text-sm text-[#E8A835] underline" onClick={() => onSelectProduct(product)}>
                    <Edit size={16} />
                  </button>
                </div>
                <p className="text-xs text-[#8B6F47] mb-2">{product.brand}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-[#C41E3A]">{formatCurrency(product.price)}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs ${product.stock > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}
                  >
                    {product.stock > 0 ? `متوفر (${product.stock})` : "غير متوفر"}
                  </span>
                </div>
              </div>
              <button className="text-red-500 hover:text-red-700" onClick={() => onDeleteProduct(product.id)}>
                <Trash2 size={18} />
              </button>
            </div>
          )
        })
      )}
    </div>
  )
}
