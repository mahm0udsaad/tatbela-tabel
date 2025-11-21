"use client"

import { useEffect, useMemo, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import ReactCrop, { type Crop } from "react-image-crop"
import "react-image-crop/dist/ReactCrop.css"
import { Plus, Edit2, Trash2, UploadCloud, Check, AlertTriangle, Loader2, Layers, Edit } from "lucide-react"
import {
  upsertProductAction,
  deleteProductAction,
  upsertVariantAction,
  deleteVariantAction,
  uploadProductImageAction,
  setPrimaryImageAction,
  deleteProductImageAction,
} from "./actions"
import { useToast } from "@/hooks/use-toast"

type ProductImage = {
  id: string
  image_url: string
  is_primary: boolean
  sort_order?: number | null
}

type ProductVariant = {
  id: string
  sku: string | null
  weight: number | null
  size: string | null
  variant_type: string | null
  price: number | null
  stock: number
}

type Product = {
  id: string
  name_ar: string
  description_ar: string | null
  brand: string
  category: string
  type: string
  price: number
  original_price: number | null
  stock: number
  category_id: string | null
  product_images: ProductImage[] | null
  product_variants: ProductVariant[] | null
}

type Category = {
  id: string
  name_ar: string
  parent_id: string | null
}

type ProductFormState = {
  id?: string
  name_ar: string
  description_ar: string
  brand: string
  type: string
  price: string
  original_price: string
  stock: string
  category_id: string
}

type VariantFormState = {
  id?: string
  sku: string
  weight: string
  size: string
  variant_type: string
  price: string
  stock: string
}

const emptyProductForm: ProductFormState = {
  name_ar: "",
  description_ar: "",
  brand: "تتبيلة",
  type: "",
  price: "",
  original_price: "",
  stock: "",
  category_id: "",
}

const emptyVariantForm: VariantFormState = {
  sku: "",
  weight: "",
  size: "",
  variant_type: "",
  price: "",
  stock: "",
}

function formatCurrency(value: number | null) {
  if (value === null || Number.isNaN(value)) return "-"
  return `${value.toFixed(2)} ج.م`
}

export function ProductManager({
  initialProducts,
  categories,
}: {
  initialProducts: Product[]
  categories: Category[]
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [products, setProducts] = useState<Product[]>(initialProducts ?? [])
  const [selectedProductId, setSelectedProductId] = useState<string | null>(initialProducts[0]?.id ?? null)
  const [productForm, setProductForm] = useState<ProductFormState>(initialProducts[0] ? mapProductToForm(initialProducts[0]) : emptyProductForm)
  const [variantForm, setVariantForm] = useState<VariantFormState>(emptyVariantForm)
  const [variantProductId, setVariantProductId] = useState<string | null>(initialProducts[0]?.id ?? null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [cropFile, setCropFile] = useState<{ file: File; src: string } | null>(null)
  const [crop, setCrop] = useState<Crop>({
    unit: "%",
    width: 60,
    height: 60,
    x: 20,
    y: 20,
  })
  const imageRef = useRef<HTMLImageElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isCreatingNewProduct, setIsCreatingNewProduct] = useState(initialProducts.length === 0)

  const selectedProduct = useMemo(() => products.find((product) => product.id === selectedProductId) ?? null, [products, selectedProductId])

  useEffect(() => {
    setProducts(initialProducts ?? [])

    if (initialProducts.length === 0) {
      setSelectedProductId(null)
      setProductForm(emptyProductForm)
      setIsCreatingNewProduct(true)
      return
    }

    setSelectedProductId((prev) => {
      if (prev && initialProducts.some((product) => product.id === prev)) {
        return prev
      }

      if (isCreatingNewProduct) {
        return null
      }

      return initialProducts[0].id
    })
  }, [initialProducts, isCreatingNewProduct])

  useEffect(() => {
    if (selectedProduct) {
      setIsCreatingNewProduct(false)
      setProductForm(mapProductToForm(selectedProduct))
      setVariantProductId(selectedProduct.id)
      setVariantForm(emptyVariantForm)
    }
  }, [selectedProduct])

  function mapProductToForm(product: Product): ProductFormState {
    return {
      id: product.id,
      name_ar: product.name_ar ?? "",
      description_ar: product.description_ar ?? "",
      brand: product.brand ?? "",
      type: product.type ?? "",
      price: product.price?.toString() ?? "",
      original_price: product.original_price?.toString() ?? "",
      stock: product.stock?.toString() ?? "",
      category_id: product.category_id ?? "",
    }
  }

  const handleProductSubmit = () => {
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

    const payload = {
      id: productForm.id,
      name_ar: productForm.name_ar.trim(),
      description_ar: productForm.description_ar.trim() || null,
      brand: productForm.brand.trim(),
      type: productForm.type.trim(),
      price: Number(productForm.price) || 0,
      original_price: productForm.original_price ? Number(productForm.original_price) : null,
      stock: Number(productForm.stock) || 0,
      category: selectedCategoryName,
      category_id: productForm.category_id || null,
    }

    startTransition(async () => {
      setStatusMessage(null)
      setErrorMessage(null)
      const result = await upsertProductAction(payload)
      if (!result.success) {
        const message = result.error ?? "تعذر حفظ المنتج"
        setErrorMessage(message)
        toast({
          title: "خطأ في الحفظ",
          description: message,
          variant: "destructive",
        })
        return
      }
      setIsCreatingNewProduct(false)
      if (result.productId) {
        setSelectedProductId(result.productId)
        setVariantProductId(result.productId)
      }
      setStatusMessage("تم حفظ المنتج بنجاح")
      toast({
        title: "تم حفظ المنتج",
        description: "تم تحديث بيانات المنتج بنجاح",
      })
      router.refresh()
    })
  }

  const handleDeleteProduct = (productId: string) => {
    if (!confirm("هل ترغب في حذف هذا المنتج؟")) return
    startTransition(async () => {
      const result = await deleteProductAction(productId)
      if (!result.success) {
        setErrorMessage(result.error ?? "تعذر حذف المنتج")
        return
      }
      setStatusMessage("تم حذف المنتج")
      if (selectedProductId === productId) {
        setSelectedProductId(null)
        setProductForm(emptyProductForm)
      }
      router.refresh()
    })
  }

  const handleVariantSubmit = () => {
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

  const handleDeleteVariant = (variantId: string) => {
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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setCropFile({
        file,
        src: reader.result as string,
      })
    }
    reader.readAsDataURL(file)
  }

  const handleCropConfirm = () => {
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
      formData.append("isPrimary", selectedProduct.product_images?.some((img) => img.is_primary) ? "false" : "true")
      formData.append("file", croppedFile)

      startTransition(async () => {
        const result = await uploadProductImageAction(formData)
        if (!result.success) {
          setErrorMessage(result.error ?? "تعذر رفع الصورة")
          return
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

  const categoryOptions = useMemo(() => {
    const roots = categories.filter((cat) => !cat.parent_id)
    const tree: { label: string; value: string }[] = []
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

  const productTypeOptions = useMemo(() => {
    const types = new Set<string>()
    products.forEach((product) => {
      if (product.type) {
        types.add(product.type)
      }
    })
    return Array.from(types)
  }, [products])

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#2B2520]">إدارة المنتجات</h1>
          <p className="text-[#8B6F47]">تحكم كامل بالمنتجات، المتغيرات، ومستوى المخزون</p>
        </div>
        <div className="flex gap-3">
          <button
            className="px-4 py-2 rounded-lg border border-[#E8A835] text-[#E8A835] font-semibold hover:bg-white flex items-center gap-2"
            onClick={() => {
              setIsCreatingNewProduct(true)
              setSelectedProductId(null)
              setProductForm(emptyProductForm)
              setVariantForm(emptyVariantForm)
              setVariantProductId(null)
            }}
          >
            <Plus size={16} />
            منتج جديد
          </button>
          <button
            className="px-5 py-2 rounded-lg bg-[#E8A835] text-white font-bold hover:bg-[#D9941E]"
            onClick={handleProductSubmit}
            disabled={isPending}
          >
            {isPending ? <Loader2 className="animate-spin" size={18} /> : "حفظ التغييرات"}
          </button>
        </div>
      </header>

      {(statusMessage || errorMessage) && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm font-semibold flex items-center gap-2 ${
            errorMessage ? "border-red-200 bg-red-50 text-red-700" : "border-green-200 bg-green-50 text-green-700"
          }`}
        >
          {errorMessage ? <AlertTriangle size={18} /> : <Check size={18} />}
          {errorMessage ?? statusMessage}
        </div>
      )}

      <section className="grid lg:grid-cols-5 gap-6">
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
                      <img src={thumbnail.image_url} alt={product.name_ar} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">🌶️</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-[#2B2520]">{product.name_ar}</h3>
                      <button
                        className="text-sm text-[#E8A835] underline"
                        onClick={() => {
                          setIsCreatingNewProduct(false)
                          setSelectedProductId(product.id)
                          setProductForm(mapProductToForm(product))
                        }}
                      >
                        <Edit size={16} />
                      </button>
                    </div>
                    <p className="text-xs text-[#8B6F47] mb-2">{product.brand}</p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-bold text-[#C41E3A]">{formatCurrency(product.price)}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs ${
                          product.stock > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                        }`}
                      >
                        {product.stock > 0 ? `متوفر (${product.stock})` : "غير متوفر"}
                      </span>
                    </div>
                  </div>
                  <button className="text-red-500 hover:text-red-700" onClick={() => handleDeleteProduct(product.id)}>
                    <Trash2 size={18} />
                  </button>
                </div>
              )
            })
          )}
        </div>

        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-2xl shadow p-6 space-y-4">
            <h2 className="text-xl font-bold text-[#2B2520] flex items-center gap-2">
              <Edit2 size={18} /> بيانات المنتج
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-[#2B2520] mb-2">اسم المنتج</label>
                <input
                  type="text"
                  value={productForm.name_ar}
                  onChange={(e) => setProductForm((prev) => ({ ...prev, name_ar: e.target.value }))}
                  className="w-full rounded-lg border border-[#D9D4C8] px-4 py-2 focus:border-[#E8A835] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#2B2520] mb-2">العلامة التجارية</label>
                <input
                  type="text"
                  value={productForm.brand}
                  onChange={(e) => setProductForm((prev) => ({ ...prev, brand: e.target.value }))}
                  className="w-full rounded-lg border border-[#D9D4C8] px-4 py-2 focus:border-[#E8A835] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#2B2520] mb-2">نوع المنتج</label>
                <input
                  type="text"
                  list="product-type-options"
                  value={productForm.type}
                  onChange={(e) => setProductForm((prev) => ({ ...prev, type: e.target.value }))}
                  className="w-full rounded-lg border border-[#D9D4C8] px-4 py-2 focus:border-[#E8A835] focus:outline-none"
                />
                <datalist id="product-type-options">
                  {productTypeOptions.map((typeOption) => (
                    <option key={typeOption} value={typeOption} />
                  ))}
                </datalist>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#2B2520] mb-2">الوصف</label>
              <textarea
                value={productForm.description_ar}
                onChange={(e) => setProductForm((prev) => ({ ...prev, description_ar: e.target.value }))}
                className="w-full rounded-lg border border-[#D9D4C8] px-4 py-2 h-28 focus:border-[#E8A835] focus:outline-none"
              />
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-[#2B2520] mb-2">السعر بعد الخصم</label>
                <input
                  type="number"
                  value={productForm.price}
                  onChange={(e) => setProductForm((prev) => ({ ...prev, price: e.target.value }))}
                  className="w-full rounded-lg border border-[#D9D4C8] px-4 py-2 focus:border-[#E8A835]"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#2B2520] mb-2">السعر قبل الخصم</label>
                <input
                  type="number"
                  value={productForm.original_price}
                  onChange={(e) => setProductForm((prev) => ({ ...prev, original_price: e.target.value }))}
                  className="w-full rounded-lg border border-[#D9D4C8] px-4 py-2 focus:border-[#E8A835]"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#2B2520] mb-2">المخزون</label>
                <input
                  type="number"
                  value={productForm.stock}
                  onChange={(e) => setProductForm((prev) => ({ ...prev, stock: e.target.value }))}
                  className="w-full rounded-lg border border-[#D9D4C8] px-4 py-2 focus:border-[#E8A835]"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#2B2520] mb-2">الفئة</label>
              <select
                value={productForm.category_id}
                onChange={(e) => setProductForm((prev) => ({ ...prev, category_id: e.target.value }))}
                className="w-full rounded-lg border border-[#D9D4C8] px-4 py-2 focus:border-[#E8A835]"
              >
                <option value="">اختر الفئة</option>
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

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
                      <button
                        className="px-3 py-1 rounded-lg border border-[#E8A835] text-[#E8A835]"
                        onClick={() => {
                          setVariantProductId(selectedProduct.id)
                          setVariantForm({
                            id: variant.id,
                            sku: variant.sku ?? "",
                            weight: variant.weight?.toString() ?? "",
                            size: variant.size ?? "",
                            variant_type: variant.variant_type ?? "",
                            price: variant.price?.toString() ?? "",
                            stock: variant.stock?.toString() ?? "",
                          })
                        }}
                      >
                        تعديل
                      </button>
                      <button className="px-3 py-1 rounded-lg border border-red-200 text-red-600" onClick={() => handleDeleteVariant(variant.id)}>
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
                onChange={(e) => setVariantForm((prev) => ({ ...prev, sku: e.target.value }))}
                className="rounded-lg border border-[#D9D4C8] px-3 py-2"
              />
              <input
                placeholder="الوزن (جرام)"
                type="number"
                value={variantForm.weight}
                onChange={(e) => setVariantForm((prev) => ({ ...prev, weight: e.target.value }))}
                className="rounded-lg border border-[#D9D4C8] px-3 py-2"
              />
              <input
                placeholder="الحجم"
                value={variantForm.size}
                onChange={(e) => setVariantForm((prev) => ({ ...prev, size: e.target.value }))}
                className="rounded-lg border border-[#D9D4C8] px-3 py-2"
              />
              <input
                placeholder="النوع"
                value={variantForm.variant_type}
                onChange={(e) => setVariantForm((prev) => ({ ...prev, variant_type: e.target.value }))}
                className="rounded-lg border border-[#D9D4C8] px-3 py-2"
              />
              <input
                placeholder="سعر خاص"
                type="number"
                value={variantForm.price}
                onChange={(e) => setVariantForm((prev) => ({ ...prev, price: e.target.value }))}
                className="rounded-lg border border-[#D9D4C8] px-3 py-2"
              />
              <input
                placeholder="المخزون"
                type="number"
                value={variantForm.stock}
                onChange={(e) => setVariantForm((prev) => ({ ...prev, stock: e.target.value }))}
                className="rounded-lg border border-[#D9D4C8] px-3 py-2"
              />
            </div>
            <div className="flex justify-end">
              <button
                className="px-4 py-2 rounded-lg bg-[#2B2520] text-white font-semibold hover:bg-[#473e36]"
                onClick={handleVariantSubmit}
              >
                {variantForm.id ? "تحديث المتغير" : "إضافة متغير"}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow p-6 space-y-4">
            <h2 className="text-xl font-bold text-[#2B2520] flex items-center gap-2">
              <UploadCloud size={18} /> صور المنتج
            </h2>
            {selectedProduct ? (
              <>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                <button
                  className="w-full border-2 border-dashed border-[#E8A835] rounded-xl py-6 text-[#8B6F47] hover:bg-[#F9F7F3]"
                  onClick={() => fileInputRef.current?.click()}
                >
                  اضغط لرفع صورة جديدة (سيتم القص بعد الاختيار)
                </button>

                <div className="grid md:grid-cols-3 gap-4">
                  {selectedProduct.product_images && selectedProduct.product_images.length > 0 ? (
                    selectedProduct.product_images.map((image) => (
                      <div key={image.id} className="relative rounded-xl overflow-hidden border border-[#D9D4C8]">
                        <img src={image.image_url} alt={selectedProduct.name_ar} className="w-full h-40 object-cover" />
                        <div className="absolute top-2 left-2 flex gap-2">
                          {!image.is_primary && (
                            <button
                              className="px-2 py-1 text-xs bg-white/90 rounded-lg"
                              onClick={() => handleSetPrimaryImage(image.id)}
                            >
                              تعيين كرئيسية
                            </button>
                          )}
                          <button className="px-2 py-1 text-xs bg-red-500 text-white rounded-lg" onClick={() => handleDeleteImage(image.id)}>
                            حذف
                          </button>
                        </div>
                        {image.is_primary && (
                          <span className="absolute bottom-2 right-2 text-xs bg-[#E8A835] text-white px-2 py-1 rounded-lg">الصورة الرئيسية</span>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="col-span-3 text-center text-[#8B6F47] py-6 border border-dashed rounded-xl">لا توجد صور مرفوعة بعد</div>
                  )}
                </div>
              </>
            ) : (
              <p className="text-sm text-[#8B6F47]">احفظ المنتج أولاً لتتمكن من إضافة الصور.</p>
            )}
          </div>
        </div>
      </section>

      {cropFile && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-6 space-y-4">
            <h3 className="text-xl font-bold text-[#2B2520]">قص الصورة</h3>
            <ReactCrop crop={crop} onChange={(value) => setCrop(value)} aspect={1}>
              <img src={cropFile.src} alt="قص الصورة" ref={imageRef} className="max-h-[60vh] object-contain" />
            </ReactCrop>
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 rounded-lg border border-[#D9D4C8] text-[#8B6F47]"
                onClick={() => {
                  setCropFile(null)
                }}
              >
                إلغاء
              </button>
              <button className="px-4 py-2 rounded-lg bg-[#E8A835] text-white font-bold" onClick={handleCropConfirm}>
                حفظ الصورة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

