"use client"

import type React from "react"

import { useState } from "react"
import { Phone, Mail, MapPin, Send, MessageCircle } from "lucide-react"

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  })
  const [submitted, setSubmitted] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Simulate form submission
    setSubmitted(true)
    setTimeout(() => {
      setFormData({ name: "", email: "", subject: "", message: "" })
      setSubmitted(false)
    }, 3000)
  }

  return (
    <main className="min-h-screen bg-white">

      {/* Header */}
      <section className="bg-[#F5F1E8] py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold text-[#2B2520] mb-4">تواصل معنا</h1>
          <p className="text-lg text-[#8B6F47]">نحن هنا للإجابة على جميع أسئلتك واستفساراتك</p>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {/* Contact Info Cards */}
            <div className="bg-gradient-to-br from-[#F5F1E8] to-[#F5F1E8]/50 p-8 rounded-xl border border-[#E8A835]/20">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-[#E8A835] rounded-lg flex items-center justify-center">
                  <Phone size={24} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-[#2B2520]">الهاتف</h3>
              </div>
              <p className="text-[#8B6F47] mb-3">اتصل بنا في أوقات العمل</p>
              <a href="tel:+201234567890" className="text-[#C41E3A] font-semibold hover:underline">
                +20 123 456 7890
              </a>
              <a href="tel:+201987654321" className="block text-[#C41E3A] font-semibold hover:underline mt-2">
                +20 198 765 4321
              </a>
            </div>

            <div className="bg-gradient-to-br from-[#F5F1E8] to-[#F5F1E8]/50 p-8 rounded-xl border border-[#E8A835]/20">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-[#E8A835] rounded-lg flex items-center justify-center">
                  <Mail size={24} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-[#2B2520]">البريد الإلكتروني</h3>
              </div>
              <p className="text-[#8B6F47] mb-3">راسلنا على بريدنا الإلكتروني</p>
              <a href="mailto:info@tatbeelah-tabel.com" className="text-[#C41E3A] font-semibold hover:underline">
                info@tatbeelah-tabel.com
              </a>
              <a
                href="mailto:support@tatbeelah-tabel.com"
                className="block text-[#C41E3A] font-semibold hover:underline mt-2"
              >
                support@tatbeelah-tabel.com
              </a>
            </div>

            <div className="bg-gradient-to-br from-[#F5F1E8] to-[#F5F1E8]/50 p-8 rounded-xl border border-[#E8A835]/20">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-[#E8A835] rounded-lg flex items-center justify-center">
                  <MessageCircle size={24} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-[#2B2520]">واتساب</h3>
              </div>
              <p className="text-[#8B6F47] mb-3">تواصل معنا عبر واتساب</p>
              <a
                href="https://wa.me/201234567890"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#C41E3A] font-semibold hover:underline"
              >
                ابدأ محادثة واتساب
              </a>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Contact Form */}
            <div>
              <h2 className="text-3xl font-bold text-[#2B2520] mb-2">أرسل لنا رسالة</h2>
              <p className="text-[#8B6F47] mb-8">ملء النموذج أدناه وسنرد عليك في أقرب وقت ممكن</p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-[#2B2520] mb-2">الاسم*</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-[#D9D4C8] rounded-lg focus:outline-none focus:border-[#E8A835] text-[#2B2520]"
                    placeholder="اسمك الكامل"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#2B2520] mb-2">البريد الإلكتروني*</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-[#D9D4C8] rounded-lg focus:outline-none focus:border-[#E8A835] text-[#2B2520]"
                    placeholder="بريدك الإلكتروني"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#2B2520] mb-2">الموضوع*</label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-[#D9D4C8] rounded-lg focus:outline-none focus:border-[#E8A835] text-[#2B2520]"
                    placeholder="موضوع رسالتك"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#2B2520] mb-2">الرسالة*</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={5}
                    className="w-full px-4 py-3 border border-[#D9D4C8] rounded-lg focus:outline-none focus:border-[#E8A835] text-[#2B2520] resize-none"
                    placeholder="اكتب رسالتك هنا..."
                  ></textarea>
                </div>

                {submitted && (
                  <div className="p-4 bg-green-100 border border-green-400 rounded-lg text-green-700">
                    شكراً لك! تم استقبال رسالتك وسنرد عليك قريباً.
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full px-8 py-3 bg-[#E8A835] text-white rounded-lg font-bold hover:bg-[#D9941E] transition-colors flex items-center justify-center gap-2"
                >
                  <Send size={20} />
                  أرسل الرسالة
                </button>
              </form>
            </div>

            {/* Info Section */}
            <div>
              <h2 className="text-3xl font-bold text-[#2B2520] mb-2">ساعات العمل</h2>
              <p className="text-[#8B6F47] mb-8">نحن متاحون طوال أيام الأسبوع</p>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between p-4 bg-[#F5F1E8] rounded-lg border border-[#E8A835]/20">
                  <span className="font-semibold text-[#2B2520]">السبت - الخميس</span>
                  <span className="text-[#8B6F47]">9:00 ص - 10:00 م</span>
                </div>
                <div className="flex justify-between p-4 bg-[#F5F1E8] rounded-lg border border-[#E8A835]/20">
                  <span className="font-semibold text-[#2B2520]">الجمعة</span>
                  <span className="text-[#8B6F47]">2:00 م - 10:00 م</span>
                </div>
              </div>

              <h3 className="text-xl font-bold text-[#2B2520] mb-4 flex items-center gap-2">
                <MapPin size={24} className="text-[#E8A835]" />
                موقعنا
              </h3>
              <div className="bg-[#F5F1E8] p-6 rounded-lg border border-[#E8A835]/20 mb-6">
                <p className="text-[#2B2520] font-semibold mb-2">القاهرة، مصر</p>
                <p className="text-[#8B6F47]">
                  شارع التحرير، حي الزمالك
                  <br />
                  بجوار سوق السمك
                  <br />
                  الرمز البريدي: 11211
                </p>
              </div>

              <div className="bg-gradient-to-br from-[#C41E3A] to-[#E8A835] p-8 rounded-xl text-white">
                <h4 className="font-bold text-lg mb-2">هل تحتاج مساعدة سريعة؟</h4>
                <p className="mb-4">اتصل بفريق خدمة العملاء لدينا الآن</p>
                <a
                  href="tel:+201234567890"
                  className="inline-block px-6 py-2 bg-white text-[#C41E3A] rounded-lg font-bold hover:bg-gray-100 transition-colors"
                >
                  اتصل الآن
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
