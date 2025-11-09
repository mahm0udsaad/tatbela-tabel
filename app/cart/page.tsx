import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ArrowRight } from "lucide-react"

export default function CartPage() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold text-[#2B2520] mb-4">سلتك فارغة</h1>
          <p className="text-lg text-[#8B6F47] mb-8">ابدأ التسوق واضف منتجاتك المفضلة</p>
          <Link
            href="/store"
            className="inline-block px-8 py-3 bg-[#E8A835] text-white rounded-lg font-bold hover:bg-[#D9941E] transition-colors"
          >
            متابعة التسوق <ArrowRight size={20} className="inline ml-2" />
          </Link>
        </div>
      </section>
      <Footer />
    </main>
  )
}
