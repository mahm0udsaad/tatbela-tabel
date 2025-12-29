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
    tiktok: "",
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
  title: "من نحن",
  content:
    "تتبيلة & تابل علامة مصرية متخصصة في التوابل والخلطات الأصيلة.\n\nنؤمن أن الطعم الحقيقي يبدأ من اختيار المكونات بعناية، والتحميص والطحن في الوقت المناسب، ثم التعبئة الصغيرة التي تحافظ على الزيوت العطرية.\n\nهدفنا أن نُسهل عليك طبخ أكلات بطابع مصري أصيل، مع تجربة شراء بسيطة وخدمة عملاء واضحة وسريعة.",
}


