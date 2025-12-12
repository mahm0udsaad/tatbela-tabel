"use client"

import { useEffect, useState } from "react"
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable"
import { useProductManager } from "@/app/admin/products/useProductManager"
import { ProductHeader } from "@/app/admin/products/components/ProductHeader"
import { StatusBanner } from "@/app/admin/products/components/StatusBanner"
import { ProductListPanel } from "@/app/admin/products/components/ProductListPanel"
import { B2BProductDetailsCard } from "./components/B2BProductDetailsCard"
import { ProductImagesCard } from "@/app/admin/products/components/ProductImagesCard"
import { VariantsCard } from "@/app/admin/products/components/VariantsCard"
import { CropModal } from "@/app/admin/products/components/CropModal"
import { AddCategoryModal } from "@/app/admin/products/components/AddCategoryModal"
import { CategoryTreePanel } from "@/app/admin/products/components/CategoryTreePanel"
import { updateProductsSortOrderAction } from "@/app/admin/products/actions"
import type { Category, Product } from "@/app/admin/products/types"

export function B2BProductManager({
  initialProducts,
  categories,
}: {
  initialProducts: Product[]
  categories: Category[]
}) {
  const manager = useProductManager({ initialProducts, categories })
  const [sortableProducts, setSortableProducts] = useState(manager.products)
  const [isSavingOrder, setIsSavingOrder] = useState(false)
  const [draggingProductId, setDraggingProductId] = useState<string | null>(null)
  const [newCategoryParentId, setNewCategoryParentId] = useState<string | null>(null)

  // Ensure is_b2b is always true for B2B products
  useEffect(() => {
    if (!manager.productForm.is_b2b) {
      manager.updateProductFormField("is_b2b", true)
    }
  }, [manager.productForm.is_b2b, manager.updateProductFormField])

  useEffect(() => {
    setSortableProducts(manager.products)
  }, [manager.products])

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

  const openAddCategory = (parentId: string | null = null) => {
    setNewCategoryParentId(parentId)
    manager.openAddCategoryModal()
  }

  const closeAddCategory = () => {
    setNewCategoryParentId(null)
    manager.closeAddCategoryModal()
  }

  const handleDragStart = (event: DragStartEvent) => {
    if (event.active?.data?.current?.type === "product") {
      setDraggingProductId(String(event.active.id))
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    setDraggingProductId(null)

    const activeType = event.active?.data?.current?.type
    const over = event.over
    if (activeType !== "product" || !over) return

    const overType = over.data?.current?.type
    const activeId = String(event.active.id)

    if (overType === "product" && over.id !== event.active.id) {
      const oldIndex = sortableProducts.findIndex((item) => item.id === activeId)
      const newIndex = sortableProducts.findIndex((item) => item.id === over.id)
      if (oldIndex === -1 || newIndex === -1) return

      const newItems = arrayMove(sortableProducts, oldIndex, newIndex)
      setSortableProducts(newItems)

      const updates = newItems.map((item, index) => ({
        id: item.id,
        sort_order: index,
      }))

      setIsSavingOrder(true)
      try {
        await updateProductsSortOrderAction(updates)
      } catch (error) {
        console.error("Failed to update sort order:", error)
        setSortableProducts(manager.products)
      } finally {
        setIsSavingOrder(false)
      }
      return
    }

    if (overType === "category") {
      const targetCategoryId = over.data?.current?.categoryId as string | null
      if (!targetCategoryId) return

      const product = sortableProducts.find((item) => item.id === activeId)
      if (product?.category_id === targetCategoryId) return

      manager.moveProductToCategory(activeId, targetCategoryId)

      if (manager.viewFilter === "category" && manager.selectedCategoryId && manager.selectedCategoryId !== targetCategoryId) {
        setSortableProducts((prev) => prev.filter((item) => item.id !== activeId))
      } else {
        const categoryName = categories.find((cat) => cat.id === targetCategoryId)?.name_ar ?? ""
        setSortableProducts((prev) =>
          prev.map((item) =>
            item.id === activeId ? { ...item, category_id: targetCategoryId, category: categoryName } : item,
          ),
        )
      }
    }
  }

  // Override startNewProduct to ensure is_b2b is always true
  const startNewProduct = () => {
    manager.startNewProduct()
    // Ensure is_b2b is true for new B2B products
    manager.updateProductFormField("is_b2b", true)
  }

  // Override submitProduct to ensure is_b2b is always true
  const submitProduct = () => {
    // Ensure is_b2b is true before submitting (the useEffect should handle this, but this is a safety check)
    if (!manager.productForm.is_b2b) {
      manager.updateProductFormField("is_b2b", true)
      // Wait for state update, then submit
      setTimeout(() => {
        manager.submitProduct()
      }, 10)
      return
    }
    manager.submitProduct()
  }

  if (!manager.selectedCategoryId && manager.viewFilter === "category") {
    return (
      <div className="space-y-6">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#2B2520]">إدارة منتجات الجملة (B2B)</h1>
            <p className="text-[#8B6F47]">اختر الفئة لعرض وإدارة منتجات الجملة</p>
          </div>
          <button
            onClick={() => openAddCategory(null)}
            className="px-4 py-2 rounded-lg border border-[#E8A835] text-[#E8A835] font-semibold hover:bg-white"
          >
            إدارة الفئات
          </button>
        </header>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <CategoryTreePanel
            categories={categories}
            selectedCategoryId={manager.selectedCategoryId}
            onSelectCategory={manager.selectCategory}
            draggingProductId={draggingProductId}
            onAddRootCategory={() => openAddCategory(null)}
            onAddSubCategory={(parentId) => openAddCategory(parentId)}
          />
        </DndContext>

        <AddCategoryModal
          isOpen={manager.showAddCategoryModal}
          onClose={closeAddCategory}
          onSuccess={closeAddCategory}
          categories={categories}
          defaultParentId={newCategoryParentId}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-sm text-[#8B6F47]">عرض:</span>
        <button
          onClick={() => manager.setViewFilter("category")}
          className={`px-3 py-1.5 rounded-full text-sm border ${
            manager.viewFilter === "category" ? "bg-[#E8A835] text-white border-[#E8A835]" : "border-[#E8E2D1] text-[#2B2520]"
          }`}
        >
          حسب الفئة
        </button>
        <button
          onClick={() => manager.setViewFilter("all")}
          className={`px-3 py-1.5 rounded-full text-sm border ${
            manager.viewFilter === "all" ? "bg-[#E8A835] text-white border-[#E8A835]" : "border-[#E8E2D1] text-[#2B2520]"
          }`}
        >
          كل المنتجات
        </button>
        <button
          onClick={() => manager.setViewFilter("featured")}
          className={`px-3 py-1.5 rounded-full text-sm border ${
            manager.viewFilter === "featured" ? "bg-[#E8A835] text-white border-[#E8A835]" : "border-[#E8E2D1] text-[#2B2520]"
          }`}
        >
          المميزة
        </button>
        {manager.selectedCategoryName && manager.viewFilter === "category" && (
          <span className="ml-2 text-sm text-[#2B2520]">الفئة الحالية: {manager.selectedCategoryName}</span>
        )}
      </div>

      <ProductHeader
        onCreateNew={startNewProduct}
        onSave={submitProduct}
        isPending={manager.isPending}
        onBack={manager.clearCategorySelection}
        selectedCategoryName={
          manager.viewFilter === "all"
            ? "كل منتجات الجملة"
            : manager.viewFilter === "featured"
              ? "منتجات الجملة المميزة"
              : manager.selectedCategoryName
        }
        isB2B={true}
      />

      <StatusBanner statusMessage={manager.statusMessage} errorMessage={manager.errorMessage} />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <section className="grid lg:grid-cols-7 gap-6">
          <div className="lg:col-span-2">
            <CategoryTreePanel
              categories={categories}
              selectedCategoryId={manager.selectedCategoryId}
              onSelectCategory={manager.selectCategory}
              draggingProductId={draggingProductId}
              onAddRootCategory={() => openAddCategory(null)}
              onAddSubCategory={(parentId) => openAddCategory(parentId)}
            />
          </div>

          <ProductListPanel
            products={sortableProducts}
            selectedProductId={manager.selectedProductId}
            onSelectProduct={manager.selectProduct}
            onDeleteProduct={manager.deleteProduct}
            isSavingOrder={isSavingOrder}
          />

          <div className="lg:col-span-3 space-y-6">
            <B2BProductDetailsCard
              productForm={manager.productForm}
              onFieldChange={manager.updateProductFormField}
              categoryOptions={manager.categoryOptions}
              onAddCategory={() => openAddCategory(manager.selectedCategoryId)}
              lockCategory={Boolean(manager.selectedCategoryId || manager.productForm.id)}
              selectedCategoryName={manager.selectedCategoryName ?? manager.selectedProduct?.category ?? null}
            />

            <ProductImagesCard
              selectedProduct={manager.selectedProduct}
              fileInputRef={manager.fileInputRef}
              onUploadClick={manager.triggerUpload}
              onFileChange={manager.handleFileChange}
              onSetPrimary={manager.handleSetPrimaryImage}
              onDeleteImage={manager.handleDeleteImage}
              pendingImages={manager.pendingImages}
              onDeletePending={manager.handleDeletePendingImage}
              onCropImage={manager.openCropModal}
            />
            <VariantsCard
              selectedProduct={manager.selectedProduct}
              variantForm={manager.variantForm}
              onFieldChange={manager.updateVariantField}
              onSubmit={manager.submitVariant}
              onEditVariant={manager.editVariant}
              onDeleteVariant={manager.deleteVariant}
            />
          </div>
        </section>
      </DndContext>

      <CropModal
        cropFile={manager.cropFile}
        crop={manager.crop}
        onCropChange={manager.updateCrop}
        onClose={manager.closeCropModal}
        onConfirm={manager.confirmCrop}
        isPending={manager.isPending}
        imageRef={manager.imageRef}
      />

      <AddCategoryModal
        isOpen={manager.showAddCategoryModal}
        onClose={closeAddCategory}
        onSuccess={closeAddCategory}
        categories={categories}
        defaultParentId={newCategoryParentId}
      />

      <button
        className="fixed bottom-4 right-64 z-40 px-4 py-3 rounded-full bg-[#E8A835] text-white font-bold shadow-lg hover:bg-[#D9941E] disabled:opacity-60 transition-colors"
        onClick={submitProduct}
        disabled={manager.isPending}
      >
        حفظ التغييرات
      </button>
    </div>
  )
}

