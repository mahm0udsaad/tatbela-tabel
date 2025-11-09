"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase"
import { AdminSidebar } from "../sidebar"
import { Plus, Edit2, Trash2, Upload } from "lucide-react"
import ReactCrop, { type Crop } from "react-image-crop"
import "react-image-crop/dist/ReactCrop.css"

interface Product {
  id: string
  name_ar: string
  description_ar: string
  brand: string
  price: number
  original_price: number
  image_url: string
}

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [formData, setFormData] = useState({
    name_ar: "",
    description_ar: "",
    brand: "تتبيلة",
    price: 0,
    original_price: 0,
  })
  const [cropImage, setCropImage] = useState<string | null>(null)
  const [crop, setCrop] = useState<Crop>({
    unit: "%",
    width: 30,
    height: 30,
    x: 35,
    y: 35,
  })
  const [uploadedImage, setUploadedImage] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const router = useRouter()
  const supabase = getSupabaseClient()

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase.from("products").select("*")
      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error("خطأ في جلب المنتجات:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setCropImage(event.target?.result as string)
        setUploadedImage(file)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCropComplete = async () => {
    if (!imgRef.current || !uploadedImage || !crop.width || !crop.height) return

    const image = imgRef.current
    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")!

    canvas.width = crop.width * scaleX
    canvas.height = crop.height * scaleY

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width * scaleX,
      crop.height * scaleY,
    )

    canvas.toBlob(async (blob) => {
      if (!blob) return

      try {
        const fileName = `products/${Date.now()}-${uploadedImage.name}`
        const { error: uploadError } = await supabase.storage.from("product-images").upload(fileName, blob)

        if (uploadError) throw uploadError

        const { data } = supabase.storage.from("product-images").getPublicUrl(fileName)

        if (editingProduct) {
          const { error } = await supabase
            .from("products")
            .update({ ...formData, image_url: data.publicUrl })
            .eq("id", editingProduct.id)
          if (error) throw error
        } else {
          const { error } = await supabase.from("products").insert({ ...formData, image_url: data.publicUrl })
          if (error) throw error
        }

        setCropImage(null)
        setUploadedImage(null)
        setShowForm(false)
        resetForm()
        fetchProducts()
      } catch (error) {
        console.error("خطأ في رفع الصورة:", error)
      }
    })
  }

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا المنتج؟")) return

    try {
      const { error } = await supabase.from("products").delete().eq("id", id)
      if (error) throw error
      fetchProducts()
    } catch (error) {
      console.error("خطأ في حذف المنتج:", error)
    }
  }

  const handleSaveProduct = async () => {
    try {
      if (editingProduct) {
        const { error } = await supabase.from("products").update(formData).eq("id", editingProduct.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from("products").insert(formData)
        if (error) throw error
      }
      setShowForm(false)
      resetForm()
      fetchProducts()
    } catch (error) {
      console.error("خطأ في حفظ المنتج:", error)
    }
  }

  const resetForm = () => {
    setFormData({ name_ar: "", description_ar: "", brand: "تتبيلة", price: 0, original_price: 0 })
    setEditingProduct(null)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  return (
    <div className="flex">
      <AdminSidebar onLogout={handleLogout} />
      <main className="flex-1 bg-[#F5F1E8] p-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-[#2B2520]">إدارة المنتجات</h1>
          <button
            onClick={() => {
              resetForm()
              setShowForm(true)
            }}
            className="flex items-center gap-2 px-6 py-3 bg-[#E8A835] text-white rounded-lg font-bold hover:bg-[#D9941E]"
          >
            <Plus size={20} />
            إضافة منتج جديد
          </button>
        </div>

        {/* Product Form */}
        {showForm && (
          <div className="mb-8 p-6 bg-white rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold text-[#2B2520] mb-6">
              {editingProduct ? "تعديل المنتج" : "إضافة منتج جديد"}
            </h2>

            <div className="space-y-6">
              {!cropImage ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[#E8A835] rounded-lg p-8 text-center cursor-pointer hover:bg-[#F9F7F3]"
                >
                  <Upload size={32} className="mx-auto text-[#E8A835] mb-2" />
                  <p className="text-[#2B2520] font-semibold">اسحب الصورة هنا أو انقر للاختيار</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <ReactCrop crop={crop} onChange={(c) => setCrop(c)} aspect={1} className="w-full">
                    <img ref={imgRef} src={cropImage || "/placeholder.svg"} alt="قص الصورة" className="max-w-full" />
                  </ReactCrop>
                  <div className="flex gap-4">
                    <button
                      onClick={handleCropComplete}
                      className="flex-1 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600"
                    >
                      تحديد الصورة
                    </button>
                    <button
                      onClick={() => {
                        setCropImage(null)
                        setUploadedImage(null)
                      }}
                      className="flex-1 py-2 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#2B2520] mb-2">اسم المنتج</label>
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
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full px-4 py-2 border border-[#D9D4C8] rounded-lg focus:outline-none focus:border-[#E8A835]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#2B2520] mb-2">الوصف</label>
                <textarea
                  value={formData.description_ar}
                  onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
                  className="w-full px-4 py-2 border border-[#D9D4C8] rounded-lg h-24 focus:outline-none focus:border-[#E8A835]"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#2B2520] mb-2">السعر</label>
                  <input
                    type="number"
                    step="0.01"
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
                    step="0.01"
                    value={formData.original_price}
                    onChange={(e) => setFormData({ ...formData, original_price: Number.parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border border-[#D9D4C8] rounded-lg focus:outline-none focus:border-[#E8A835]"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-3 bg-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-400"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSaveProduct}
                  className="flex-1 py-3 bg-[#E8A835] text-white rounded-lg font-bold hover:bg-[#D9941E]"
                >
                  حفظ المنتج
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <p className="text-[#8B6F47]">جاري التحميل...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition"
              >
                <img
                  src={product.image_url || "/placeholder.svg?height=200&width=200"}
                  alt={product.name_ar}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h3 className="text-lg font-bold text-[#2B2520]">{product.name_ar}</h3>
                  <p className="text-[#8B6F47] text-sm mb-3">{product.description_ar}</p>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[#C41E3A] font-bold">{product.price} ج.م</span>
                    <span className="text-sm text-[#8B6F47] line-through">{product.original_price} ج.م</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingProduct(product)
                        setFormData({
                          name_ar: product.name_ar,
                          description_ar: product.description_ar,
                          brand: product.brand,
                          price: product.price,
                          original_price: product.original_price,
                        })
                        setShowForm(true)
                      }}
                      className="flex-1 p-2 text-blue-600 hover:bg-blue-50 rounded flex items-center justify-center gap-2"
                    >
                      <Edit2 size={16} />
                      تعديل
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      className="flex-1 p-2 text-red-600 hover:bg-red-50 rounded flex items-center justify-center gap-2"
                    >
                      <Trash2 size={16} />
                      حذف
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
