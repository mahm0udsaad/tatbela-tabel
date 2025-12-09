"use client"

import Link from "next/link"
import { Mail, ArrowRight } from "lucide-react"

export default function VerifyEmailPage() {
  return (
    <main className="min-h-screen">

      <section className="py-12">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md p-8 border border-[#E8E2D1] text-center">
            <div className="w-16 h-16 bg-[#F5F1E8] rounded-full flex items-center justify-center mx-auto mb-6">
              <Mail size={32} className="text-[#E8A835]" />
            </div>
            <h1 className="text-3xl font-bold text-[#2B2520] mb-2">تحقق من بريدك الإلكتروني</h1>
            <p className="text-[#8B6F47] mb-8">
              لقد أرسلنا لك رابط تأكيد على بريدك الإلكتروني. يرجى الضغط على الرابط لتفعيل حسابك
            </p>

            <div className="bg-[#F5F1E8] p-4 rounded-lg mb-8">
              <p className="text-sm text-[#8B6F47]">لم يصل الرسالة؟ تحقق من مجلد البريد العشوائي</p>
            </div>

            <Link
              href="/auth/sign-in"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#E8A835] text-white rounded-lg font-semibold hover:bg-[#D9941E] transition-colors"
            >
              العودة لتسجيل الدخول
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
