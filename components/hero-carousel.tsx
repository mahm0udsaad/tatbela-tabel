'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import Autoplay from 'embla-carousel-autoplay'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel'

type HeroCarouselImage = {
  id: string
  image_url: string
  alt_text: string | null
  link_url: string | null
  sort_order: number | null
  created_at?: string
}

type HeroCarouselProps = {
  slides: HeroCarouselImage[]
}

export function HeroCarousel({ slides }: HeroCarouselProps) {
  const autoplayPlugin = useMemo(
    () =>
      Autoplay({
        delay: 2000,
        stopOnInteraction: false,
        stopOnMouseEnter: true,
      }),
    [],
  )

  return (
    <div className="max-w-8xl mx-auto px-2 sm:px-4 relative z-10">
      <Carousel
        className="relative"
        opts={{ loop: true, direction: 'rtl' }}
        plugins={[autoplayPlugin]}
      >
        <CarouselContent>
          {slides.map((slide) => (
            <CarouselItem key={slide.id} className="w-full pl-2 sm:pl-4">
              {slide.link_url ? (
                <Link
                  href={slide.link_url}
                  className="block relative w-full aspect-[4/3] sm:aspect-[16/9] md:aspect-[21/9] lg:aspect-[1850/820] overflow-hidden rounded-2xl md:rounded-[32px] bg-[#1f1b16] cursor-pointer group"
                >
                  <img
                    src={slide.image_url}
                    alt={slide.alt_text ?? 'صورة السلايدر'}
                    className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/30 to-black/70" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-10 flex flex-col gap-2 md:gap-4 text-white">
                    {slide.alt_text && <p className="text-lg sm:text-xl md:text-2xl font-bold">{slide.alt_text}</p>}
                  </div>
                </Link>
              ) : (
                <div className="relative w-full aspect-[4/3] sm:aspect-[16/9] md:aspect-[21/9] lg:aspect-[1850/820] overflow-hidden rounded-2xl md:rounded-[32px] bg-[#1f1b16]">
                  <img
                    src={slide.image_url}
                    alt={slide.alt_text ?? 'صورة السلايدر'}
                    className="h-full w-full object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/30 to-black/70" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-10 flex flex-col gap-2 md:gap-4 text-white">
                    {slide.alt_text && <p className="text-lg sm:text-xl md:text-2xl font-bold">{slide.alt_text}</p>}
                  </div>
                </div>
              )}
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="flex absolute top-1/2 left-2 sm:left-3 md:left-6 -translate-y-1/2 bg-white/80 hover:bg-white text-foreground border border-white shadow-lg h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 z-20" />
        <CarouselNext className="flex absolute top-1/2 right-2 sm:right-3 md:right-6 -translate-y-1/2 bg-white/80 hover:bg-white text-foreground border border-white shadow-lg h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 z-20" />
      </Carousel>
    </div>
  )
}

