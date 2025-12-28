import { Phone, Mail, MapPin, MessageCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { DEFAULT_CONTACT_PAGE } from "@/lib/site-content/defaults"
import { coercePayloadOrDefault, contactPagePayloadSchema } from "@/lib/site-content/schemas"
import { ContactForm } from "./contact-form"

export const dynamic = "force-dynamic"

type ContactSettingsRow = {
  is_active: boolean
  payload: unknown
}

function normalizePhoneForTel(input: string) {
  return input.replace(/[^\d+]/g, "")
}

function normalizePhoneForWhatsapp(input: string) {
  return input.replace(/[^\d+]/g, "").replace(/^\+/, "")
}

export default async function ContactPage() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("page_settings")
    .select("is_active, payload")
    .eq("key", "contact_page")
    .maybeSingle()

  if (error) {
    console.error("Failed to load contact page settings", error)
  }

  const row = (data ?? null) as ContactSettingsRow | null
  const isActive = row ? Boolean(row.is_active) : true
  const payload = coercePayloadOrDefault(contactPagePayloadSchema, row?.payload, DEFAULT_CONTACT_PAGE)

  if (!isActive) {
    return (
      <main className="min-h-screen">
        <section className="py-24 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-4xl font-bold text-[#2B2520] mb-4">{payload.header.title}</h1>
            <p className="text-lg text-[#8B6F47]">هذه الصفحة غير متاحة حالياً.</p>
          </div>
        </section>
      </main>
    )
  }

  const whatsappUrl = `https://wa.me/${normalizePhoneForWhatsapp(payload.whatsapp.phone)}`

  return (
    <main className="min-h-screen">
      {/* Header */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold text-[#2B2520] mb-4">{payload.header.title}</h1>
          <p className="text-lg text-[#8B6F47]">{payload.header.subtitle}</p>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-gradient-to-br from-[#F5F1E8] to-[#F5F1E8]/50 p-8 rounded-xl border border-brand-green/20">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-brand-green rounded-lg flex items-center justify-center">
                  <Phone size={24} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-[#2B2520]">الهاتف</h3>
              </div>
              <p className="text-[#8B6F47] mb-3">اتصل بنا في أوقات العمل</p>
              {payload.phones.map((phone) => (
                <a
                  key={phone}
                  href={`tel:${normalizePhoneForTel(phone)}`}
                  className="block text-[#C41E3A] font-semibold hover:underline mt-2 first:mt-0"
                >
                  {phone}
                </a>
              ))}
            </div>

            <div className="bg-gradient-to-br from-[#F5F1E8] to-[#F5F1E8]/50 p-8 rounded-xl border border-brand-green/20">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-brand-green rounded-lg flex items-center justify-center">
                  <Mail size={24} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-[#2B2520]">البريد الإلكتروني</h3>
              </div>
              <p className="text-[#8B6F47] mb-3">راسلنا على بريدنا الإلكتروني</p>
              {payload.emails.map((email) => (
                <a
                  key={email}
                  href={`mailto:${email}`}
                  className="block text-[#C41E3A] font-semibold hover:underline mt-2 first:mt-0"
                >
                  {email}
                </a>
              ))}
            </div>

            <div className="bg-gradient-to-br from-[#F5F1E8] to-[#F5F1E8]/50 p-8 rounded-xl border border-brand-green/20">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-brand-green rounded-lg flex items-center justify-center">
                  <MessageCircle size={24} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-[#2B2520]">واتساب</h3>
              </div>
              <p className="text-[#8B6F47] mb-3">تواصل معنا عبر واتساب</p>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#C41E3A] font-semibold hover:underline"
              >
                {payload.whatsapp.label}
              </a>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <ContactForm />

            <div>
              <h2 className="text-3xl font-bold text-[#2B2520] mb-2">ساعات العمل</h2>
              <p className="text-[#8B6F47] mb-8">نحن متاحون طوال أيام الأسبوع</p>

              <div className="space-y-4 mb-8">
                {payload.workHours.map((item) => (
                  <div
                    key={item.label}
                    className="flex justify-between gap-4 p-4 bg-[#F5F1E8] rounded-lg border border-brand-green/20"
                  >
                    <span className="font-semibold text-[#2B2520]">{item.label}</span>
                    <span className="text-[#8B6F47]">{item.time}</span>
                  </div>
                ))}
              </div>

              <h3 className="text-xl font-bold text-[#2B2520] mb-4 flex items-center gap-2">
                <MapPin size={24} className="text-brand-green" />
                موقعنا
              </h3>
              <div className="bg-[#F5F1E8] p-6 rounded-lg border border-brand-green/20 mb-6">
                <p className="text-[#2B2520] font-semibold mb-2">{payload.location.title}</p>
                <p className="text-[#8B6F47]">
                  {payload.location.lines.map((line) => (
                    <span key={line}>
                      {line}
                      <br />
                    </span>
                  ))}
                </p>
              </div>

              <div className="bg-gradient-to-br from-brand-green-dark to-brand-green p-8 rounded-xl text-white">
                <h4 className="font-bold text-lg mb-2">{payload.quickHelp.title}</h4>
                <p className="mb-4">{payload.quickHelp.description}</p>
                <a
                  href={`tel:${normalizePhoneForTel(payload.quickHelp.phone)}`}
                  className="inline-block px-6 py-2 bg-white text-brand-green-dark rounded-lg font-bold hover:bg-gray-100 transition-colors"
                >
                  {payload.quickHelp.ctaLabel}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
