import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Star, ArrowRight } from "lucide-react"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { createClient as createServerClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

type HeroCarouselImage = {
  id: string
  image_url: string
  alt_text: string | null
  link_url: string | null
  sort_order: number | null
  created_at?: string
}

const fallbackHeroImages: HeroCarouselImage[] = [
  {
    id: "fallback-1",
    image_url: "/egyptian-spices-collection.jpg",
    alt_text: "مزيج من التوابل الأصلية",
    link_url: "/store",
    sort_order: 0,
  },
  {
    id: "fallback-2",
    image_url: "/tatbeelah-chicken-curry.jpg",
    alt_text: "أطباق الكاري المميزة من تتبيلة",
    link_url: "/recipes",
    sort_order: 1,
  },
  {
    id: "fallback-3",
    image_url: "/tabel-chicken-seasoning.jpg",
    alt_text: "عروض الموسم على خلطات الدجاج",
    link_url: "/store?category=offers",
    sort_order: 2,
  },
]

async function getHeroCarouselImages(): Promise<HeroCarouselImage[]> {
  try {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from("hero_carousel_images")
      .select("id, image_url, alt_text, link_url, sort_order, created_at")
      .order("sort_order", { ascending: true, nullsFirst: true })
      .order("created_at", { ascending: true })

    if (error) {
      console.error("فشل في جلب صور السلايدر", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("فشل في جلب صور السلايدر", error)
    return []
  }
}

const categories = [
  {
    id: 1,
    name: "التوابل",
    arabicName: "التوابل",
    description: "توابل طبيعية مختارة بعناية",
    icon: "🌶️",
    href: "/store?category=spices",
  },
  {
    id: 2,
    name: "الخلطات",
    arabicName: "الخلطات",
    description: "خلطات مصرية أصلية",
    icon: "🥘",
    href: "/store?category=blends",
  },
  {
    id: 3,
    name: "الصوصات",
    arabicName: "الصوصات",
    description: "صوصات لذيذة وشهية",
    icon: "🍲",
    href: "/store?category=sauces",
  },
  {
    id: 4,
    name: "العروض",
    arabicName: "العروض",
    description: "أفضل العروض والخصومات",
    icon: "🎁",
    href: "/store?category=offers",
  },
]

const featuredProducts = [
  {
    id: 1,
    name: "الكمون الكامل",
    brand: "تتبيلة",
    price: 45,
    originalPrice: 60,
    rating: 4.8,
    reviews: 234,
    image: "/cumin-seeds.jpg",
  },
  {
    id: 2,
    name: "خلطة الفول",
    brand: "تابل",
    price: 35,
    originalPrice: 50,
    rating: 4.9,
    reviews: 156,
    image: "/fava-beans-spice-blend.jpg",
  },
  {
    id: 3,
    name: "الفلفل الأحمر المطحون",
    brand: "تتبيلة",
    price: 55,
    originalPrice: 75,
    rating: 4.7,
    reviews: 189,
    image: "/paprika-powder.jpg",
  },
  {
    id: 4,
    name: "خلطة الشاورما",
    brand: "تابل",
    price: 40,
    originalPrice: 65,
    rating: 4.9,
    reviews: 278,
    image: "/shawarma-spice-blend.jpg",
  },
]

const testimonials = [
  {
    name: "فاطمة أحمد",
    location: "القاهرة",
    text: "جودة عالية جداً، الطعم رائع والتوصيل سريع جداً. شكراً تتبيلة وتابل!",
    rating: 5,
  },
  {
    name: "محمود علي",
    location: "الجيزة",
    text: "أفضل متجر للتوابل المصرية. الخلطات طازة وطعمها ممتاز جداً.",
    rating: 5,
  },
  {
    name: "سارة حسن",
    location: "الإسكندرية",
    text: "منتجات أصلية وأسعار مناسبة. سأطلب منهم دائماً.",
    rating: 5,
  },
]

const traditionalBlends = [
  {
    id: 1,
    name: "خلطة فاتيتا",
    recipe: "استخدم ملعقة صغيرة من الخليط مع الطعام",
    ingredients: "كمون، كزبرة، فلفل أسود، ملح",
    image: "/traditional-spice-blend.jpg",
  },
  {
    id: 2,
    name: "خلطة الشاورما",
    recipe: "مثالية للدجاج واللحوم المشوية",
    ingredients: "ثوم، بابريكا، كمون، أوريجانو",
    image: "/shawarma-spice-blend.jpg",
  },
  {
    id: 3,
    name: "خلطة الملوخية",
    recipe: "أضف ملعقة صغيرة قبل الطهي",
    ingredients: "ثوم، كزبرة، فلفل أسود، ملح",
    image: "/molokheya-spice-blend.jpg",
  },
  {
    id: 4,
    name: "خلطة العدس",
    recipe: "للعدس والشوربات",
    ingredients: "كمون، بصل، فلفل، كزبرة",
    image: "/lentil-spice-blend.jpg",
  },
]

const recipes = [
  {
    id: 1,
    title: "دجاج مشوي بالشاورما",
    description: "دجاج لذيذ ومشوي بطريقة تقليدية",
    prepTime: "15 دقيقة",
    cookTime: "30 دقيقة",
    image: "/grilled-chicken-shawarma.jpg",
  },
  {
    id: 2,
    title: "لحم مشوي",
    description: "لحم طري وشهي مع التتبيلات الأصلية",
    prepTime: "20 دقيقة",
    cookTime: "40 دقيقة",
    image: "/grilled-meat-arabic.jpg",
  },
  {
    id: 3,
    title: "أرز بالتوابل",
    description: "أرز فاخر مع خليط التوابل",
    prepTime: "10 دقيقة",
    cookTime: "25 دقيقة",
    image: "/spiced-rice-arabic.jpg",
  },
]

export default async function Home() {
  const heroImages = await getHeroCarouselImages()
  const heroSlides = heroImages.length > 0 ? heroImages : fallbackHeroImages
  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden bg-gradient-to-b from-[#F5F1E8] to-white">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 right-20 w-72 h-72 bg-[#E8A835]/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 left-10 w-96 h-96 bg-[#C41E3A]/5 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <Carousel className="relative" opts={{ loop: true }}>
            <CarouselContent>
              {heroSlides.map((slide) => (
                <CarouselItem key={slide.id}>
                  <div className="relative h-[360px] md:h-[520px] overflow-hidden rounded-[32px] bg-[#1f1b16]">
                    <img
                      src={slide.image_url}
                      alt={slide.alt_text ?? "صورة السلايدر"}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/30 to-black/70" />
                    <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 flex flex-col gap-4 text-white">
                      {slide.alt_text && <p className="text-2xl font-bold">{slide.alt_text}</p>}
                      {slide.link_url && (
                        <Link
                          href={slide.link_url}
                          className="inline-flex items-center gap-2 bg-white/20 backdrop-blur px-5 py-2 rounded-full text-sm font-semibold hover:bg-white/30"
                        >
                          استكشف الآن
                          <ArrowRight size={18} />
                        </Link>
                      )}
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="top-1/2 left-6 -translate-y-1/2 bg-white/80 text-[#2B2520] border border-white shadow-lg h-12 w-12" />
            <CarouselNext className="top-1/2 right-6 -translate-y-1/2 bg-white/80 text-[#2B2520] border border-white shadow-lg h-12 w-12" />
          </Carousel>
        </div>
      </section>

      {/* New Recipes/Traditional Blends Section */}
      <section className="py-20 bg-[#F5F1E8]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#2B2520] mb-4">وصفاتنا التقليدية</h2>
            <p className="text-lg text-[#8B6F47]">استكشف وصفاتنا الشهية واستخدم توابلنا الأصلية</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {recipes.map((recipe) => (
              <div
                key={recipe.id}
                className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all"
              >
                <div className="relative overflow-hidden bg-gray-100 h-48">
                  <img
                    src={recipe.image || "/placeholder.svg"}
                    alt={recipe.title}
                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-[#2B2520] mb-2">{recipe.title}</h3>
                  <p className="text-[#8B6F47] mb-4">{recipe.description}</p>
                  <div className="flex items-center gap-4 text-sm text-[#C41E3A] font-semibold mb-4">
                    <span>تحضير: {recipe.prepTime}</span>
                    <span>طهي: {recipe.cookTime}</span>
                  </div>
                  <Link
                    href="/recipes"
                    className="inline-block px-6 py-2 bg-[#E8A835] text-white rounded-lg font-semibold hover:bg-[#D9941E] transition-colors"
                  >
                    عرض الوصفة
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#2B2520] mb-4">تسوق حسب الفئة</h2>
            <p className="text-lg text-[#8B6F47]">اختر من بين مجموعتنا الواسعة من التوابل والخلطات</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={category.href}
                className="group p-8 rounded-2xl bg-gradient-to-br from-[#F5F1E8] to-[#F5F1E8]/50 border border-[#E8A835]/20 hover:border-[#E8A835] hover:shadow-lg transition-all cursor-pointer"
              >
                <div className="text-5xl mb-4">{category.icon}</div>
                <h3 className="text-xl font-bold text-[#2B2520] mb-2 group-hover:text-[#E8A835] transition-colors">
                  {category.arabicName}
                </h3>
                <p className="text-sm text-[#8B6F47] mb-4">{category.description}</p>
                <div className="flex items-center gap-2 text-[#E8A835] font-semibold group-hover:gap-3 transition-all">
                  استكشف <ArrowRight size={16} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Traditional Blends Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#2B2520] mb-4">الخلطات التقليدية</h2>
            <p className="text-lg text-[#8B6F47]">أصل الطعم المصري الحقيقي</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {traditionalBlends.map((blend) => (
              <div
                key={blend.id}
                className="bg-[#F5F1E8] rounded-xl p-6 hover:shadow-lg transition-all border border-[#E8A835]/20 hover:border-[#E8A835]"
              >
                <img
                  src={blend.image || "/placeholder.svg"}
                  alt={blend.name}
                  className="w-full h-40 object-cover rounded-lg mb-4"
                />
                <h3 className="text-lg font-bold text-[#2B2520] mb-2">{blend.name}</h3>
                <p className="text-sm text-[#C41E3A] font-semibold mb-2">الاستخدام:</p>
                <p className="text-sm text-[#8B6F47] mb-4">{blend.recipe}</p>
                <p className="text-xs text-[#8B6F47] border-t border-[#E8A835]/30 pt-3">
                  <span className="font-semibold">المكونات:</span> {blend.ingredients}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Promotional Section */}
      <section className="py-16 bg-gradient-to-r from-[#C41E3A] via-[#E8A835] to-[#C41E3A]">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="inline-block mb-6 px-6 py-2 bg-white/20 rounded-full">
            <span className="text-white text-lg font-bold">عرض حصري محدود</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">خصم 10% على كل المنتجات</h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            استمتع بأفضل التوابل المصرية الأصلية بسعر خاص. العرض محدود الوقت فقط!
          </p>
          <Link
            href="/store"
            className="inline-block px-10 py-4 bg-white text-[#C41E3A] rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors"
          >
            اغتنم العرض الآن
          </Link>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-20 bg-[#F5F1E8]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#2B2520] mb-4">المنتجات المميزة</h2>
            <p className="text-lg text-[#8B6F47]">أكثر المنتجات مبيعاً واستحساناً</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all group"
              >
                <div className="relative overflow-hidden bg-gray-100 h-64">
                  <img
                    src={product.image || "/placeholder.svg"}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-4 left-4 bg-[#C41E3A] text-white px-3 py-1 rounded-full text-sm font-bold">
                    -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                  </div>
                </div>

                <div className="p-4">
                  <p className="text-xs text-[#E8A835] font-semibold uppercase mb-2">{product.brand}</p>
                  <h3 className="text-lg font-bold text-[#2B2520] mb-3">{product.name}</h3>

                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={16}
                          className={i < Math.floor(product.rating) ? "fill-[#E8A835] text-[#E8A835]" : "text-gray-300"}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-[#8B6F47]">({product.reviews})</span>
                  </div>

                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-2xl font-bold text-[#C41E3A]">{product.price} ج.م</span>
                    <span className="text-sm text-gray-400 line-through">{product.originalPrice} ج.م</span>
                  </div>

                  <button className="w-full py-2 bg-[#E8A835] text-white rounded-lg font-semibold hover:bg-[#D9941E] transition-colors">
                    أضف إلى السلة
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/store"
              className="inline-block px-8 py-3 bg-[#2B2520] text-white rounded-lg font-bold hover:bg-[#1a1512] transition-colors"
            >
              عرض جميع المنتجات
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#2B2520] mb-4">تقييمات عملائنا</h2>
            <p className="text-lg text-[#8B6F47]">اعرف ماذا يقول عملاؤنا الراضون</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="p-8 bg-[#F5F1E8] rounded-xl border border-[#E8A835]/20">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} size={18} className="fill-[#E8A835] text-[#E8A835]" />
                  ))}
                </div>

                <p className="text-[#2B2520] mb-6 leading-relaxed text-lg">"{testimonial.text}"</p>

                <div>
                  <p className="font-bold text-[#2B2520]">{testimonial.name}</p>
                  <p className="text-sm text-[#8B6F47]">{testimonial.location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-[#C41E3A] to-[#E8A835]">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">هل أنت مستعد لاكتشاف الطعم الحقيقي؟</h2>
          <p className="text-lg text-white/90 mb-8">
            تابعنا على وسائل التواصل الاجتماعي للحصول على أحدث العروض والنصائح الطهويَّة
          </p>
          <Link
            href="/store"
            className="inline-block px-8 py-3 bg-white text-[#C41E3A] rounded-lg font-bold hover:bg-gray-100 transition-colors"
          >
            ابدأ التسوق الآن
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  )
}
