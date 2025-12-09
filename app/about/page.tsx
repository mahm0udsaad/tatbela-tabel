import type { Metadata } from "next"
import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { Award, Flame, HandPlatter, Leaf, Quote, Recycle, Rocket, Users } from "lucide-react"

const stats = [
  { value: "15+", label: "عاماً من الحرفية", detail: "نصنع الخلطات منذ بداياتنا العائلية الأولى" },
  { value: "120+", label: "خلطة حصرية", detail: "وصفات مسجلة تضمن الطعم المصري الأصيل" },
  { value: "40+", label: "مزارع وشريك", detail: "شبكة توريد شفافة من دلتا النيل إلى أسوان" },
  { value: "25", label: "مدينة نخدمها", detail: "توصيل مبرد وسريع في أنحاء الجمهورية" },
]

const milestones = [
  {
    year: "2008",
    title: "البداية من مطبخ العائلة",
    description: "كانت الخلطات تُجهز يدوياً وتُباع مباشرةً للجيران وأصدقاء العائلة في القاهرة.",
  },
  {
    year: "2014",
    title: "أول ورشة توابل",
    description: "افتتحنا مساحة إنتاج صغيرة مع مطاحن مباشرة، ما سمح بالتحكم الكامل في درجات التحميص والطحن.",
  },
  {
    year: "2019",
    title: "التحول الرقمي",
    description: "أطلقنا متجرنا الإلكتروني ووفرنا تتبعاً لجودة التوريد من المزرعة إلى العبوة.",
  },
  {
    year: "2024",
    title: "Tatbeelah & Tabel",
    description: "دمجنا خبرتنا في الخلطات والصلصات ضمن هوية موحدة لخدمة عشاق الطهي حول العالم.",
  },
]

type ValueCard = {
  title: string
  description: string
  icon: LucideIcon
  accent: string
}

const values: ValueCard[] = [
  {
    title: "الأصالة أولاً",
    description: "نوثق كل وصفة ونحافظ على نسب البهارات كما تعلّمناها من أمهاتنا وجداتنا.",
    icon: Flame,
    accent: "from-[#C41E3A]/15 to-transparent",
  },
  {
    title: "استدامة التوريد",
    description: "نعمل مع مزارع معتمدة وندعم الزراعة المتجددة للحفاظ على خصوبة أرض مصر.",
    icon: Recycle,
    accent: "from-[#1E5F4D]/15 to-transparent",
  },
  {
    title: "صياغة يدوية",
    description: "كل دفعة تُطحن وتعبأ بكميات صغيرة لضمان نكهة مركزة وطراوة الحبوب.",
    icon: HandPlatter,
    accent: "from-[#E8A835]/20 to-transparent",
  },
  {
    title: "مجتمع الطهاة",
    description: "نستمع لملاحظات الطهاة المنزليين ونطلق خلطات موسمية بناءً على اقتراحاتهم.",
    icon: Users,
    accent: "from-[#8B6F47]/20 to-transparent",
  },
]

const sourcingHighlights = [
  {
    region: "دلتا النيل",
    crop: "كمون وكزبرة",
    note: "حصاد مبكر وتجفيف شمسي للحفاظ على الزيوت العطرية.",
  },
  {
    region: "أسوان والنوبة",
    crop: "فلفل حار ومسمن",
    note: "مزارع عائلية تستخدم الري بالتنقيط لزيادة التركيز والنكهة.",
  },
  {
    region: "سيناء",
    crop: "مريمية وزعتر بري",
    note: "يُقطف يدوياً في الفجر ويُنقل مباشرةً إلى معاملنا في نفس اليوم.",
  },
]

const team = [
  {
    name: "أمينة فؤاد",
    role: "المديرة الإبداعية للخلطات",
    focus: "تقود تطوير الوصفات وتوثيق التجارب المنزلية.",
    quote: "أفضل خلطة هي التي تحكي ذكريات سفرة كاملة.",
  },
  {
    name: "خالد عمر",
    role: "رئيس تجربة العملاء",
    focus: "يضمن وصول الطلبات بسرعة ويحافظ على تواصلنا مع العملاء.",
    quote: "الثقة تُبنى بالشحنة الأولى ثم تُحفظ بالشفافية.",
  },
  {
    name: "سلمى شهاب",
    role: "قائدة الشراكات الزراعية",
    focus: "تدير العلاقات مع المزارع وتتابع جودة المحاصيل.",
    quote: "حين ندعم المزارع، ندعم النكهة من جذورها.",
  },
]

export const metadata: Metadata = {
  title: "من نحن | Tatbeelah & Tabel",
  description: "تعرف على قصة تتبيلة وتابل، قيمنا، وشركائنا في صناعة التوابل المصرية الأصيلة.",
}

export default function AboutPage() {
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
              <p className="tracking-[0.4em] uppercase text-xs text-[#8B6F47] mb-4">Our Story • قصتنا</p>
              <h1 className="text-4xl md:text-5xl font-bold text-[#2B2520] leading-tight mb-6">
                نعيد تعريف التتبيلة المصرية
                <span className="text-[#C41E3A]"> منذ 2008</span>
              </h1>
              <p className="text-lg text-[#5C5347] mb-8">
                بدأنا من مطبخ عائلي صغير، واليوم نخدم مجتمعاً واسعاً من عشاق الطهي الذين يبحثون عن خلطات أصيلة
                بطابع معاصر. نجمع بين خبرة الأجيال وتقنيات التحميص الحديثة لنقدم منتجات تشعر معها بأن كل وجبة
                مناسبة للاحتفال.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/store"
                  className="inline-flex items-center justify-center rounded-full bg-[#2B2520] px-8 py-3 text-sm font-semibold text-white hover:bg-[#1b1612] transition-colors"
                >
                  استكشف المتجر
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-full border border-[#2B2520] px-8 py-3 text-sm font-semibold text-[#2B2520] hover:bg-[#2B2520] hover:text-white transition-colors"
                >
                  تواصل معنا
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
            {stats.map((stat) => (
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
            {milestones.map((milestone, index) => (
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
            {sourcingHighlights.map((item) => (
              <div key={item.region} className="rounded-2xl border border-[#E8E2D1] bg-white/60 backdrop-blur-sm p-6">
                <p className="text-sm font-semibold text-[#8B6F47] mb-2">{item.region}</p>
                <h3 className="text-xl font-bold text-[#2B2520] mb-3">{item.crop}</h3>
                <p className="text-[#5C5347]">{item.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#2B2520] mb-4">وجوه وراء النكهة</h2>
            <p className="text-[#5C5347]">فريق صغير متفرغ لإسعاد مائدة كل عميل.</p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {team.map((member) => (
              <div key={member.name} className="rounded-3xl border border-[#E8E2D1] bg-white/80 backdrop-blur-sm p-8 shadow-sm">
                <div className="h-16 w-16 rounded-2xl bg-[#2B2520] text-white text-2xl font-bold flex items-center justify-center mb-4">
                  {member.name.slice(0, 1)}
                </div>
                <h3 className="text-2xl font-bold text-[#2B2520]">{member.name}</h3>
                <p className="text-[#C41E3A] font-semibold mt-1 mb-3">{member.role}</p>
                <p className="text-sm text-[#8B6F47] mb-4">{member.focus}</p>
                <div className="relative rounded-2xl bg-[#F5F1E8] p-4 text-[#5C5347] text-sm">
                  <Quote className="absolute -top-4 left-4 h-8 w-8 text-[#E8A835]" />
                  <p className="leading-relaxed">{member.quote}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-r from-[#C41E3A] via-[#E8A835] to-[#C41E3A]">
        <div className="max-w-5xl mx-auto px-4 text-center text-white">
          <p className="text-sm uppercase tracking-[0.5em] mb-4">Join Us</p>
          <h2 className="text-4xl font-bold mb-6">جاهز لتجربة ألذ أطباقك؟</h2>
          <p className="text-lg text-white/90 mb-8">
            سواء كنت شيفاً محترفاً أو هاوياً للطهي المنزلي، فريق Tatbeelah & Tabel جاهز لدعمك بمنتجات أصلية وخدمة لا
            تُنسى.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/store"
              className="inline-flex items-center justify-center rounded-full bg-white px-8 py-3 text-sm font-bold text-[#C41E3A] hover:bg-gray-100 transition-colors"
            >
              تسوق الآن
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-full border border-white px-8 py-3 text-sm font-bold text-white hover:bg-white/10 transition-colors"
            >
              احجز تذوقاً خاصاً
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}

