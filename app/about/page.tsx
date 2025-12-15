import type { Metadata } from "next"
import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { Award, Flame, HandPlatter, Leaf, Quote, Recycle, Rocket, Users } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { DEFAULT_ABOUT_PAGE } from "@/lib/site-content/defaults"
import { aboutPagePayloadSchema, coercePayloadOrDefault } from "@/lib/site-content/schemas"
import type { AboutIconKey, AboutPagePayload } from "@/lib/site-content/types"

type ValueCard = {
  title: string
  description: string
  icon: LucideIcon
  accent: string
}

export const metadata: Metadata = {
  title: "من نحن | Tatbeelah & Tabel",
  description: "تعرف على قصة تتبيلة وتابل، قيمنا، وشركائنا في صناعة التوابل المصرية الأصيلة.",
}

export const dynamic = "force-dynamic"

type AboutSettingsRow = {
  is_active: boolean
  payload: unknown
}

const ICONS: Record<AboutIconKey, LucideIcon> = {
  flame: Flame,
  recycle: Recycle,
  handPlatter: HandPlatter,
  users: Users,
  leaf: Leaf,
  rocket: Rocket,
  award: Award,
}

function accentForIcon(icon: AboutIconKey) {
  switch (icon) {
    case "flame":
      return "from-[#C41E3A]/15 to-transparent"
    case "recycle":
      return "from-[#1E5F4D]/15 to-transparent"
    case "handPlatter":
      return "from-[#E8A835]/20 to-transparent"
    case "users":
      return "from-[#8B6F47]/20 to-transparent"
    case "leaf":
      return "from-[#2D6A4F]/15 to-transparent"
    case "rocket":
      return "from-[#2B2520]/10 to-transparent"
    case "award":
      return "from-[#E8A835]/15 to-transparent"
  }
}

function mapValues(payload: AboutPagePayload): ValueCard[] {
  return payload.values.map((v) => ({
    title: v.title,
    description: v.description,
    icon: ICONS[v.icon],
    accent: accentForIcon(v.icon),
  }))
}

export default async function AboutPage() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("page_settings")
    .select("is_active, payload")
    .eq("key", "about_page")
    .maybeSingle()

  if (error) {
    console.error("Failed to load about page settings", error)
  }

  const row = (data ?? null) as AboutSettingsRow | null
  const isActive = row ? Boolean(row.is_active) : true
  const payload = coercePayloadOrDefault(aboutPagePayloadSchema, row?.payload, DEFAULT_ABOUT_PAGE)

  if (!isActive) {
    return (
      <main className="min-h-screen">
        <section className="py-24 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-4xl font-bold text-[#2B2520] mb-4">من نحن</h1>
            <p className="text-lg text-[#8B6F47]">هذه الصفحة غير متاحة حالياً.</p>
          </div>
        </section>
      </main>
    )
  }

  const values = mapValues(payload)

  return (
    <main className="min-h-screen">

      <section className="relative overflow-hidden py-20">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 right-16 h-64 w-64 rounded-full bg-[#E8A835]/20 blur-3xl" />
          <div className="absolute bottom-0 left-10 h-80 w-80 rounded-full bg-[#C41E3A]/10 blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="grid gap-12 md:grid-cols-2 items-center">
            <div>
              <p className="tracking-[0.4em] uppercase text-xs text-[#8B6F47] mb-4">{payload.hero.eyebrow}</p>
              <h1 className="text-4xl md:text-5xl font-bold text-[#2B2520] leading-tight mb-6">
                {payload.hero.title}
                <span className="text-[#C41E3A]"> {payload.hero.highlight}</span>
              </h1>
              <p className="text-lg text-[#5C5347] mb-8">
                {payload.hero.description}
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href={payload.hero.primaryCtaUrl}
                  className="inline-flex items-center justify-center rounded-full bg-[#2B2520] px-8 py-3 text-sm font-semibold text-white hover:bg-[#1b1612] transition-colors"
                >
                  {payload.hero.primaryCtaLabel}
                </Link>
                <Link
                  href={payload.hero.secondaryCtaUrl}
                  className="inline-flex items-center justify-center rounded-full border border-[#2B2520] px-8 py-3 text-sm font-semibold text-[#2B2520] hover:bg-[#2B2520] hover:text-white transition-colors"
                >
                  {payload.hero.secondaryCtaLabel}
                </Link>
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm border border-[#E8E2D1] rounded-3xl p-8 shadow-2xl">
              <div className="flex items-center gap-3 mb-6 text-[#8B6F47]">
                <Award className="text-[#E8A835]" />
                <span className="font-semibold">حرفية معتمدة في تصنيع التوابل</span>
              </div>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-[#F5F1E8] flex items-center justify-center">
                    <Leaf className="text-[#C41E3A]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#2B2520] mb-2">من الحقل إلى العبوة</h3>
                    <p className="text-[#5C5347]">
                      نختار الحصاد في ذروة النضج ونضمن الطحن خلال 48 ساعة للحفاظ على الزيوت الطيارة.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-[#F5F1E8] flex items-center justify-center">
                    <Rocket className="text-[#E8A835]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#2B2520] mb-2">مختبر الابتكار</h3>
                    <p className="text-[#5C5347]">
                      نجري أكثر من 70 تجربة تحميص وطحن سنوياً لإطلاق خلطات موسمية تلائم المطابخ الحديثة.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {payload.stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-[#E8E2D1] bg-white/80 backdrop-blur-sm p-6 text-center shadow-sm hover:shadow-md transition-shadow"
              >
                <p className="text-4xl font-extrabold text-[#C41E3A] mb-2">{stat.value}</p>
                <p className="text-lg font-bold text-[#2B2520] mb-2">{stat.label}</p>
                <p className="text-sm text-[#8B6F47]">{stat.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <p className="text-sm uppercase tracking-[0.4em] text-[#8B6F47] mb-2">Journey</p>
            <h2 className="text-4xl font-bold text-[#2B2520]">خط زمني من الشغف</h2>
            <p className="text-[#5C5347] mt-4 max-w-3xl mx-auto">
              كل محطة في رحلتنا ارتبطت بقصة عميل أو مزرعة أو وصفة خاصة. هذه أبرز لحظاتنا.
            </p>
          </div>
          <div className="space-y-8">
            {payload.milestones.map((milestone, index) => (
              <div
                key={milestone.year}
                className="relative rounded-3xl border border-[#E8E2D1] bg-white/60 backdrop-blur-sm p-8 shadow-sm"
              >
                <div className="flex flex-wrap gap-6 items-start">
                  <div className="text-3xl font-black text-[#E8A835]">{milestone.year}</div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-[#2B2520] mb-2">{milestone.title}</h3>
                    <p className="text-[#5C5347] leading-relaxed">{milestone.description}</p>
                  </div>
                  <span className="hidden md:block text-sm font-semibold text-[#8B6F47]">
                    محطة رقم {index + 1}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-sm uppercase tracking-[0.4em] text-[#8B6F47] mb-2">Values</p>
            <h2 className="text-4xl font-bold text-[#2B2520]">قيم تقود قراراتنا اليومية</h2>
          </div>
          <div className="grid gap-8 md:grid-cols-2">
            {values.map((value) => (
              <div key={value.title} className="relative rounded-3xl border border-[#E8E2D1] bg-white/80 backdrop-blur-sm p-8 overflow-hidden">
                <div className={`absolute inset-0 pointer-events-none bg-gradient-to-br ${value.accent}`} />
                <div className="relative z-10 flex items-start gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-[#2B2520] flex items-center justify-center">
                    <value.icon className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-[#2B2520] mb-3">{value.title}</h3>
                    <p className="text-[#5C5347] leading-relaxed">{value.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#2B2520] mb-4">شبكة التوريد المسؤولة</h2>
            <p className="text-[#5C5347]">
              نعمل جنباً إلى جنب مع مزارعين محليين لضمان جودة الحبوب ودعم الاقتصاد المجتمعي.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {payload.sourcingHighlights.map((item) => (
              <div key={item.region} className="rounded-2xl border border-[#E8E2D1] bg-white/60 backdrop-blur-sm p-6">
                <p className="text-sm font-semibold text-[#8B6F47] mb-2">{item.region}</p>
                <h3 className="text-xl font-bold text-[#2B2520] mb-3">{item.crop}</h3>
                <p className="text-[#5C5347]">{item.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-r from-[#0f2027] via-[#203a43] to-[#2c5364]">
        <div className="max-w-5xl mx-auto px-4 text-center text-white">
          <p className="text-sm uppercase tracking-[0.5em] mb-4">{payload.cta.eyebrow}</p>
          <h2 className="text-4xl font-bold mb-6">{payload.cta.title}</h2>
          <p className="text-lg text-white/90 mb-8">{payload.cta.description}</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href={payload.cta.primaryCtaUrl}
              className="inline-flex items-center justify-center rounded-full bg-white px-8 py-3 text-sm font-bold text-[#C41E3A] hover:bg-gray-100 transition-colors"
            >
              {payload.cta.primaryCtaLabel}
            </Link>
            <Link
              href={payload.cta.secondaryCtaUrl}
              className="inline-flex items-center justify-center rounded-full border border-white px-8 py-3 text-sm font-bold text-white hover:bg-white/10 transition-colors"
            >
              {payload.cta.secondaryCtaLabel}
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}

