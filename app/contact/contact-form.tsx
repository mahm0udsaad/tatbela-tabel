"use client"

import type React from "react"
import { useState } from "react"
import { Send } from "lucide-react"

export function ContactForm() {
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
    // TODO: Wire to real delivery (email / ticketing). For now keep UX responsive.
    setSubmitted(true)
    setTimeout(() => {
      setFormData({ name: "", email: "", subject: "", message: "" })
      setSubmitted(false)
    }, 3000)
  }

  return (
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
            className="w-full px-4 py-3 border border-[#D9D4C8] rounded-lg focus:outline-none focus:border-brand-green text-[#2B2520]"
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
            className="w-full px-4 py-3 border border-[#D9D4C8] rounded-lg focus:outline-none focus:border-brand-green text-[#2B2520]"
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
            className="w-full px-4 py-3 border border-[#D9D4C8] rounded-lg focus:outline-none focus:border-brand-green text-[#2B2520]"
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
            className="w-full px-4 py-3 border border-[#D9D4C8] rounded-lg focus:outline-none focus:border-brand-green text-[#2B2520] resize-none"
            placeholder="اكتب رسالتك هنا..."
          />
        </div>

        {submitted && (
          <div className="p-4 bg-green-100 border border-green-400 rounded-lg text-green-700">
            شكراً لك! تم استقبال رسالتك وسنرد عليك قريباً.
          </div>
        )}

        <button
          type="submit"
          className="w-full px-8 py-3 bg-brand-green text-white rounded-lg font-bold hover:bg-brand-green-dark transition-colors flex items-center justify-center gap-2"
        >
          <Send size={20} />
          أرسل الرسالة
        </button>
      </form>
    </div>
  )
}


