"use client"

import { Edit, Trash2, GripVertical } from "lucide-react"
import { formatCurrency, type Product } from "../types"
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

type ProductListPanelProps = {
  products: Product[]
  selectedProductId: string | null
  onSelectProduct: (product: Product) => void
  onDeleteProduct: (productId: string) => void
  isSavingOrder?: boolean
}

function SortableProductCard({
  product,
  isSelected,
  onSelectProduct,
  onDeleteProduct,
}: {
  product: Product
  isSelected: boolean
  onSelectProduct: (product: Product) => void
  onDeleteProduct: (productId: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: product.id, data: { type: "product" } })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.8 : 1,
  }

  const thumbnail = product.product_images?.find((img) => img.is_primary) ?? product.product_images?.[0]

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
      
      <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-[#F5F1E8]">
        {product.has_tax && (
          <div className="absolute top-0 left-0 right-0 z-10 bg-[#C41E3A] text-white text-[9px] font-bold text-center py-0.5 px-1 shadow-sm">
            ضريبة 14%
          </div>
        )}
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
          <div className="flex flex-col gap-1">
            <span className="font-bold text-[#C41E3A]">{formatCurrency(product.price)}</span>
            {product.has_tax && (
              <span className="text-[10px] text-[#C41E3A] font-medium">
                خاضع للضريبة. 14%
              </span>
            )}
          </div>
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
}

export function ProductListPanel({ products, selectedProductId, onSelectProduct, onDeleteProduct, isSavingOrder }: ProductListPanelProps) {
  return (
    <div className="lg:col-span-2 space-y-4 max-h-[720px] overflow-y-auto pr-2">
      {isSavingOrder && (
        <div className="text-xs text-[#8B6F47] text-center py-2">جاري حفظ الترتيب...</div>
      )}
      {products.length === 0 ? (
        <div className="p-6 bg-white rounded-xl text-center text-[#8B6F47] border border-dashed border-[#D9D4C8]">
          لا توجد منتجات بعد. ابدأ بإضافة منتج جديد.
        </div>
      ) : (
        <SortableContext items={products} strategy={verticalListSortingStrategy}>
          {products.map((product) => (
            <SortableProductCard
              key={product.id}
              product={product}
              isSelected={selectedProductId === product.id}
              onSelectProduct={onSelectProduct}
              onDeleteProduct={onDeleteProduct}
            />
          ))}
        </SortableContext>
      )}
    </div>
  )
}
