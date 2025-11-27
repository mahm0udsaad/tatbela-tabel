import Link from "next/link"
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
    image_url: "/sliders/anju-ravindranath-Nihdo084Yos-unsplash.jpg",
    alt_text: "مزيج من التوابل الأصلية",
    link_url: "/store",
    sort_order: 0,
  },
  {
    id: "fallback-2",
    image_url: "/sliders/paolo-bendandi-VVe3zOZM88E-unsplash.jpg",
    alt_text: "أطباق الكاري المميزة من تتبيلة",
    link_url: "/recipes",
    sort_order: 1,
  },
  {
    id: "fallback-3",
    image_url: "/sliders/tamanna-rumee-qkgxIZOhvWI-unsplash.jpg",
    alt_text: "عروض الموسم على خلطات الدجاج",
    link_url: "/store?category=offers",
    sort_order: 2,
  },
  {
    id: "fallback-4",
    image_url: "/sliders/zahrin-lukman-VSNoQdimlQQ-unsplash.jpg",
    alt_text: "أفضل أنواع التوابل العالمية",
    link_url: "/store",
    sort_order: 3,
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
    href: "/store",
  },
  {
    id: 2,
    name: "الخلطات",
    arabicName: "الخلطات",
    description: "خلطات مصرية أصلية",
    icon: "🥘",
    href: "/blends",
  },
  {
    id: 3,
    name: "الصوصات",
    arabicName: "الصوصات",
    description: "صوصات لذيذة وشهية",
    icon: "🍲",
    href: "/sauces",
  },
  {
    id: 4,
    name: "العروض",
    arabicName: "العروض",
    description: "أفضل العروض والخصومات",
    icon: "🎁",
    href: "/offers",
  },
]

type FeaturedProductImage = {
  image_url: string
  is_primary: boolean
}

type FeaturedProductRecord = {
  id: string
  name_ar: string
  brand: string
  price: number
  original_price: number | null
  rating: number | null
  reviews_count: number | null
  product_images: FeaturedProductImage[] | null
}

type FeaturedProductCard = {
  id: string
  name_ar: string
  brand: string
  price: number
  original_price: number | null
  rating: number | null
  reviews_count: number | null
  image_url: string | null
}

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

import { AddToCartButton } from "@/components/add-to-cart-button"

async function getFeaturedProducts(): Promise<FeaturedProductCard[]> {
  const baseSelect = `
    id,
    name_ar,
    brand,
    price,
    original_price,
    rating,
    reviews_count,
    product_images (image_url, is_primary)
  `

  try {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from("products")
      .select(baseSelect)
      .eq("is_featured", true)
      .order("updated_at", { ascending: false })
      .limit(8)

    if (error) {
      console.error("Error fetching featured products:", error)
      return []
    }

    let featured = mapFeaturedProducts(data)

    if (featured.length < 8) {
      const { data: fallbackData, error: fallbackError } = await supabase
        .from("products")
        .select(baseSelect)
        .order("reviews_count", { ascending: false })
        .limit(8)

      if (fallbackError) {
        console.error("Error fetching fallback featured products:", fallbackError)
        return featured
      }

      const fallback = mapFeaturedProducts(fallbackData).filter(
        (product) => !featured.some((existing) => existing.id === product.id),
      )

      featured = [...featured, ...fallback]
    }

    return featured.slice(0, 8)
  } catch (error) {
    console.error("Error fetching featured products:", error)
    return []
  }
}

function mapFeaturedProducts(rows: FeaturedProductRecord[] | null | undefined): FeaturedProductCard[] {
  if (!rows) return []
  return rows.map((product) => {
    const primaryImage =
      product.product_images?.find((image) => image.is_primary)?.image_url ??
      product.product_images?.[0]?.image_url ??
      null

    return {
      id: product.id,
      name_ar: product.name_ar,
      brand: product.brand,
      price: product.price,
      original_price: product.original_price,
      rating: product.rating,
      reviews_count: product.reviews_count,
      image_url: primaryImage,
    }
  })
}

export default async function Home() {
  const heroImages = await getHeroCarouselImages()
  const featuredProducts = await getFeaturedProducts()
  const heroSlides = heroImages.length > 0 ? heroImages : fallbackHeroImages
  return (
    <main className="min-h-screen bg-white">

      {/* Hero Section */}
      <section className="relative py-10 md:py-18 overflow-hidden bg-gradient-to-b from-[#F5F1E8] to-white">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 right-20 w-72 h-72 bg-[#E8A835]/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 left-10 w-96 h-96 bg-[#C41E3A]/5 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-8xl mx-auto px-4 relative z-10">
          <Carousel className="relative" opts={{ loop: true, direction: "rtl" }}>
            <CarouselContent>
              {heroSlides.map((slide) => (
                <CarouselItem key={slide.id}>
                  <div className="relative h-[460px] md:h-[720px] overflow-hidden rounded-[32px] bg-[#1f1b16]">
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
            <CarouselPrevious className="hidden md:flex absolute top-1/2  right-6 -translate-y-1/2 bg-white/80 text-[#2B2520] border border-white shadow-lg h-12 w-12 [&_svg]:rotate-180" />
           <CarouselNext className="hidden md:flex absolute top-1/2 left-6 trasnlate-x-100rem -translate-y-1/2 bg-white/80 text-[#2B2520] border border-white shadow-lg h-12 w-12 [&_svg]:rotate-180" />
          </Carousel>
        </div>
      </section>
      {featuredProducts.length > 0 && (
        <section className="relative z-10 -mt-16 mb-16 px-4">
          <div className="max-w-7xl mx-auto rounded-[32px] border border-[#E8E2D1] bg-[#FAF9F6] p-6 md:p-10 shadow-2xl">
            <div className="mb-10 flex flex-col items-center text-center">
              <p className="mb-2 text-sm uppercase tracking-[0.3em] text-[#8B6F47]">Featured • مختار بعناية</p>
              <h3 className="text-3xl font-bold text-[#2B2520] md:text-4xl">أبرز منتجات Tatbeelah & Tabel</h3>
              <p className="mt-3 max-w-2xl text-[#8B6F47]">مزيج من أفضل منتجاتنا الأعلى تقييماً والأكثر طلباً.</p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
              {featuredProducts.map((product) => (
                <div
                  key={`hero-featured-${product.id}`}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-[#E8E2D1] bg-white transition-all duration-300 hover:border-[#E8A835] hover:shadow-xl"
                >
                  <Link href={`/product/${product.id}`} className="relative block aspect-[4/3] overflow-hidden bg-[#F5F1E8]">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name_ar}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-4xl">🌶️</div>
                    )}
                    {product.original_price && product.original_price > product.price && (
                      <div className="absolute left-2 top-2 rounded-full bg-[#C41E3A] px-2 py-1 text-[10px] font-bold text-white shadow-sm">
                        خصم {Math.round(((product.original_price - product.price) / product.original_price) * 100)}%
                      </div>
                    )}
                  </Link>
                  <div className="flex flex-1 flex-col gap-2 p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-[#E8A835]">{product.brand}</p>
                        <Link href={`/product/${product.id}`}>
                          <h4 className="mt-1 line-clamp-1 text-base font-bold text-[#2B2520] transition-colors hover:text-[#C41E3A]">
                            {product.name_ar}
                          </h4>
                        </Link>
                      </div>
                      <div className="flex items-center gap-1 rounded-md bg-[#F5F1E8] px-2 py-1">
                        <Star size={12} className="fill-[#E8A835] text-[#E8A835]" />
                        <span className="text-xs font-bold text-[#2B2520]">
                          {product.rating ? product.rating.toFixed(1) : "جديد"}
                        </span>
                      </div>
                    </div>
                    <div className="mt-auto flex items-center justify-between border-t border-[#F5F1E8] pt-3">
                      <div className="flex flex-col">
                        <span className="text-lg font-extrabold text-[#C41E3A]">{product.price} ج.م</span>
                        {product.original_price && product.original_price > product.price && (
                          <span className="text-xs text-gray-400 line-through">{product.original_price} ج.م</span>
                        )}
                      <AddToCartButton productId={product.id} className="h-9 px-2 text-xs" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-10 flex justify-center">
              <Link
                href="/store?featured=1"
                className="inline-flex items-center justify-center rounded-full bg-[#2B2520] px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-[#2B2520]/20 transition-all hover:-translate-y-0.5 hover:bg-[#1b1612]"
              >
                عرض الكل
                <ArrowRight className="mr-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

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

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
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

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
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
    </main>
  )
}
