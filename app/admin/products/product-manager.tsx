"use client"

import { useProductManager } from "./useProductManager"
import { ProductHeader } from "./components/ProductHeader"
import { StatusBanner } from "./components/StatusBanner"
import { ProductListPanel } from "./components/ProductListPanel"
import { ProductDetailsCard } from "./components/ProductDetailsCard"
import { VariantsCard } from "./components/VariantsCard"
import { ProductImagesCard } from "./components/ProductImagesCard"
import { CropModal } from "./components/CropModal"
import { AddCategoryModal } from "./components/AddCategoryModal"
import { CategoryGrid } from "./components/CategoryGrid"
import type { Category, Product } from "./types"

export function ProductManager({
  initialProducts,
  categories,
}: {
  initialProducts: Product[]
  categories: Category[]
}) {
  const manager = useProductManager({ initialProducts, categories })
  const productTypeOptions = ["توابل", "بهارات", "خلطات", "صوصات"]

  if (!manager.selectedCategoryId) {
    return (
      <div className="space-y-6">
         <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#2B2520]">إدارة المنتجات</h1>
            <p className="text-[#8B6F47]">اختر الفئة لعرض وإدارة منتجاتها</p>
          </div>
          <button
              onClick={manager.openAddCategoryModal}
              className="px-4 py-2 rounded-lg border border-[#E8A835] text-[#E8A835] font-semibold hover:bg-white"
            >
              إدارة الفئات
          </button>
        </header>

        <CategoryGrid categories={categories} onSelectCategory={manager.selectCategory} />
        
        <AddCategoryModal
          isOpen={manager.showAddCategoryModal}
          onClose={manager.closeAddCategoryModal}
          onSuccess={manager.closeAddCategoryModal}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <ProductHeader
        onCreateNew={manager.startNewProduct}
        onSave={manager.submitProduct}
        isPending={manager.isPending}
        onBack={manager.clearCategorySelection}
        selectedCategoryName={manager.selectedCategoryName}
      />

      <StatusBanner statusMessage={manager.statusMessage} errorMessage={manager.errorMessage} />

      <section className="grid lg:grid-cols-5 gap-6">
        <ProductListPanel
          products={manager.products}
          selectedProductId={manager.selectedProductId}
          onSelectProduct={manager.selectProduct}
          onDeleteProduct={manager.deleteProduct}
        />

        <div className="lg:col-span-3 space-y-6">
          <ProductDetailsCard
            productForm={manager.productForm}
            onFieldChange={manager.updateProductFormField}
            categoryOptions={manager.categoryOptions}
            productTypeOptions={productTypeOptions}
            onAddCategory={manager.openAddCategoryModal}
          />

          <VariantsCard
            selectedProduct={manager.selectedProduct}
            variantForm={manager.variantForm}
            onFieldChange={manager.updateVariantField}
            onSubmit={manager.submitVariant}
            onEditVariant={manager.editVariant}
            onDeleteVariant={manager.deleteVariant}
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
        </div>
      </section>

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
        onClose={manager.closeAddCategoryModal}
        onSuccess={manager.closeAddCategoryModal}
      />
    </div>
  )
}
