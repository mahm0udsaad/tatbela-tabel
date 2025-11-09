"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase"
import { Plus, Edit2, Trash2, Upload, BarChart3, ShoppingBag, Users, TrendingUp } from "lucide-react"
import ReactCrop, { type Crop } from "react-image-crop"
import "react-image-crop/dist/ReactCrop.css"
import { AdminSidebar } from "../sidebar"

interface Product {
  id: string
  name_ar: string
  description_ar: string
  brand: string
  category: string
  price: number
  original_price: number
  image_url: string
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
  const [showProductForm, setShowProductForm] = useState(false)
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [formData, setFormData] = useState({
    name_ar: "",
    description_ar: "",
    brand: "تتبيلة",
    category: "",
    price: 0,
    original_price: 0,
  })
  const [categoryData, setCategoryData] = useState({
    name_ar: "",
    slug: "",
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
    fetchData()
    fetchStats()
  }, [])

  const fetchData = async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        supabase.from("products").select("*"),
        supabase.from("categories").select("*"),
      ])

      setProducts(productsRes.data || [])
      setCategories(categoriesRes.data || [])
    } catch (error) {
      console.error("خطأ في جلب البيانات:", error)
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

      const totalRevenue = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0)
      const pendingOrders = orders.filter((order) => order.status === "pending").length

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
    const ctx = document.createElement("canvas").getContext("2d")!

    const canvas = document.createElement("canvas")
    const pixelRatio = window.devicePixelRatio || 1

    canvas.width = crop.width * pixelRatio * scaleX
    canvas.height = crop.height * pixelRatio * scaleY

    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
    ctx.imageSmoothingQuality = "high"

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
          // Update existing product
          const { error: updateError } = await supabase
            .from("products")
            .update({
              ...formData,
              image_url: data.publicUrl,
            })
            .eq("id", editingProduct.id)

          if (updateError) throw updateError
        } else {
          // Create new product
          const { error: insertError } = await supabase.from("products").insert({
            ...formData,
            image_url: data.publicUrl,
          })

          if (insertError) throw insertError
        }

        setCropImage(null)
        setUploadedImage(null)
        setShowProductForm(false)
        resetForm()
        fetchData()
      } catch (error) {
        console.error("خطأ في رفع الصورة:", error)
      }
    })
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
      fetchData()
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

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  const resetForm = () => {
    setFormData({
      name_ar: "",
      description_ar: "",
      brand: "تتبيلة",
      category: "",
      price: 0,
      original_price: 0,
    })
    setEditingProduct(null)
  }

  const handleSaveProduct = async () => {
    try {
      if (editingProduct) {
        // Update existing product
        const { error: updateError } = await supabase.from("products").update(formData).eq("id", editingProduct.id)

        if (updateError) throw updateError
      } else {
        // Create new product
        const { error: insertError } = await supabase.from("products").insert(formData)

        if (insertError) throw insertError
      }

      setShowProductForm(false)
      resetForm()
      fetchData()
    } catch (error) {
      console.error("خطأ في حفظ المنتج:", error)
    }
  }

  return (
    <div className="flex">
      <AdminSidebar onLogout={handleLogout} />
      <main className="flex-1 bg-[#F5F1E8] p-8">
        <h1 className="text-3xl font-bold text-[#2B2520] mb-8">ملخص لوحة التحكم</h1>

        {loading ? (
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
            <button
              onClick={() => {
                resetForm()
                setShowProductForm(true)
              }}
              className="flex items-center gap-2 px-6 py-3 bg-[#E8A835] text-white rounded-lg font-bold hover:bg-[#D9941E] transition-colors"
            >
              <Plus size={20} />
              إضافة منتج جديد
            </button>
          </div>

          {/* Product Form */}
          {showProductForm && (
            <div className="mb-8 p-6 bg-[#F5F1E8] rounded-lg border border-[#D9D4C8]">
              <h3 className="text-xl font-bold text-[#2B2520] mb-6">
                {editingProduct ? "تعديل المنتج" : "إضافة منتج جديد"}
              </h3>

              <div className="space-y-6">
                {/* Image Upload and Cropping */}
                <div>
                  <label className="block text-sm font-semibold text-[#2B2520] mb-2">الصورة (مع القص)</label>
                  {!cropImage ? (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-[#E8A835] rounded-lg p-8 text-center cursor-pointer hover:bg-[#F9F7F3] transition-colors"
                    >
                      <Upload size={32} className="mx-auto text-[#E8A835] mb-2" />
                      <p className="text-[#2B2520] font-semibold">اسحب الصورة هنا أو انقر للاختيار</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-white p-4 rounded-lg">
                        <ReactCrop crop={crop} onChange={(c) => setCrop(c)} aspect={1} className="w-full">
                          <img
                            ref={imgRef}
                            src={cropImage || "/placeholder.svg"}
                            alt="قص الصورة"
                            className="max-w-full h-auto"
                          />
                        </ReactCrop>
                      </div>
                      <div className="flex gap-4">
                        <button
                          onClick={handleCropComplete}
                          className="flex-1 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600"
                        >
                          تحديد وحفظ الصورة
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
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
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
                    onClick={() => setShowProductForm(false)}
                    className="flex-1 py-3 bg-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-400 transition-colors"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={handleSaveProduct}
                    className="flex-1 py-3 bg-[#E8A835] text-white rounded-lg font-bold hover:bg-[#D9941E] transition-colors"
                  >
                    حفظ المنتج
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Products Table */}
          <div className="overflow-x-auto">
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
                            description_ar: product.description_ar,
                            brand: product.brand,
                            category: product.category,
                            price: product.price,
                            original_price: product.original_price,
                          })
                          setShowProductForm(true)
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
