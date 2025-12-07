"use client"

import { useEffect, useMemo, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  type DragEndEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, Sparkles, Star } from "lucide-react"
import { updateProductsSortOrderAction } from "../actions"
import type { Product } from "../types"
import { formatCurrency } from "../types"

type SortableProduct = Pick<
  Product,
  | "id"
  | "name_ar"
  | "description_ar"
  | "brand"
  | "category"
  | "price"
  | "original_price"
  | "stock"
  | "is_featured"
  | "sort_order"
  | "product_images"
> & {
  rating?: number | null
  reviews_count?: number | null
  product_variants?: { stock: number | null }[] | null
}

type ProductSortBoardProps = {
  initialProducts: SortableProduct[]
}

function SortableProductRow({ product, index }: { product: SortableProduct; index: number }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: product.id })

  const primaryImage =
    product.product_images?.find((img) => img.is_primary) ?? product.product_images?.[0]

  const isOutOfStock =
    (product.stock ?? 0) <= 0 &&
    (product.product_variants?.length
      ? product.product_variants.every((variant) => (variant.stock ?? 0) <= 0)
      : true)

  const discount =
    product.original_price && product.original_price > product.price
      ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
      : 0

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 40 : undefined,
      }}
      className={`bg-white rounded-2xl overflow-hidden shadow hover:shadow-lg transition border ${
        isDragging ? "border-[#E8A835]" : "border-[#E8E2D1]"
      } flex flex-col relative`}
    >
      <button
        className="absolute top-3 left-3 z-20 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/90 border border-[#E8A835]/40 text-[#8B6F47] cursor-grab active:cursor-grabbing touch-none"
        {...attributes}
        {...listeners}
        aria-label="تحريك المنتج"
      >
        <GripVertical size={16} />
        <span className="text-xs font-semibold">#{index + 1}</span>
      </button>

      <div className="relative h-64 bg-[#F5F1E8] overflow-hidden">
        {primaryImage ? (
          <img
            src={primaryImage.image_url}
            alt={product.name_ar}
            className="w-full h-full object-contain"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">🛒</div>
        )}
        {discount > 0 && (
          <span className="absolute top-3 right-3 bg-[#C41E3A] text-white px-3 py-1 rounded-full text-sm font-bold z-10">
            -{discount}%
          </span>
        )}
        {isOutOfStock && (
          <span className="absolute top-3 left-20 bg-gray-900/80 text-white px-3 py-1 rounded-full text-sm font-bold z-10">
            غير متوفر
          </span>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        {product.is_featured ? (
          <span className="inline-flex items-center gap-2 px-3 py-1 mb-2 rounded-full bg-[#E8A835]/10 text-[#E8A835] text-xs font-bold">
            <Sparkles size={14} />
            منتج مميز
          </span>
        ) : null}
        <p className="text-xs text-[#E8A835] font-semibold uppercase mb-2">{product.brand}</p>
        <h3 className="text-lg font-bold text-[#2B2520] mb-1 line-clamp-2">{product.name_ar}</h3>
        <p className="text-sm text-[#8B6F47] line-clamp-2 mb-3">{product.description_ar}</p>
        <div className="flex items-center gap-2 mb-3">
          <div className="flex">
            {Array.from({ length: 5 }).map((_, starIndex) => (
              <Star
                key={starIndex}
                size={14}
                className={
                  starIndex < Math.round(product.rating || 0)
                    ? "text-[#E8A835] fill-[#E8A835]"
                    : "text-gray-300"
                }
              />
            ))}
          </div>
          <span className="text-xs text-[#8B6F47]">({product.reviews_count || 0})</span>
        </div>
        <div className="flex items-baseline gap-2 mt-auto">
          <span className="text-2xl font-bold text-[#C41E3A]">{formatCurrency(product.price)}</span>
          {product.original_price && product.original_price > product.price && (
            <span className="text-sm text-gray-400 line-through">
              {product.original_price.toFixed(2)} ج.م
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export function ProductSortBoard({ initialProducts }: ProductSortBoardProps) {
  const { toast } = useToast()
  const [items, setItems] = useState<SortableProduct[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const sortedInitialProducts = useMemo(
    () =>
      [...initialProducts].sort(
        (a, b) => (a.sort_order ?? Number.MAX_SAFE_INTEGER) - (b.sort_order ?? Number.MAX_SAFE_INTEGER),
      ),
    [initialProducts],
  )

  useEffect(() => {
    setItems(sortedInitialProducts)
  }, [sortedInitialProducts])

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const previousItems = items
    const oldIndex = items.findIndex((item) => item.id === active.id)
    const newIndex = items.findIndex((item) => item.id === over.id)
    const updatedItems = arrayMove(items, oldIndex, newIndex)

    setItems(updatedItems)
    setIsSaving(true)
    setStatusMessage("جاري حفظ الترتيب...")

    const updates = updatedItems.map((item, index) => ({
      id: item.id,
      sort_order: index,
    }))

    const result = await updateProductsSortOrderAction(updates)
    setIsSaving(false)

    if (!result?.success) {
      setStatusMessage("تعذر حفظ الترتيب")
      setItems(previousItems)
      toast({
        title: "تعذر حفظ الترتيب",
        description: result?.error ?? "حدث خطأ غير متوقع، حاول مرة أخرى",
        variant: "destructive",
      })
      return
    }

    setStatusMessage("تم حفظ الترتيب")
    toast({
      title: "تم الحفظ",
      description: "تم تحديث ترتيب المنتجات على صفحات المتجر",
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-[#2B2520]">ترتيب المنتجات</h2>
          <p className="text-sm text-[#8B6F47]">
            اسحب وأفلت لتحديد ترتيب ظهور المنتجات في جميع صفحات المتجر.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-full bg-white border border-[#E8A835]/40 text-[#8B6F47]">
          <span className="font-semibold text-[#2B2520]">عدد المنتجات:</span>
          <span className="text-[#C41E3A] font-bold">{items.length}</span>
        </div>
      </div>

      {statusMessage && (
        <div className="text-xs text-[#8B6F47] bg-white border border-[#E8A835]/30 rounded-lg px-3 py-2">
          {statusMessage} {isSaving && "⏳"}
        </div>
      )}

      {items.length === 0 ? (
        <div className="p-8 bg-white rounded-xl text-center text-[#8B6F47] border border-dashed border-[#D9D4C8]">
          لا توجد منتجات لعرضها حالياً.
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items} strategy={rectSortingStrategy}>
            <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-6">
              {items.map((product, index) => (
                <SortableProductRow key={product.id} product={product} index={index} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  )
}

