'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { useState, useEffect } from 'react'

type Category = {
  id: number
  name: string
  arabicName: string
  description: string
  icon: string
  href: string
}

type CategoriesCarouselProps = {
  categories: Category[]
}

export function CategoriesCarousel({ categories }: CategoriesCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % categories.length)
    }, 3000)

    return () => clearInterval(interval)
  }, [categories.length])

  // Create extended array for seamless loop
  const extendedCategories = [...categories, ...categories, ...categories]
  const cardWidth = isMobile ? 50 : 33.33

  return (
    <section className="py-20">
      <div className="max-w-8xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4">تسوق حسب الفئة</h2>
          <p className="text-lg text-brand-cumin">اختر من بين مجموعتنا الواسعة من التوابل والخلطات</p>
        </div>

        <div className="relative overflow-hidden">
          <div className="flex justify-center items-center min-h-[320px]">
            <div className="overflow-hidden w-full max-w-6xl">
              <div 
                className="flex gap-6 transition-transform duration-700 ease-in-out"
                style={{
                  transform: `translateX(${currentIndex * cardWidth}%)`
                }}
              >
                {extendedCategories.map((category, index) => (
                  <div
                    key={`${category.id}-${index}`}
                    className="flex-shrink-0 w-[calc(50%-12px)] md:w-[calc(33.33%-16px)]"
                    style={{ minWidth: isMobile ? 'calc(50% - 12px)' : 'calc(33.33% - 16px)' }}
                  >
                    <Link
                      href={category.href}
                      className="flex flex-col items-center justify-center group p-8 rounded-2xl bg-white/60 backdrop-blur-sm border border-primary/20 hover:border-primary hover:shadow-lg transition-all cursor-pointer h-full"
                    >
                      <div className="text-5xl mb-4">{category.icon}</div>
                      <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                        {category.arabicName}
                      </h3>
                      <p className="text-sm text-brand-cumin mb-4 text-center">{category.description}</p>
                      <div className="flex items-center gap-2 text-primary font-semibold group-hover:gap-3 transition-all">
                        استكشف <ArrowRight size={16} />
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Indicator dots */}
          <div className="flex justify-center gap-2 mt-6">
            {categories.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex 
                    ? 'bg-primary w-8' 
                    : 'bg-primary/30 hover:bg-primary/50'
                }`}
                aria-label={`Go to category ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}