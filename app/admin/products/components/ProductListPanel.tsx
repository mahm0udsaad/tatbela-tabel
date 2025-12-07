"use client"

import { useState } from "react"
import { Edit, Trash2, GripVertical } from "lucide-react"
import { formatCurrency, type Product } from "../types"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { updateProductsSortOrderAction } from "../actions"

type ProductListPanelProps = {
  products: Product[]
  selectedProductId: string | null
  onSelectProduct: (product: Product) => void
  onDeleteProduct: (productId: string) => void
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
  } = useSortable({ id: product.id })

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
}

export function ProductListPanel({ products, selectedProductId, onSelectProduct, onDeleteProduct }: ProductListPanelProps) {
  const [items, setItems] = useState(products)
  const [isSaving, setIsSaving] = useState(false)

  // Update items when products prop changes
  if (JSON.stringify(products.map(p => p.id)) !== JSON.stringify(items.map(p => p.id))) {
    setItems(products)
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id)
      const newIndex = items.findIndex((item) => item.id === over.id)
      const newItems = arrayMove(items, oldIndex, newIndex)

      // Update local state immediately for responsiveness
      setItems(newItems)

      // Prepare updates with new sort orders
      const updates = newItems.map((item, index) => ({
        id: item.id,
        sort_order: index,
      }))

      // Persist to database
      setIsSaving(true)
      try {
        await updateProductsSortOrderAction(updates)
      } catch (error) {
        console.error("Failed to update sort order:", error)
        // Revert on failure
        setItems(products)
      } finally {
        setIsSaving(false)
      }
    }
  }

  return (
    <div className="lg:col-span-2 space-y-4 max-h-[720px] overflow-y-auto pr-2">
      {isSaving && (
        <div className="text-xs text-[#8B6F47] text-center py-2">جاري حفظ الترتيب...</div>
      )}
      {items.length === 0 ? (
        <div className="p-6 bg-white rounded-xl text-center text-[#8B6F47] border border-dashed border-[#D9D4C8]">
          لا توجد منتجات بعد. ابدأ بإضافة منتج جديد.
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={items} strategy={verticalListSortingStrategy}>
            {items.map((product) => (
              <SortableProductCard
                key={product.id}
                product={product}
                isSelected={selectedProductId === product.id}
                onSelectProduct={onSelectProduct}
                onDeleteProduct={onDeleteProduct}
              />
            ))}
          </SortableContext>
        </DndContext>
      )}
    </div>
  )
}
