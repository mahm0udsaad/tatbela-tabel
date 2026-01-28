"use client"

import type React from "react"

import { useState } from "react"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

const recipeDetails = [
  {
    id: 1,
    title: "دجاج مشوي بالشاورما",
    description: "دجاج لذيذ ومشوي بطريقة تقليدية مصرية",
    ingredients: [
      { name: "صدور دجاج", amount: "800 غرام" },
      { name: "خلطة الشاورما", amount: "ملعقتان كبيرتان" },
      { name: "زيت زيتون", amount: "3 ملاعق كبيرة" },
      { name: "عصير ليمون", amount: "2 حبة" },
      { name: "ثوم مفروم", amount: "4 فصوص" },
    ],
    steps: [
      "نظف الدجاج وقطعه إلى قطع متوسطة",
      "امزج خلطة الشاورما مع الزيت والليمون والثوم",
      "ضع الدجاج في الخليط لمدة ساعة على الأقل",
      "اشوِ الدجاج على درجة حرارة عالية لمدة 20 دقيقة",
      "قدم الدجاج ساخناً مع خبز عربي",
    ],
    cookTime: "30 دقيقة",
    servings: "4 أشخاص",
    image: "/grilled-chicken-shawarma.jpg",
  },
]

export default function RecipesPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    recipe: "",
    packaging: "cup",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Form submitted:", formData)
    alert("شكراً لتواصلك معنا! سنرد عليك قريباً.")
    setFormData({ name: "", email: "", phone: "", recipe: "", packaging: "cup" })
  }

  return (
    <main className="min-h-screen">

      {/* Recipe Details Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="mb-12">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-[#E8A835] font-semibold mb-6 hover:gap-3 transition-all"
            >
              <ArrowRight size={20} className="rotate-180" />
              العودة للرئيسية
            </Link>
          </div>

          {recipeDetails.map((recipe) => (
            <div key={recipe.id} className="bg-white/80 backdrop-blur-sm rounded-xl overflow-hidden shadow-lg">
              <img src={recipe.image || "/placeholder.svg"} alt={recipe.title} className="w-full h-96 object-cover" />

              <div className="p-8">
                <h1 className="text-4xl font-bold text-[#2B2520] mb-4">{recipe.title}</h1>
                <p className="text-lg text-[#8B6F47] mb-6">{recipe.description}</p>

                <div className="grid md:grid-cols-3 gap-6 mb-8 p-6 rounded-lg">
                  <div>
                    <p className="text-sm text-[#8B6F47]">وقت الطهي</p>
                    <p className="text-2xl font-bold text-[#C41E3A]">{recipe.cookTime}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#8B6F47]">عدد الأشخاص</p>
                    <p className="text-2xl font-bold text-[#C41E3A]">{recipe.servings}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#8B6F47]">المستوى</p>
                    <p className="text-2xl font-bold text-[#C41E3A]">سهل جداً</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8 mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-[#2B2520] mb-4">المكونات</h2>
                    <ul className="space-y-3">
                      {recipe.ingredients.map((ingredient, idx) => (
                        <li key={idx} className="flex justify-between text-[#8B6F47]">
                          <span>{ingredient.name}</span>
                          <span className="font-semibold text-[#C41E3A]">{ingredient.amount}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h2 className="text-2xl font-bold text-[#2B2520] mb-4">خطوات التحضير</h2>
                    <ol className="space-y-3">
                      {recipe.steps.map((step, idx) => (
                        <li key={idx} className="flex gap-3">
                          <span className="flex-shrink-0 w-6 h-6 bg-[#E8A835] text-white rounded-full flex items-center justify-center text-sm font-bold">
                            {idx + 1}
                          </span>
                          <span className="text-[#8B6F47]">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#2B2520] mb-4">تواصل معنا</h2>
            <p className="text-lg text-[#8B6F47]">شارك رأيك أو اطلب استشارة طهي حول منتجاتنا</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-[#F5F1E8] p-8 rounded-xl border border-[#E8A835]/20">
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-[#2B2520] font-semibold mb-2">الاسم</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="أدخل اسمك"
                  className="w-full px-4 py-2 border border-[#E8A835]/30 rounded-lg focus:outline-none focus:border-[#E8A835]"
                  required
                />
              </div>
              <div>
                <label className="block text-[#2B2520] font-semibold mb-2">البريد الإلكتروني</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="بريدك الإلكتروني"
                  className="w-full px-4 py-2 border border-[#E8A835]/30 rounded-lg focus:outline-none focus:border-[#E8A835]"
                  required
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-[#2B2520] font-semibold mb-2">رقم الهاتف</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="رقم هاتفك"
                className="w-full px-4 py-2 border border-[#E8A835]/30 rounded-lg focus:outline-none focus:border-[#E8A835]"
              />
            </div>

            <div className="mb-6">
              <label className="block text-[#2B2520] font-semibold mb-2">الرسالة أو الوصفة</label>
              <textarea
                name="recipe"
                value={formData.recipe}
                onChange={handleChange}
                placeholder="شارك معنا وصفتك أو استفسارك..."
                rows={5}
                className="w-full px-4 py-2 border border-[#E8A835]/30 rounded-lg focus:outline-none focus:border-[#E8A835] resize-none"
              />
            </div>

            <div className="mb-8">
              <label className="block text-[#2B2520] font-semibold mb-4">اختر حجم التغليف المفضل</label>
              <div className="grid md:grid-cols-3 gap-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="packaging"
                    value="cup"
                    checked={formData.packaging === "cup"}
                    onChange={handleChange}
                    className="w-4 h-4 text-[#E8A835]"
                  />
                  <span className="mr-3 text-[#2B2520]">
                    <div className="text-4xl mb-2">🥤</div>
                    <div className="font-semibold">كوب</div>
                    <div className="text-xs text-[#8B6F47]">100 غرام</div>
                  </span>
                </label>

                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="packaging"
                    value="box"
                    checked={formData.packaging === "box"}
                    onChange={handleChange}
                    className="w-4 h-4 text-[#E8A835]"
                  />
                  <span className="mr-3 text-[#2B2520]">
                    <div className="text-4xl mb-2">📦</div>
                    <div className="font-semibold">علبة</div>
                    <div className="text-xs text-[#8B6F47]">250 غرام</div>
                  </span>
                </label>

                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="packaging"
                    value="bag"
                    checked={formData.packaging === "bag"}
                    onChange={handleChange}
                    className="w-4 h-4 text-[#E8A835]"
                  />
                  <span className="mr-3 text-[#2B2520]">
                    <div className="text-4xl mb-2">🛍️</div>
                    <div className="font-semibold">كيس</div>
                    <div className="text-xs text-[#8B6F47]">500 غرام</div>
                  </span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#E8A835] text-white font-bold rounded-lg hover:bg-[#D9941E] transition-colors"
            >
              إرسال الرسالة
            </button>

            <div className="mt-6 p-4 bg-white rounded-lg border border-[#E8A835]/30">
              <p className="text-sm text-[#8B6F47]">
                يمكنك أيضاً التواصل معنا عبر Google و Facebook أو الاتصال المباشر. نحن هنا لمساعدتك في كل خطة والإجابة عن
                جميع استفساراتك.
              </p>
            </div>
          </form>
        </div>
      </section>
    </main>
  )
}
