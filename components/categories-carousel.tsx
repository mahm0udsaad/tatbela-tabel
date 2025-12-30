'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { useMemo } from 'react'

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
  // Duplicate categories multiple times for seamless infinite loop
  const duplicatedCategories = useMemo(() => {
    return [...categories, ...categories, ...categories]
  }, [categories])

  return (
    <section className="py-20">
      <div className="max-w-8xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4">تسوق حسب الفئة</h2>
          <p className="text-lg text-brand-cumin">اختر من بين مجموعتنا الواسعة من التوابل والخلطات</p>
        </div>

        <div className="relative overflow-hidden">
          <div className="flex animate-scroll-rtl gap-6">
            {duplicatedCategories.map((category, index) => (
              <div
                key={`${category.id}-${index}`}
                className="flex-shrink-0 w-[280px] md:w-[300px]"
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
    </section>
  )
}

