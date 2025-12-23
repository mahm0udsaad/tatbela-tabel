"use client"

import React, { useState, useEffect, useRef } from "react"
import { getSupabaseClient } from "@/lib/supabase"
import { Plus, Edit2, Trash2, Upload, BarChart3, ShoppingBag, Users, TrendingUp, CheckCircle, X } from "lucide-react"
import ReactCrop, { type Crop } from "react-image-crop"
import "react-image-crop/dist/ReactCrop.css"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination"

interface ProductImage {
  id: string
  image_url: string
  storage_path?: string
  is_primary: boolean
  sort_order: number
}

interface Product {
  id: string
  name_ar: string
  description_ar: string
  brand: string
  category: string
  price: number
  original_price: number
  image_url: string
  product_images?: ProductImage[]
}

interface Category {
  id: string
  name_ar: string
  slug: string
}

interface DashboardStats {
  totalOrders: number
  totalRevenue: number
  totalUsers: number
  pendingOrders: number
}

function StatCard({
  title,
  value,
  icon,
  color,
  textColor,
}: {
  title: string
  value: string | number
  icon: React.ReactNode
  color: string
  textColor: string
}) {
  return (
    <div className={`${color} rounded-xl p-6 shadow-md`}>
      <div className={`${textColor} mb-4`}>{icon}</div>
      <h3 className="text-[#8B6F47] font-semibold mb-2">{title}</h3>
      <p className="text-2xl font-bold text-[#2B2520]">{value}</p>
    </div>
  )
}

const PAGE_SIZE = 20

export default function AdminDashboard() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    totalRevenue: 0,
    totalUsers: 0,
    pendingOrders: 0,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingImages, setUploadingImages] = useState(false)
  const [showProductForm, setShowProductForm] = useState(false)
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalProducts, setTotalProducts] = useState(0)
  const [formData, setFormData] = useState({
    name_ar: "",
    description_ar: "",
    brand: "تتبيلة",
    type: "",
    category: "",
    price: 0,
    original_price: 0,
  })
  const [categoryData, setCategoryData] = useState({
    name_ar: "",
    slug: "",
  })
  
  // Multi-image state
  const [uploadedImages, setUploadedImages] = useState<Array<{
    id: string
    file?: File
    preview: string
    url?: string
    isPrimary: boolean
    storage_path?: string
  }>>([])
  
  // Track deleted images for cleanup
  const [deletedImageIds, setDeletedImageIds] = useState<string[]>([])
  
  // Cropping state
  const [showCropModal, setShowCropModal] = useState(false)
  const [currentCropImage, setCurrentCropImage] = useState<{
    id: string
    preview: string
  } | null>(null)
  const [crop, setCrop] = useState<Crop>({
    unit: "%",
    width: 50,
    height: 50,
    x: 25,
    y: 25,
  })
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const supabase = getSupabaseClient()

  useEffect(() => {
    fetchData()
    fetchStats()
  }, [currentPage])

  const fetchData = async () => {
    try {
      setLoading(true)
      const from = (currentPage - 1) * PAGE_SIZE
      const to = from + PAGE_SIZE - 1

      const [productsRes, categoriesRes] = await Promise.all([
        supabase
          .from("products")
          .select(
            `
            *,
            product_images(id, image_url, storage_path, is_primary, sort_order)
          `,
            { count: "exact" }
          )
          .order("created_at", { ascending: false })
          .range(from, to),
        supabase.from("categories").select("*"),
      ])

      setProducts(productsRes.data || [])
      setTotalProducts(productsRes.count || 0)
      setCategories(categoriesRes.data || [])
    } catch (error) {
      console.error("خطأ في جلب البيانات:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const [ordersRes, usersRes] = await Promise.all([
        supabase.from("orders").select("id, total_amount, status"),
        supabase.from("profiles").select("id"),
      ])

      const orders = ordersRes.data || []
      const users = usersRes.data || []

      const totalRevenue = orders.reduce((sum: number, order: any) => sum + (order.total_amount || 0), 0)
      const pendingOrders = orders.filter((order: any) => order.status === "pending").length

      setStats({
        totalOrders: orders.length,
        totalRevenue,
        totalUsers: users.length,
        pendingOrders,
      })
    } catch (error) {
      console.error("خطأ في جلب الإحصائيات:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    files.forEach((file) => {
      if (!file.type.startsWith("image/")) return

      const reader = new FileReader()
      reader.onload = (event) => {
        const preview = event.target?.result as string
        const newImage = {
          id: `temp-${Date.now()}-${Math.random()}`,
          file,
          preview,
          isPrimary: uploadedImages.length === 0, // First image is primary
        }
        setUploadedImages((prev) => [...prev, newImage])
      }
      reader.readAsDataURL(file)
    })

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleRemoveImage = (imageId: string) => {
    setUploadedImages((prev) => {
      const imageToRemove = prev.find((img) => img.id === imageId)
      
      // If this is an existing image (has url, not just uploaded), track it for deletion
      if (imageToRemove && imageToRemove.url && !imageToRemove.file) {
        setDeletedImageIds((prevDeleted) => [...prevDeleted, imageId])
      }
      
      const filtered = prev.filter((img) => img.id !== imageId)
      // If we removed the primary image, make the first one primary
      if (filtered.length > 0 && !filtered.some((img) => img.isPrimary)) {
        filtered[0].isPrimary = true
      }
      return filtered
    })
  }

  const handleSetPrimaryImage = (imageId: string) => {
    setUploadedImages((prev) =>
      prev.map((img) => ({
        ...img,
        isPrimary: img.id === imageId,
      }))
    )
  }

  const handleOpenCropModal = (imageId: string) => {
    const image = uploadedImages.find((img) => img.id === imageId)
    if (image) {
      setCurrentCropImage({ id: imageId, preview: image.preview })
      setShowCropModal(true)
      setCrop({
        unit: "%",
        width: 50,
        height: 50,
        x: 25,
        y: 25,
      })
    }
  }

  const handleCropComplete = async () => {
    if (!imgRef.current || !currentCropImage || !crop.width || !crop.height) {
      alert("يرجى اختيار منطقة الصورة أولاً")
      return
    }

    setUploadingImages(true)

    try {
      const image = imgRef.current
      const canvas = document.createElement("canvas")
      const scaleX = image.naturalWidth / image.width
      const scaleY = image.naturalHeight / image.height
      const ctx = canvas.getContext("2d")

      if (!ctx) {
        throw new Error("فشل في إنشاء سياق الرسم")
      }

      const pixelRatio = window.devicePixelRatio || 1

      // Calculate crop dimensions in pixels
      const cropX = crop.x * scaleX
      const cropY = crop.y * scaleY
      const cropWidth = crop.width * scaleX
      const cropHeight = crop.height * scaleY

      // Set canvas size to match cropped area
      canvas.width = cropWidth * pixelRatio
      canvas.height = cropHeight * pixelRatio

      // Scale the canvas context
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
      ctx.imageSmoothingQuality = "high"

      // Draw the cropped image
      ctx.drawImage(
        image,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        cropWidth,
        cropHeight
      )

      // Convert to blob and update preview
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            alert("فشل في معالجة الصورة")
            setUploadingImages(false)
            return
          }

          // Create a new preview URL from the cropped image
          const croppedPreview = URL.createObjectURL(blob)
          
          // Update the image in the list with cropped version
          setUploadedImages((prev) =>
            prev.map((img) =>
              img.id === currentCropImage.id
                ? { ...img, preview: croppedPreview, file: new File([blob], `cropped-${Date.now()}.jpg`, { type: "image/jpeg" }) }
                : img
            )
          )

          setShowCropModal(false)
          setCurrentCropImage(null)
          setUploadingImages(false)
        },
        "image/jpeg",
        0.95
      )
    } catch (error: any) {
      console.error("خطأ في معالجة الصورة:", error)
      alert(`خطأ في معالجة الصورة: ${error.message || "حدث خطأ غير معروف"}`)
      setUploadingImages(false)
    }
  }

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { error } = await supabase.from("categories").insert({
        ...categoryData,
        name: categoryData.name_ar,
      })

      if (error) throw error

      setCategoryData({ name_ar: "", slug: "" })
      setShowCategoryForm(false)
      fetchData()
    } catch (error) {
      console.error("خطأ في إضافة الفئة:", error)
    }
  }

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا المنتج؟")) return

    try {
      const { error } = await supabase.from("products").delete().eq("id", id)
      if (error) throw error
      
      // If we deleted the last item on the page and it's not the first page, go back
      if (products.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1)
      } else {
        fetchData()
      }
    } catch (error) {
      console.error("خطأ في حذف المنتج:", error)
    }
  }

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه الفئة؟")) return

    try {
      const { error } = await supabase.from("categories").delete().eq("id", id)
      if (error) throw error
      fetchData()
    } catch (error) {
      console.error("خطأ في حذف الفئة:", error)
    }
  }

  const resetForm = () => {
    setFormData({
      name_ar: "",
      description_ar: "",
      brand: "تتبيلة",
      type: "",
      category: "",
      price: 0,
      original_price: 0,
    })
    setEditingProduct(null)
    setUploadedImages([])
    setDeletedImageIds([])
    setShowCropModal(false)
    setCurrentCropImage(null)
  }

  const handleSaveProduct = async () => {
    const trimmedName = (formData.name_ar || "").trim()
    const trimmedDescription = (formData.description_ar || "").trim()

    // Validate required fields
    if (!trimmedName || !trimmedDescription || !formData.price) {
      alert("يرجى ملء جميع الحقول المطلوبة")
      return
    }

    if (!editingProduct && uploadedImages.length === 0) {
      alert("يرجى رفع صورة واحدة على الأقل للمنتج")
      return
    }

    setSaving(true)

    const basePrice = Number.isFinite(formData.price) ? formData.price : 0
    const normalizedFormData = {
      ...formData,
      name_ar: trimmedName,
      name: trimmedName,
      description_ar: trimmedDescription,
      price: basePrice,
      original_price:
        typeof formData.original_price === "number" &&
        Number.isFinite(formData.original_price) &&
        formData.original_price > basePrice
          ? formData.original_price
          : null,
    }

    try {
      let productId = editingProduct?.id

      // Step 1: Create or update the product
      if (editingProduct) {
        const { error: updateError } = await supabase
          .from("products")
          .update(normalizedFormData)
          .eq("id", editingProduct.id)

        if (updateError) throw updateError

        // Step 1.5: Delete removed images from storage and database
        if (deletedImageIds.length > 0) {
          try {
            // Get storage paths before deleting from database
            const { data: imagesToDelete } = await supabase
              .from("product_images")
              .select("id, storage_path")
              .in("id", deletedImageIds)

            // Delete from storage
            if (imagesToDelete && imagesToDelete.length > 0) {
              const storagePaths = imagesToDelete
                .filter((img: { id: string; storage_path: string | null }) => img.storage_path)
                .map((img: { id: string; storage_path: string | null }) => img.storage_path!)

              if (storagePaths.length > 0) {
                await supabase.storage.from("product-images").remove(storagePaths)
              }
            }

            // Delete from database
            const { error: deleteError } = await supabase
              .from("product_images")
              .delete()
              .in("id", deletedImageIds)

            if (deleteError) throw deleteError
          } catch (deleteErr) {
            console.error("Error deleting images:", deleteErr)
            // Continue anyway - don't fail the whole operation
          }
        }
      } else {
        const { data: newProduct, error: insertError } = await supabase
          .from("products")
          .insert(normalizedFormData)
          .select("id")
          .single()

        if (insertError) throw insertError
        productId = newProduct.id
      }

      // Step 2: Handle images
      if (uploadedImages.length > 0) {
        // When editing, update existing images' is_primary and sort_order
        const existingImages = uploadedImages.filter(img => !img.file && img.url)
        const newImages = uploadedImages.filter(img => img.file)

        // Update existing images
        if (editingProduct && existingImages.length > 0) {
          const updatePromises = existingImages.map(async (image, index) => {
            try {
              const { error: updateError } = await supabase
                .from("product_images")
                .update({
                  is_primary: image.isPrimary,
                  sort_order: index,
                })
                .eq("id", image.id)

              if (updateError) throw updateError
            } catch (error) {
              console.error("Error updating image:", error)
            }
          })
          await Promise.all(updatePromises)
        }

        // Upload and insert new images
        if (newImages.length > 0) {
          const imageUploadPromises = newImages.map(async (image, index) => {
            try {
              // Upload to storage
              const fileName = `products/${productId}/${Date.now()}-${Math.random()}.jpg`
              const { error: uploadError } = await supabase.storage
                .from("product-images")
                .upload(fileName, image.file!, {
                  contentType: "image/jpeg",
                  cacheControl: "3600",
                  upsert: false,
                })

              if (uploadError) throw uploadError

              // Get public URL
              const { data } = supabase.storage.from("product-images").getPublicUrl(fileName)

              // Create product_images record
              const { error: imageRecordError } = await supabase
                .from("product_images")
                .insert({
                  product_id: productId,
                  image_url: data.publicUrl,
                  storage_path: fileName,
                  is_primary: image.isPrimary,
                  sort_order: existingImages.length + index,
                })

              if (imageRecordError) throw imageRecordError

              return data.publicUrl
            } catch (error) {
              console.error("Error uploading image:", error)
              return null
            }
          })

          await Promise.all(imageUploadPromises)
        }
      }

      alert(editingProduct ? "تم تحديث المنتج بنجاح!" : "تم إضافة المنتج بنجاح!")
      setShowProductForm(false)
      resetForm()
      // Reset to first page after adding/editing
      if (!editingProduct) {
        setCurrentPage(1)
      } else {
        fetchData()
      }
    } catch (error: any) {
      console.error("خطأ في حفظ المنتج:", error)
      alert(`خطأ في حفظ المنتج: ${error.message || "حدث خطأ غير معروف"}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-[#F5F1E8] rounded-lg">
      <h1 className="text-3xl font-bold text-[#2B2520] mb-8">ملخص لوحة التحكم</h1>

        {loading && stats.totalOrders === 0 ? (
          <div className="text-center py-12">
            <p className="text-[#8B6F47]">جاري التحميل...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="إجمالي الطلبات"
              value={stats.totalOrders}
              icon={<ShoppingBag size={32} />}
              color="bg-blue-50"
              textColor="text-blue-600"
            />
            <StatCard
              title="الإيرادات الكلية"
              value={`${stats.totalRevenue.toFixed(2)} ج.م`}
              icon={<TrendingUp size={32} />}
              color="bg-green-50"
              textColor="text-green-600"
            />
            <StatCard
              title="إجمالي المستخدمين"
              value={stats.totalUsers}
              icon={<Users size={32} />}
              color="bg-purple-50"
              textColor="text-purple-600"
            />
            <StatCard
              title="الطلبات قيد الانتظار"
              value={stats.pendingOrders}
              icon={<BarChart3 size={32} />}
              color="bg-orange-50"
              textColor="text-orange-600"
            />
          </div>
        )}

        {/* Products Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 mt-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-[#2B2520]">إدارة المنتجات</h2>
          </div>

          {/* Product Form */}
          {showProductForm && (
            <div className="mb-8 p-6 bg-[#F5F1E8] rounded-lg border border-[#D9D4C8]">
              <h3 className="text-xl font-bold text-[#2B2520] mb-6">
                {editingProduct ? "تعديل المنتج" : "إضافة منتج جديد"}
              </h3>

              <div className="space-y-6">
                {/* Multi-Image Upload */}
                <div>
                  <label className="block text-sm font-semibold text-[#2B2520] mb-2">
                    صور المنتج (يمكن رفع أكثر من صورة)
                  </label>

                  {/* Image Grid */}
                  {uploadedImages.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      {uploadedImages.map((image) => (
                        <div key={image.id} className="relative group">
                          <img
                            src={image.preview}
                            alt="معاينة"
                            className={`w-full h-32 object-cover rounded-lg border-2 ${
                              image.isPrimary ? "border-green-500" : "border-gray-200"
                            }`}
                          />
                          {image.isPrimary && (
                            <span className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                              أساسية
                            </span>
                          )}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleOpenCropModal(image.id)}
                              className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                              title="قص الصورة"
                            >
                              <Edit2 size={16} />
                            </button>
                            {!image.isPrimary && (
                              <button
                                onClick={() => handleSetPrimaryImage(image.id)}
                                className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                                title="جعلها صورة أساسية"
                              >
                                <CheckCircle size={16} />
                              </button>
                            )}
                            <button
                              onClick={() => handleRemoveImage(image.id)}
                              className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                              title="حذف"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upload Area */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault()
                      const files = Array.from(e.dataTransfer.files)
                      const input = fileInputRef.current
                      if (input) {
                        const dt = new DataTransfer()
                        files.forEach((file) => dt.items.add(file))
                        input.files = dt.files
                        handleImageUpload({ target: input } as any)
                      }
                    }}
                    className="border-2 border-dashed border-[#E8A835] rounded-lg p-8 text-center cursor-pointer hover:bg-[#F9F7F3] transition-colors"
                  >
                    <Upload size={32} className="mx-auto text-[#E8A835] mb-2" />
                    <p className="text-[#2B2520] font-semibold">اسحب الصور هنا أو انقر لاختيار</p>
                    <p className="text-sm text-[#8B6F47] mt-2">يمكنك اختيار أكثر من صورة • يمكنك قص أي صورة بعد الرفع</p>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </div>

                {/* Product Details */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-[#2B2520] mb-2">اسم المنتج بالعربية</label>
                    <input
                      type="text"
                      value={formData.name_ar}
                      onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                      className="w-full px-4 py-2 border border-[#D9D4C8] rounded-lg focus:outline-none focus:border-[#E8A835]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#2B2520] mb-2">العلامة التجارية</label>
                    <select
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      className="w-full px-4 py-2 border border-[#D9D4C8] rounded-lg focus:outline-none focus:border-[#E8A835]"
                    >
                      <option value="تتبيلة">تتبيلة</option>
                      <option value="تابل">تابل</option>
                    </select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-[#2B2520] mb-2">نوع المنتج</label>
                    <input
                      type="text"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-4 py-2 border border-[#D9D4C8] rounded-lg focus:outline-none focus:border-[#E8A835]"
                      placeholder="مثال: توابل، بهارات، خلطات"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#2B2520] mb-2">الفئة</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-2 border border-[#D9D4C8] rounded-lg focus:outline-none focus:border-[#E8A835]"
                      required
                    >
                      <option value="">اختر الفئة</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.name_ar}>
                          {cat.name_ar}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#2B2520] mb-2">الوصف بالعربية</label>
                  <textarea
                    value={formData.description_ar}
                    onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
                    className="w-full px-4 py-2 border border-[#D9D4C8] rounded-lg focus:outline-none focus:border-[#E8A835] h-24"
                    required
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-[#2B2520] mb-2">السعر</label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: Number.parseFloat(e.target.value) })}
                      className="w-full px-4 py-2 border border-[#D9D4C8] rounded-lg focus:outline-none focus:border-[#E8A835]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#2B2520] mb-2">السعر الأصلي</label>
                    <input
                      type="number"
                      value={formData.original_price}
                      onChange={(e) => setFormData({ ...formData, original_price: Number.parseFloat(e.target.value) })}
                      className="w-full px-4 py-2 border border-[#D9D4C8] rounded-lg focus:outline-none focus:border-[#E8A835]"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      setShowProductForm(false)
                      resetForm()
                    }}
                    disabled={saving}
                    className="flex-1 py-3 bg-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={handleSaveProduct}
                    disabled={saving}
                    className="flex-1 py-3 bg-[#E8A835] text-white rounded-lg font-bold hover:bg-[#D9941E] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {saving ? "جاري الحفظ..." : editingProduct ? "تحديث المنتج" : "حفظ المنتج"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Crop Modal */}
          {showCropModal && currentCropImage && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-[#D9D4C8] flex items-center justify-between sticky top-0 bg-white">
                  <h3 className="text-xl font-bold text-[#2B2520]">قص الصورة</h3>
                  <button
                    onClick={() => {
                      setShowCropModal(false)
                      setCurrentCropImage(null)
                    }}
                    disabled={uploadingImages}
                    className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50"
                  >
                    <X size={24} />
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  <div className="bg-[#F5F1E8] p-4 rounded-lg">
                    <p className="text-sm text-[#8B6F47] mb-2 text-center">
                      اسحب لتحديد المنطقة المراد قصها • القص اختياري
                    </p>
                    <ReactCrop
                      crop={crop}
                      onChange={(c) => setCrop(c)}
                      aspect={1}
                      className="w-full"
                    >
                      <img
                        ref={imgRef}
                        src={currentCropImage.preview}
                        alt="قص الصورة"
                        className="max-w-full h-auto max-h-[60vh]"
                        onLoad={() => {
                          if (imgRef.current) {
                            const { width, height } = imgRef.current
                            const size = Math.min(width, height) * 0.6
                            setCrop({
                              unit: "px",
                              width: size,
                              height: size,
                              x: (width - size) / 2,
                              y: (height - size) / 2,
                            })
                          }
                        }}
                      />
                    </ReactCrop>
                  </div>
                  <div className="flex gap-4">
                    <button
                      onClick={() => {
                        setShowCropModal(false)
                        setCurrentCropImage(null)
                      }}
                      disabled={uploadingImages}
                      className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 disabled:opacity-50"
                    >
                      إلغاء
                    </button>
                    <button
                      onClick={handleCropComplete}
                      disabled={uploadingImages}
                      className="flex-1 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 disabled:bg-gray-400"
                    >
                      {uploadingImages ? "جاري المعالجة..." : "✓ تطبيق القص"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Products Table */}
          <div className="overflow-x-auto">
            {loading && products.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-[#8B6F47]">جاري التحميل...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-[#8B6F47]">لا توجد منتجات</p>
              </div>
            ) : (
              <>
                <table className="w-full">
                  <thead className="bg-[#F5F1E8] border-b border-[#D9D4C8]">
                    <tr>
                      <th className="px-6 py-3 text-right text-sm font-semibold text-[#2B2520]">الاسم</th>
                      <th className="px-6 py-3 text-right text-sm font-semibold text-[#2B2520]">العلامة</th>
                      <th className="px-6 py-3 text-right text-sm font-semibold text-[#2B2520]">السعر</th>
                      <th className="px-6 py-3 text-right text-sm font-semibold text-[#2B2520]">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product.id} className="border-b border-[#D9D4C8] hover:bg-[#F9F7F3]">
                        <td className="px-6 py-4 text-[#2B2520]">{product.name_ar}</td>
                        <td className="px-6 py-4 text-[#8B6F47]">{product.brand}</td>
                        <td className="px-6 py-4 text-[#C41E3A] font-semibold">{product.price} ج.م</td>
                        <td className="px-6 py-4 flex gap-2">
                          <button
                            onClick={() => {
                          setEditingProduct(product)
                          setFormData({
                            name_ar: product.name_ar,
                            description_ar: product.description_ar ?? "",
                            brand: product.brand,
                            type: (product as any).type || "",
                            category: product.category,
                            price: product.price,
                            original_price: product.original_price,
                          })
                              
                              // Load existing images
                              if (product.product_images && product.product_images.length > 0) {
                                const existingImages = product.product_images
                                  .sort((a, b) => a.sort_order - b.sort_order)
                                  .map((img) => ({
                                    id: img.id,
                                    preview: img.image_url,
                                    url: img.image_url,
                                    storage_path: img.storage_path,
                                    isPrimary: img.is_primary,
                                  }))
                                setUploadedImages(existingImages)
                              } else if (product.image_url) {
                                // Fallback to old single image
                                setUploadedImages([{
                                  id: "existing",
                                  preview: product.image_url,
                                  url: product.image_url,
                                  isPrimary: true,
                                }])
                              }
                              
                              // Reset deleted images tracker
                              setDeletedImageIds([])
                              
                              setShowProductForm(true)
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="تعديل المنتج"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            title="حذف المنتج"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Pagination */}
                {totalProducts > PAGE_SIZE && (
                  <div className="mt-6 flex items-center justify-between">
                    <div className="text-sm text-[#8B6F47]">
                      عرض {((currentPage - 1) * PAGE_SIZE) + 1} - {Math.min(currentPage * PAGE_SIZE, totalProducts)} من {totalProducts} منتج
                    </div>
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            href="#"
                            onClick={(e) => {
                              e.preventDefault()
                              if (currentPage > 1) {
                                setCurrentPage(currentPage - 1)
                                window.scrollTo({ top: 0, behavior: "smooth" })
                              }
                            }}
                            className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                        
                        {Array.from({ length: Math.ceil(totalProducts / PAGE_SIZE) }, (_, i) => i + 1)
                          .filter((page) => {
                            // Show first page, last page, current page, and pages around current
                            if (page === 1 || page === Math.ceil(totalProducts / PAGE_SIZE)) return true
                            if (Math.abs(page - currentPage) <= 1) return true
                            return false
                          })
                          .map((page, index, array) => {
                            // Add ellipsis if there's a gap
                            const prevPage = array[index - 1]
                            const showEllipsisBefore = prevPage && page - prevPage > 1
                            
                            return (
                              <React.Fragment key={page}>
                                {showEllipsisBefore && (
                                  <PaginationItem>
                                    <PaginationEllipsis />
                                  </PaginationItem>
                                )}
                                <PaginationItem>
                                  <PaginationLink
                                    href="#"
                                    onClick={(e) => {
                                      e.preventDefault()
                                      setCurrentPage(page)
                                      window.scrollTo({ top: 0, behavior: "smooth" })
                                    }}
                                    isActive={currentPage === page}
                                    className="cursor-pointer"
                                  >
                                    {page}
                                  </PaginationLink>
                                </PaginationItem>
                              </React.Fragment>
                            )
                          })}
                        
                        <PaginationItem>
                          <PaginationNext
                            href="#"
                            onClick={(e) => {
                              e.preventDefault()
                              if (currentPage < Math.ceil(totalProducts / PAGE_SIZE)) {
                                setCurrentPage(currentPage + 1)
                                window.scrollTo({ top: 0, behavior: "smooth" })
                              }
                            }}
                            className={currentPage >= Math.ceil(totalProducts / PAGE_SIZE) ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
    </div>
  )
}
