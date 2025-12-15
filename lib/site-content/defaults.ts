import type { AboutPagePayload, ContactPagePayload, FooterPayload } from "@/lib/site-content/types"

export const DEFAULT_FOOTER: FooterPayload = {
  brand: {
    name: "تتبيلة & تابل",
    description: "أفضل مصدر للتوابل والخلطات المصرية الأصلية، نحمل إليك روح الطعم الحقيقي.",
  },
  columns: [
    {
      title: "روابط سريعة",
      links: [
        { label: "الصفحة الرئيسية", href: "/" },
        { label: "المتجر", href: "/store" },
        { label: "من نحن", href: "/about" },
      ],
    },
    {
      title: "خدمة العملاء",
      links: [
        { label: "تواصل معنا", href: "/contact" },
        { label: "سياسة الخصوصية", href: "/privacy" },
        { label: "الشروط والأحكام", href: "/terms" },
      ],
    },
  ],
  contact: {
    phones: ["+20 123 456 7890"],
    emails: ["info@tatbeelah-tabel.com"],
  },
  socials: {
    facebook: "",
    instagram: "",
    twitter: "",
  },
  copyright: "© 2025 تتبيلة & تابل. جميع الحقوق محفوظة.",
}

export const DEFAULT_CONTACT_PAGE: ContactPagePayload = {
  header: {
    title: "تواصل معنا",
    subtitle: "نحن هنا للإجابة على جميع أسئلتك واستفساراتك",
  },
  phones: ["+20 123 456 7890", "+20 198 765 4321"],
  emails: ["info@tatbeelah-tabel.com", "support@tatbeelah-tabel.com"],
  whatsapp: {
    phone: "+20 123 456 7890",
    label: "ابدأ محادثة واتساب",
  },
  workHours: [
    { label: "السبت - الخميس", time: "9:00 ص - 10:00 م" },
    { label: "الجمعة", time: "2:00 م - 10:00 م" },
  ],
  location: {
    title: "القاهرة، مصر",
    lines: ["شارع التحرير، حي الزمالك", "بجوار سوق السمك", "الرمز البريدي: 11211"],
  },
  quickHelp: {
    title: "هل تحتاج مساعدة سريعة؟",
    description: "اتصل بفريق خدمة العملاء لدينا الآن",
    phone: "+20 123 456 7890",
    ctaLabel: "اتصل الآن",
  },
}

export const DEFAULT_ABOUT_PAGE: AboutPagePayload = {
  hero: {
    eyebrow: "Our Story • قصتنا",
    title: "نعيد تعريف التتبيلة المصرية",
    highlight: "منذ 2008",
    description:
      "بدأنا من مطبخ عائلي صغير، واليوم نخدم مجتمعاً واسعاً من عشاق الطهي الذين يبحثون عن خلطات أصيلة بطابع معاصر. نجمع بين خبرة الأجيال وتقنيات التحميص الحديثة لنقدم منتجات تشعر معها بأن كل وجبة مناسبة للاحتفال.",
    primaryCtaLabel: "استكشف المتجر",
    primaryCtaUrl: "/store",
    secondaryCtaLabel: "تواصل معنا",
    secondaryCtaUrl: "/contact",
  },
  stats: [
    { value: "15+", label: "عاماً من الحرفية", detail: "نصنع الخلطات منذ بداياتنا العائلية الأولى" },
    { value: "120+", label: "خلطة حصرية", detail: "وصفات مسجلة تضمن الطعم المصري الأصيل" },
    { value: "40+", label: "مزارع وشريك", detail: "شبكة توريد شفافة من دلتا النيل إلى أسوان" },
    { value: "25", label: "مدينة نخدمها", detail: "توصيل مبرد وسريع في أنحاء الجمهورية" },
  ],
  milestones: [
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
  ],
  values: [
    {
      title: "الأصالة أولاً",
      description: "نوثق كل وصفة ونحافظ على نسب البهارات كما تعلّمناها من أمهاتنا وجداتنا.",
      icon: "flame",
    },
    {
      title: "استدامة التوريد",
      description: "نعمل مع مزارع معتمدة وندعم الزراعة المتجددة للحفاظ على خصوبة أرض مصر.",
      icon: "recycle",
    },
    {
      title: "صياغة يدوية",
      description: "كل دفعة تُطحن وتعبأ بكميات صغيرة لضمان نكهة مركزة وطراوة الحبوب.",
      icon: "handPlatter",
    },
    {
      title: "مجتمع الطهاة",
      description: "نستمع لملاحظات الطهاة المنزليين ونطلق خلطات موسمية بناءً على اقتراحاتهم.",
      icon: "users",
    },
  ],
  sourcingHighlights: [
    { region: "دلتا النيل", crop: "كمون وكزبرة", note: "حصاد مبكر وتجفيف شمسي للحفاظ على الزيوت العطرية." },
    { region: "أسوان والنوبة", crop: "فلفل حار ومسمن", note: "مزارع عائلية تستخدم الري بالتنقيط لزيادة التركيز والنكهة." },
    { region: "سيناء", crop: "مريمية وزعتر بري", note: "يُقطف يدوياً في الفجر ويُنقل مباشرةً إلى معاملنا في نفس اليوم." },
  ],
  team: [
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
  ],
  cta: {
    eyebrow: "Join Us",
    title: "جاهز لتجربة ألذ أطباقك؟",
    description:
      "سواء كنت شيفاً محترفاً أو هاوياً للطهي المنزلي، فريق Tatbeelah & Tabel جاهز لدعمك بمنتجات أصلية وخدمة لا تُنسى.",
    primaryCtaLabel: "تسوق الآن",
    primaryCtaUrl: "/store",
    secondaryCtaLabel: "احجز تذوقاً خاصاً",
    secondaryCtaUrl: "/contact",
  },
}


