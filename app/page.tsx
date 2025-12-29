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

type HomepagePromotion = {
  id: string
  tagline: string | null
  title: string
  description: string | null
  cta_label: string | null
  cta_url: string | null
  background_from: string | null
  background_via: string | null
  background_to: string | null
  is_active: boolean
}

type PromotionContent = {
  tagline: string | null
  title: string
  description: string | null
  cta_label: string | null
  cta_url: string | null
  background_from: string
  background_via: string
  background_to: string
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

const fallbackPromotion: PromotionContent = {
  tagline: "عرض حصري محدود",
  title: "خصم 10% على كل المنتجات",
  description: "استمتع بأفضل التوابل المصرية الأصلية بسعر خاص. العرض محدود الوقت فقط!",
  cta_label: "اغتنم العرض الآن",
  cta_url: "/store",
  background_from: "#1A4D2E",
  background_via: "#0F2F1F",
  background_to: "#1A4D2E",
}

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

async function getHomepagePromotion(): Promise<HomepagePromotion | null> {
  try {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from("homepage_promotions")
      .select(
        "id, tagline, title, description, cta_label, cta_url, background_from, background_via, background_to, is_active",
      )
      .order("updated_at", { ascending: false })
      .limit(1)

    if (error) {
      console.error("فشل في جلب قسم العروض", error)
      return null
    }

    return data?.[0] ?? null
  } catch (error) {
    console.error("فشل في جلب قسم العروض", error)
    return null
  }
}

const categories = [
  {
    id: 1,
    name: "العطارة",
    arabicName: "العطارة",
    description: "توابل طبيعية مختارة بعناية",
    icon: "🌶️",
    href: "/store?category=atara",
  },
  {
    id: 2,
    name: "الخلطات",
    arabicName: "الخلطات",
    description: "خلطات مصرية أصلية",
    icon: "🧂", // أو 🥄 أو 🫙
    href: "/store?category=blends",
  },
  {
    id: 3,
    name: "الصوصات",
    arabicName: "الصوصات",
    description: "صوصات لذيذة وشهية",
    icon: "🫕", // أو 🍅 أو 🍯
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
  {
    id: 5,
    name: "منتجات الجمله",
    arabicName: "منتجات الجمله",
    description: "أفضل الأسعار لتجار الجملة والكميات الكبيرة",
    icon: "📦",
    href: "/b2b",
  }
];



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
      .eq("is_archived", false)
      .eq("is_b2b", false)
      .order("sort_order", { ascending: true })
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
        .eq("is_archived", false)
        .eq("is_b2b", false)
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
  const promotion = await getHomepagePromotion()
  const heroSlides = heroImages.length > 0 ? heroImages : fallbackHeroImages
  const activePromotion: PromotionContent | null =
    promotion && promotion.is_active
      ? {
          tagline: promotion.tagline,
          title: promotion.title,
          description: promotion.description,
          cta_label: promotion.cta_label,
          cta_url: promotion.cta_url,
          background_from: promotion.background_from ?? fallbackPromotion.background_from,
          background_via: promotion.background_via ?? fallbackPromotion.background_via,
          background_to: promotion.background_to ?? fallbackPromotion.background_to,
        }
      : null
  const shouldRenderPromotion = promotion ? promotion.is_active : true
  const promoContent = activePromotion ?? fallbackPromotion
  return (
    <main className="min-h-screen">

      {/* Hero Section */}
      <section className="relative pb-0 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 right-20 w-72 h-72 bg-primary/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 left-10 w-96 h-96 bg-brand-red/5 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-8xl mx-auto px-4 relative z-10">
          <Carousel className="relative" opts={{ loop: true, direction: "rtl" }}>
            <CarouselContent>
              {heroSlides.map((slide) => (
                <CarouselItem key={slide.id} className="w-full">
                  {slide.link_url ? (
                    <Link
                      href={slide.link_url}
                      className="block relative w-full aspect-[1850/820] overflow-hidden rounded-[32px] bg-[#1f1b16] cursor-pointer group"
                    >
                      <img
                        src={slide.image_url}
                        alt={slide.alt_text ?? "صورة السلايدر"}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/30 to-black/70" />
                      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 flex flex-col gap-4 text-white">
                        {slide.alt_text && <p className="text-2xl font-bold">{slide.alt_text}</p>}
                      </div>
                    </Link>
                  ) : (
                    <div className="relative w-full aspect-[1850/820] overflow-hidden rounded-[32px] bg-[#1f1b16]">
                      <img
                        src={slide.image_url}
                        alt={slide.alt_text ?? "صورة السلايدر"}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/30 to-black/70" />
                      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 flex flex-col gap-4 text-white">
                        {slide.alt_text && <p className="text-2xl font-bold">{slide.alt_text}</p>}
                      </div>
                    </div>
                  )}
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="flex absolute top-1/2 left-3 md:left-6 -translate-y-1/2 bg-white/80 text-foreground border border-white shadow-lg h-10 w-10 md:h-12 md:w-12" />
            <CarouselNext className="flex absolute top-1/2 right-3 md:right-6 -translate-y-1/2 bg-white/80 text-foreground border border-white shadow-lg h-10 w-10 md:h-12 md:w-12" />
          </Carousel>
        </div>
      </section>
      {featuredProducts.length > 0 && (
        <section className="relative z-10 mb-16 px-4">
          <div className="max-w-7xl mx-auto rounded-[32px] border border-primary/20 bg-muted p-6 md:p-10 shadow-2xl">
            <div className="mb-10 flex flex-col items-center text-center">
            </div>
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
              {featuredProducts.map((product) => (
                <div
                  key={`hero-featured-${product.id}`}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-primary/20 bg-white transition-all duration-300 hover:border-primary hover:shadow-xl"
                >
                  <Link href={`/product/${product.id}`} className="relative block aspect-[4/3] overflow-hidden bg-muted">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name_ar}
                        className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105 bg-white"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-4xl">🌶️</div>
                    )}
                    {product.original_price && product.original_price > product.price && (
                      <div className="absolute left-2 top-2 rounded-full bg-brand-red px-2 py-1 text-[10px] font-bold text-white shadow-sm">
                        خصم {Math.round(((product.original_price - product.price) / product.original_price) * 100)}%
                      </div>
                    )}
                  </Link>
                  <div className="flex flex-1 flex-col gap-2 p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-primary">{product.brand}</p>
                        <Link href={`/product/${product.id}`}>
                          <h4 className="mt-1 line-clamp-1 text-base font-bold text-foreground transition-colors hover:text-brand-red">
                            {product.name_ar}
                          </h4>
                        </Link>
                      </div>
                      <div className="flex items-center gap-1 rounded-md bg-muted px-2 py-1">
                        <Star size={12} className="fill-primary text-primary" />
                        <span className="text-xs font-bold text-foreground">
                          {product.rating ? product.rating.toFixed(1) : "جديد"}
                        </span>
                      </div>
                    </div>
                    <div className="mt-auto items-center justify-between border-t border-muted pt-3">
                      <div className="flex flex-col">
                        <span className="text-lg font-extrabold text-brand-red">{product.price} ج.م</span>
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
                className="inline-flex items-center justify-center rounded-full bg-brand-dark-brown px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-dark-brown/20 transition-all hover:-translate-y-0.5 hover:opacity-90"
              >
                عرض الكل
                <ArrowRight className="mr-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Categories Section */}
      <section className="py-20">
        <div className="max-w-8xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">تسوق حسب الفئة</h2>
            <p className="text-lg text-brand-cumin">اختر من بين مجموعتنا الواسعة من التوابل والخلطات</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={category.href}
                className="flex flex-col items-center justify-center group p-8 rounded-2xl bg-white/60 backdrop-blur-sm border border-primary/20 hover:border-primary hover:shadow-lg transition-all cursor-pointer"
              >
                <div className="text-5xl mb-4">{category.icon}</div>
                <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {category.arabicName}
                </h3>
                <p className="text-sm text-brand-cumin mb-4">{category.description}</p>
                <div className="flex items-center gap-2 text-primary font-semibold group-hover:gap-3 transition-all">
                  استكشف <ArrowRight size={16} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Promotional Section */}
      {shouldRenderPromotion && (
        <section
          className="py-16"
          style={{
            backgroundImage: `linear-gradient(to right, ${promoContent.background_from}, ${promoContent.background_via}, ${promoContent.background_to})`,
          }}
        >
          <div className="mx-auto max-w-7xl px-4 text-center">
            {promoContent.tagline && (
              <div className="mb-6 inline-block rounded-full bg-white/20 px-6 py-2">
                <span className="text-lg font-bold text-white">{promoContent.tagline}</span>
              </div>
            )}
            <h2 className="mb-6 text-4xl font-bold text-white md:text-5xl">{promoContent.title}</h2>
            {promoContent.description && (
              <p className="mx-auto mb-8 max-w-2xl text-xl text-white/90">{promoContent.description}</p>
            )}
            {promoContent.cta_url && (
              <Link
                href={promoContent.cta_url}
                className="inline-block rounded-lg bg-white px-10 py-4 text-lg font-bold text-brand-red transition-colors hover:bg-gray-100"
              >
                {promoContent.cta_label || "تسوق الآن"}
              </Link>
            )}
          </div>
        </section>
      )}

      {/* Testimonials Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">تقييمات عملائنا</h2>
            <p className="text-lg text-brand-cumin">اعرف ماذا يقول عملاؤنا الراضون</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="p-8 bg-white/60 backdrop-blur-sm rounded-xl border border-primary/20">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} size={18} className="fill-primary text-primary" />
                  ))}
                </div>

                <p className="text-foreground mb-6 leading-relaxed text-lg">"{testimonial.text}"</p>

                <div>
                  <p className="font-bold text-foreground">{testimonial.name}</p>
                  <p className="text-sm text-brand-cumin">{testimonial.location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </main>
  )
}
