"use client"

import type { ChangeEvent } from "react"
import { useEffect, useMemo, useRef, useState, useTransition } from "react"
import type { Crop } from "react-image-crop"
import { useRouter } from "next/navigation"
import {
  deleteProductAction,
  deleteProductImageAction,
  deleteVariantAction,
  setPrimaryImageAction,
  uploadProductImageAction,
  upsertProductAction,
  upsertVariantAction,
} from "./actions"
import { useToast } from "@/hooks/use-toast"
import {
  type Category,
  type CategoryOption,
  type Product,
  type ProductVariant,
  type ProductFormState,
  type VariantFormState,
  emptyProductForm,
  emptyVariantForm,
  mapProductToForm,
  type CropFileState,
} from "./types"

export type UseProductManagerArgs = {
  initialProducts: Product[]
  categories: Category[]
}

export function useProductManager({ initialProducts, categories }: UseProductManagerArgs) {
  const router = useRouter()
  const { toast } = useToast()
  const [products, setProducts] = useState<Product[]>(initialProducts ?? [])
  
  // New state for category selection
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)

  // Filter products based on selected category
  const filteredProducts = useMemo(() => {
    if (!selectedCategoryId) return []
    return products.filter((p) => p.category_id === selectedCategoryId)
  }, [products, selectedCategoryId])

  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [productForm, setProductForm] = useState<ProductFormState>(emptyProductForm)
  const [variantForm, setVariantForm] = useState<VariantFormState>(emptyVariantForm)
  const [variantProductId, setVariantProductId] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [cropFile, setCropFile] = useState<CropFileState>(null)
  const [cropImageId, setCropImageId] = useState<string | null>(null)
  const [pendingImages, setPendingImages] = useState<{ id: string; file: File; src: string }[]>([])
  const [crop, setCrop] = useState<Crop>({ unit: "%", width: 60, height: 60, x: 20, y: 20 })
  const imageRef = useRef<HTMLImageElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isCreatingNewProduct, setIsCreatingNewProduct] = useState(false)
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false)

  const selectedProduct = useMemo(() => products.find((product) => product.id === selectedProductId) ?? null, [products, selectedProductId])

  useEffect(() => {
    setProducts(initialProducts ?? [])
  }, [initialProducts])

  // When category changes, select the first product in that category or start new
  useEffect(() => {
    if (!selectedCategoryId) {
      setSelectedProductId(null)
      setIsCreatingNewProduct(false)
      return
    }

    const productsInCat = products.filter(p => p.category_id === selectedCategoryId)
    if (productsInCat.length > 0) {
      setSelectedProductId(productsInCat[0].id)
      setIsCreatingNewProduct(false)
    } else {
      // If no products in category, maybe start new product automatically?
      // Or just show empty state.
      setSelectedProductId(null)
      // We don't necessarily want to start creating immediately unless user clicks "New Product"
      setIsCreatingNewProduct(false)
    }
  }, [selectedCategoryId, products])

  useEffect(() => {
    if (selectedProduct) {
      setIsCreatingNewProduct(false)
      setProductForm(mapProductToForm(selectedProduct))
      setVariantProductId(selectedProduct.id)
      setVariantForm(emptyVariantForm)
    } else if (isCreatingNewProduct) {
      // Keep form empty but preserve category if selected
      setProductForm(prev => ({
        ...emptyProductForm,
        category_id: selectedCategoryId ?? prev.category_id
      }))
      setVariantProductId(null)
      setVariantForm(emptyVariantForm)
    }
  }, [selectedProduct, isCreatingNewProduct, selectedCategoryId])

  const selectCategory = (categoryId: string) => {
    setSelectedCategoryId(categoryId)
    // selection logic handled by useEffect
  }

  const clearCategorySelection = () => {
    setSelectedCategoryId(null)
  }

  const startNewProduct = () => {
    setIsCreatingNewProduct(true)
    setSelectedProductId(null)
    setProductForm({
      ...emptyProductForm,
      category_id: selectedCategoryId ?? ""
    })
    setVariantForm(emptyVariantForm)
    setVariantProductId(null)
    setPendingImages([])
  }

  const selectProduct = (product: Product) => {
    setSelectedProductId(product.id)
    setProductForm(mapProductToForm(product))
    setVariantProductId(product.id)
    setVariantForm(emptyVariantForm)
    setIsCreatingNewProduct(false)
    setPendingImages([])
  }

  const updateProductFormField = (field: keyof ProductFormState, value: string | boolean) => {
    setProductForm((prev) => ({ ...prev, [field]: value }))
  }

  const updateVariantField = (field: keyof VariantFormState, value: string) => {
    setVariantForm((prev) => ({ ...prev, [field]: value }))
  }

  const submitProduct = () => {
    if (!productForm.name_ar.trim()) {
      setErrorMessage("اسم المنتج مطلوب")
      return
    }

    if (!productForm.type.trim()) {
      setErrorMessage("نوع المنتج مطلوب")
      return
    }

    const categoryRecord = productForm.category_id ? categories.find((category) => category.id === productForm.category_id) : null
    const selectedCategoryName = categoryRecord?.name_ar ?? selectedProduct?.category ?? null

    if (!selectedCategoryName) {
      setErrorMessage("الفئة مطلوبة")
      return
    }

    const trimmedType = productForm.type.trim()
    
    // Additional safety check
    if (!trimmedType) {
      setErrorMessage("نوع المنتج مطلوب")
      return
    }

    const payload = {
      id: productForm.id,
      name_ar: productForm.name_ar.trim(),
      description_ar: productForm.description_ar.trim() || null,
      brand: productForm.brand.trim(),
      type: trimmedType,
      price: Number(productForm.price) || 0,
      original_price: productForm.original_price ? Number(productForm.original_price) : null,
      stock: Number(productForm.stock) || 0,
      category: selectedCategoryName,
      category_id: productForm.category_id || null,
      is_featured: productForm.is_featured,
    }

    startTransition(async () => {
      setStatusMessage(null)
      setErrorMessage(null)
      const result = await upsertProductAction(payload)
      if (!result.success) {
        const message = result.error ?? "تعذر حفظ المنتج"
        setErrorMessage(message)
        toast({ title: "خطأ في الحفظ", description: message, variant: "destructive" })
        return
      }
      setIsCreatingNewProduct(false)
      if (result.productId) {
        // Upload pending images
        if (pendingImages.length > 0) {
          await Promise.all(pendingImages.map(async (img, index) => {
            const formData = new FormData()
            formData.append("productId", result.productId!)
            // First image is primary if no images exist (which is true for new product)
            formData.append("isPrimary", index === 0 ? "true" : "false")
            formData.append("file", img.file)
            await uploadProductImageAction(formData)
          }))
          setPendingImages([])
        }

        setSelectedProductId(result.productId)
        setVariantProductId(result.productId)
      }
      setStatusMessage("تم حفظ المنتج بنجاح")
      toast({ title: "تم حفظ المنتج", description: "تم تحديث بيانات المنتج بنجاح" })
      router.refresh()
    })
  }

  const deleteProduct = (productId: string) => {
    if (!confirm("هل ترغب في حذف هذا المنتج؟")) return
    startTransition(async () => {
      const result = await deleteProductAction(productId)
      if (!result.success) {
        setErrorMessage(result.error ?? "تعذر حذف المنتج")
        return
      }
      setStatusMessage("تم حذف المنتج")
      if (selectedProductId === productId) {
        // If we deleted the selected product, try to select another one or new product
        // but wait for refresh/state update
        setSelectedProductId(null)
        setIsCreatingNewProduct(false) 
        // Logic in useEffect will pick next product if available
      }
      router.refresh()
    })
  }

  const submitVariant = () => {
    if (!variantProductId) {
      setErrorMessage("يجب حفظ المنتج قبل إضافة المتغيرات")
      return
    }

    const payload = {
      id: variantForm.id,
      product_id: variantProductId,
      sku: variantForm.sku || null,
      weight: variantForm.weight ? Number(variantForm.weight) : null,
      size: variantForm.size || null,
      variant_type: variantForm.variant_type || null,
      price: variantForm.price ? Number(variantForm.price) : null,
      stock: Number(variantForm.stock) || 0,
    }

    startTransition(async () => {
      setStatusMessage(null)
      setErrorMessage(null)
      const result = await upsertVariantAction(payload)
      if (!result.success) {
        setErrorMessage(result.error ?? "تعذر حفظ المتغير")
        return
      }
      setStatusMessage("تم تحديث المتغير")
      setVariantForm(emptyVariantForm)
      router.refresh()
    })
  }

  const editVariant = (variant: ProductVariant) => {
    setVariantProductId(selectedProduct?.id ?? null)
    setVariantForm({
      id: variant.id,
      sku: variant.sku ?? "",
      weight: variant.weight?.toString() ?? "",
      size: variant.size ?? "",
      variant_type: variant.variant_type ?? "",
      price: variant.price?.toString() ?? "",
      stock: variant.stock?.toString() ?? "",
    })
  }

  const deleteVariant = (variantId: string) => {
    if (!confirm("هل ترغب في حذف هذا المتغير؟")) return
    startTransition(async () => {
      const result = await deleteVariantAction(variantId)
      if (!result.success) {
        setErrorMessage(result.error ?? "تعذر حذف المتغير")
        return
      }
      setStatusMessage("تم حذف المتغير")
      router.refresh()
    })
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }

    if (selectedProduct && !isCreatingNewProduct) {
      startTransition(async () => {
        const formData = new FormData()
        formData.append("productId", selectedProduct.id)
        const isFirst = !selectedProduct.product_images || selectedProduct.product_images.length === 0
        formData.append("isPrimary", isFirst ? "true" : "false")
        formData.append("file", file)

        const result = await uploadProductImageAction(formData)
        if (!result.success) {
          setErrorMessage(result.error ?? "تعذر رفع الصورة")
          return
        }
        setStatusMessage("تم رفع الصورة")
        router.refresh()
      })
    } else {
      const reader = new FileReader()
      reader.onload = () => {
        setPendingImages((prev) => [...prev, { id: crypto.randomUUID(), file, src: reader.result as string }])
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDeletePendingImage = (id: string) => {
    setPendingImages((prev) => prev.filter((img) => img.id !== id))
  }

  const openCropModal = async (imageId: string, imageUrl: string) => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const file = new File([blob], "image.png", { type: blob.type })
      const reader = new FileReader()
      reader.onload = () => {
        setCropFile({ file, src: reader.result as string })
        setCropImageId(imageId)
      }
      reader.readAsDataURL(file)
    } catch (e) {
      setErrorMessage("تعذر تحميل الصورة للقص")
    }
  }

  const confirmCrop = () => {
    if (!cropFile || !selectedProduct || !imageRef.current || !crop.width || !crop.height) return

    const imageElement = imageRef.current
    const scaleX = imageElement.naturalWidth / imageElement.width
    const scaleY = imageElement.naturalHeight / imageElement.height
    const canvas = document.createElement("canvas")
    const cropWidth = (crop.width ?? 0) * scaleX
    const cropHeight = (crop.height ?? 0) * scaleY
    canvas.width = cropWidth
    canvas.height = cropHeight
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.drawImage(
      imageElement,
      (crop.x ?? 0) * scaleX,
      (crop.y ?? 0) * scaleY,
      cropWidth,
      cropHeight,
      0,
      0,
      cropWidth,
      cropHeight,
    )

    canvas.toBlob(async (blob) => {
      if (!blob) return

      const croppedFile = new File([blob], cropFile.file.name.replace(/\.[^.]+$/, ".webp"), { type: "image/webp" })
      const formData = new FormData()
      formData.append("productId", selectedProduct.id)

      let isPrimary = false
      if (cropImageId) {
        const oldImage = selectedProduct.product_images?.find((img) => img.id === cropImageId)
        if (oldImage && oldImage.is_primary) {
          isPrimary = true
        }
      } else {
        isPrimary = selectedProduct.product_images?.some((img) => img.is_primary) ? false : true
      }

      formData.append("isPrimary", isPrimary ? "true" : "false")
      formData.append("file", croppedFile)

      startTransition(async () => {
        const result = await uploadProductImageAction(formData)
        if (!result.success) {
          setErrorMessage(result.error ?? "تعذر رفع الصورة")
          return
        }

        if (cropImageId) {
          await deleteProductImageAction(cropImageId)
          setCropImageId(null)
        }

        setStatusMessage("تم رفع الصورة")
        setCropFile(null)
        router.refresh()
      })
    }, "image/webp")
  }

  const handleSetPrimaryImage = (imageId: string) => {
    if (!selectedProduct) return
    startTransition(async () => {
      const result = await setPrimaryImageAction(imageId, selectedProduct.id)
      if (!result.success) {
        setErrorMessage(result.error ?? "تعذر تحديث الصورة الرئيسية")
        return
      }
      setStatusMessage("تم تحديث الصورة الرئيسية")
      router.refresh()
    })
  }

  const handleDeleteImage = (imageId: string) => {
    if (!confirm("هل ترغب في حذف هذه الصورة؟")) return
    startTransition(async () => {
      const result = await deleteProductImageAction(imageId)
      if (!result.success) {
        setErrorMessage(result.error ?? "تعذر حذف الصورة")
        return
      }
      setStatusMessage("تم حذف الصورة")
      router.refresh()
    })
  }

  const triggerUpload = () => {
    fileInputRef.current?.click()
  }

  const closeCropModal = () => {
    setCropFile(null)
    setCropImageId(null)
  }

  const updateCrop = (nextCrop: Crop) => setCrop(nextCrop)

  const categoryOptions = useMemo<CategoryOption[]>(() => {
    const roots = categories.filter((cat) => !cat.parent_id)
    const tree: CategoryOption[] = []
    roots.forEach((root) => {
      tree.push({ label: root.name_ar, value: root.id })
      categories
        .filter((cat) => cat.parent_id === root.id)
        .forEach((child) => {
          tree.push({ label: `↳ ${child.name_ar}`, value: child.id })
        })
    })
    return tree
  }, [categories])

  return {
    products: filteredProducts, // Return filtered products to view
    selectedCategoryId,
    selectedProduct,
    selectedProductId,
    productForm,
    variantForm,
    categoryOptions,
    statusMessage,
    errorMessage,
    cropFile,
    crop,
    imageRef,
    fileInputRef,
    isPending,
    showAddCategoryModal,
    isCreatingNewProduct,
    selectCategory,
    clearCategorySelection,
    startNewProduct,
    selectProduct,
    submitProduct,
    deleteProduct,
    updateProductFormField,
    updateVariantField,
    submitVariant,
    editVariant,
    deleteVariant,
    triggerUpload,
    handleFileChange,
    handleSetPrimaryImage,
    handleDeleteImage,
    closeCropModal,
    confirmCrop,
    updateCrop,
    openAddCategoryModal: () => setShowAddCategoryModal(true),
    closeAddCategoryModal: () => setShowAddCategoryModal(false),
    pendingImages,
    handleDeletePendingImage,
    openCropModal,
  }
}
