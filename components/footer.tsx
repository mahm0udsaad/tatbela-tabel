import Link from "next/link"
import { Facebook, Twitter, Instagram, Mail, Phone } from "lucide-react"

export function Footer() {
  return (
    <footer className="pb-12 bg-[#2B2520] text-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Info */}
          <div>
            <h3 className="text-2xl font-bold text-[#E8A835] mb-4">تتبيلة & تابل</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              أفضل مصدر للتوابل والخلطات المصرية الأصلية، نحمل إليك روح الطعم الحقيقي.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold mb-4 text-[#E8A835]">روابط سريعة</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-gray-300 hover:text-[#E8A835] transition-colors">
                  الصفحة الرئيسية
                </Link>
              </li>
              <li>
                <Link href="/store" className="text-gray-300 hover:text-[#E8A835] transition-colors">
                  المتجر
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-300 hover:text-[#E8A835] transition-colors">
                  من نحن
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="font-bold mb-4 text-[#E8A835]">خدمة العملاء</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/contact" className="text-gray-300 hover:text-[#E8A835] transition-colors">
                  تواصل معنا
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-300 hover:text-[#E8A835] transition-colors">
                  سياسة الخصوصية
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-300 hover:text-[#E8A835] transition-colors">
                  الشروط والأحكام
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold mb-4 text-[#E8A835]">تواصل معنا</h4>
            <div className="space-y-3 text-sm">
              <a
                href="tel:+201234567890"
                className="flex items-center gap-2 text-gray-300 hover:text-[#E8A835] transition-colors"
              >
                <Phone size={16} />
                +20 123 456 7890
              </a>
              <a
                href="mailto:info@tatbeelah-tabel.com"
                className="flex items-center gap-2 text-gray-300 hover:text-[#E8A835] transition-colors"
              >
                <Mail size={16} />
                info@tatbeelah-tabel.com
              </a>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-[#8B6F47]/30 pt-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* Social Links */}
            <div className="flex items-center gap-4">
              <a href="#" className="text-gray-400 hover:text-[#E8A835] transition-colors">
                <Facebook size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-[#E8A835] transition-colors">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-[#E8A835] transition-colors">
                <Instagram size={20} />
              </a>
            </div>

            {/* Copyright */}
            <p className="text-gray-400 text-sm">© 2025 تتبيلة & تابل. جميع الحقوق محفوظة.</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
