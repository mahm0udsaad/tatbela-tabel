"use client"

import { useMemo, useState } from "react"
import { Loader2, Save, Plus, Trash2, ArrowUp, ArrowDown, RefreshCw } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { DEFAULT_ABOUT_PAGE, DEFAULT_CONTACT_PAGE, DEFAULT_FOOTER } from "@/lib/site-content/defaults"
import type { AboutPagePayload, ContactPagePayload, FooterPayload } from "@/lib/site-content/types"
import { aboutPagePayloadSchema, coerceAboutPagePayload, contactPagePayloadSchema, footerPayloadSchema } from "@/lib/site-content/schemas"

type PageSettingsRow = {
  key: string
  is_active: boolean
  payload: unknown
  updated_at?: string | null
}

type SettingsByKey = Record<string, PageSettingsRow | undefined>

function moveItem<T>(list: T[], from: number, to: number) {
  if (to < 0 || to >= list.length) return list
  const copy = [...list]
  const [item] = copy.splice(from, 1)
  copy.splice(to, 0, item)
  return copy
}

export function SiteContentAdminClient({ initialSettings }: { initialSettings: SettingsByKey }) {
  const supabase = getSupabaseClient()

  const initialFooterRow = initialSettings.footer
  const initialContactRow = initialSettings.contact_page
  const initialAboutRow = initialSettings.about_page

  const [activeTab, setActiveTab] = useState<"footer" | "contact" | "about">("footer")

  const [footerActive, setFooterActive] = useState<boolean>(initialFooterRow?.is_active ?? true)
  const [contactActive, setContactActive] = useState<boolean>(initialContactRow?.is_active ?? true)
  const [aboutActive, setAboutActive] = useState<boolean>(initialAboutRow?.is_active ?? true)

  const [footer, setFooter] = useState<FooterPayload>(() => {
    const parsed = footerPayloadSchema.safeParse(initialFooterRow?.payload)
    return parsed.success ? parsed.data : DEFAULT_FOOTER
  })
  const [contact, setContact] = useState<ContactPagePayload>(() => {
    const parsed = contactPagePayloadSchema.safeParse(initialContactRow?.payload)
    return parsed.success ? parsed.data : DEFAULT_CONTACT_PAGE
  })
  const [about, setAbout] = useState<AboutPagePayload>(() => {
    return coerceAboutPagePayload(initialAboutRow?.payload, DEFAULT_ABOUT_PAGE)
  })

  const [isSaving, setIsSaving] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const footerPreview = useMemo(() => footer, [footer])
  const contactPreview = useMemo(() => contact, [contact])
  const aboutPreview = useMemo(() => about, [about])

  const saveKey = async (key: "footer" | "contact_page" | "about_page") => {
    setIsSaving(true)
    setStatus(null)
    setError(null)

    try {
      const now = new Date().toISOString()

      if (key === "footer") {
        const parsed = footerPayloadSchema.safeParse(footer)
        if (!parsed.success) throw new Error("بيانات الفوتر غير صالحة. تأكد من الحقول والروابط.")
        const { error: upsertError } = await supabase.from("page_settings").upsert({
          key,
          is_active: footerActive,
          payload: parsed.data,
          updated_at: now,
        })
        if (upsertError) throw upsertError
        setStatus("تم حفظ إعدادات الفوتر.")
      }

      if (key === "contact_page") {
        const parsed = contactPagePayloadSchema.safeParse(contact)
        if (!parsed.success) throw new Error("بيانات صفحة التواصل غير صالحة. تأكد من الحقول.")
        const { error: upsertError } = await supabase.from("page_settings").upsert({
          key,
          is_active: contactActive,
          payload: parsed.data,
          updated_at: now,
        })
        if (upsertError) throw upsertError
        setStatus("تم حفظ إعدادات صفحة التواصل.")
      }

      if (key === "about_page") {
        const parsed = aboutPagePayloadSchema.safeParse(about)
        if (!parsed.success) throw new Error("بيانات صفحة من نحن غير صالحة. تأكد من العنوان والمحتوى.")
        const { error: upsertError } = await supabase.from("page_settings").upsert({
          key,
          is_active: aboutActive,
          payload: parsed.data,
          updated_at: now,
        })
        if (upsertError) throw upsertError
        setStatus("تم حفظ إعدادات صفحة من نحن.")
      }
    } catch (e) {
      console.error("Failed to save site content", e)
      setError(e instanceof Error ? e.message : "تعذر حفظ التغييرات")
    } finally {
      setIsSaving(false)
    }
  }

  const resetToDefaults = () => {
    setError(null)
    setStatus("تمت إعادة القيم الافتراضية (لم يتم الحفظ بعد).")
    if (activeTab === "footer") setFooter({ ...DEFAULT_FOOTER })
    if (activeTab === "contact") setContact({ ...DEFAULT_CONTACT_PAGE })
    if (activeTab === "about") setAbout({ ...DEFAULT_ABOUT_PAGE })
  }

  const Header = (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
      <div>
        <p className="text-sm text-[#8B6F47] mb-1">إدارة محتوى الموقع</p>
        <h1 className="text-3xl font-bold text-[#2B2520]">الفوتر • تواصل معنا • من نحن</h1>
        <p className="text-sm text-[#8B6F47]">تحكم في محتوى الصفحات بسهولة مع معاينة فورية.</p>
      </div>
      <button
        type="button"
        onClick={resetToDefaults}
        className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#E8A835] px-4 py-2 text-sm font-semibold text-[#E8A835] hover:bg-[#FFF7E6]"
      >
        <RefreshCw size={16} />
        إعادة الافتراضي
      </button>
    </div>
  )

  return (
    <div className="p-6">
      {Header}
      {status && <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-700">{status}</div>}
      {error && <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</div>}

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="w-full justify-start flex-wrap h-auto">
          <TabsTrigger value="footer">الفوتر</TabsTrigger>
          <TabsTrigger value="contact">تواصل معنا</TabsTrigger>
          <TabsTrigger value="about">من نحن</TabsTrigger>
        </TabsList>

        <TabsContent value="footer" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl bg-white p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <p className="text-lg font-semibold text-[#2B2520]">محتوى الفوتر</p>
                <div className="flex items-center gap-3 text-sm text-[#8B6F47]">
                  <span>{footerActive ? "مفعل" : "مخفي"}</span>
                  <Switch checked={footerActive} onCheckedChange={setFooterActive} />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#2B2520]">اسم العلامة</label>
                  <input
                    value={footer.brand.name}
                    onChange={(e) => setFooter((p) => ({ ...p, brand: { ...p.brand, name: e.target.value } }))}
                    className="w-full rounded-lg border border-[#D9D4C8] px-4 py-3 focus:border-[#E8A835] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#2B2520]">وصف قصير</label>
                  <textarea
                    value={footer.brand.description}
                    onChange={(e) => setFooter((p) => ({ ...p, brand: { ...p.brand, description: e.target.value } }))}
                    className="h-28 w-full rounded-lg border border-[#D9D4C8] px-4 py-3 focus:border-[#E8A835] focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-lg font-semibold text-[#2B2520]">الأعمدة والروابط</p>
                  <button
                    type="button"
                    onClick={() =>
                      setFooter((p) => ({
                        ...p,
                        columns: [...p.columns, { title: "عنوان جديد", links: [{ label: "رابط", href: "/" }] }],
                      }))
                    }
                    className="inline-flex items-center gap-2 rounded-lg bg-[#E8A835] px-3 py-2 text-sm font-semibold text-white hover:bg-[#D9941E]"
                  >
                    <Plus size={16} />
                    إضافة عمود
                  </button>
                </div>

                <div className="space-y-4">
                  {footer.columns.map((col, colIndex) => (
                    <div key={colIndex} className="rounded-xl border border-[#E8E2D1] p-4 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <input
                          value={col.title}
                          onChange={(e) =>
                            setFooter((p) => ({
                              ...p,
                              columns: p.columns.map((c, i) => (i === colIndex ? { ...c, title: e.target.value } : c)),
                            }))
                          }
                          className="flex-1 rounded-lg border border-[#D9D4C8] px-3 py-2 text-sm focus:border-[#E8A835] focus:outline-none"
                        />
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setFooter((p) => ({ ...p, columns: moveItem(p.columns, colIndex, colIndex - 1) }))}
                            className="rounded-lg border border-[#D9D4C8] p-2 hover:bg-[#F5F1E8]"
                            aria-label="تحريك للأعلى"
                          >
                            <ArrowUp size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setFooter((p) => ({ ...p, columns: moveItem(p.columns, colIndex, colIndex + 1) }))}
                            className="rounded-lg border border-[#D9D4C8] p-2 hover:bg-[#F5F1E8]"
                            aria-label="تحريك للأسفل"
                          >
                            <ArrowDown size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setFooter((p) => ({ ...p, columns: p.columns.filter((_, i) => i !== colIndex) }))}
                            className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50"
                            aria-label="حذف العمود"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {col.links.map((link, linkIndex) => (
                          <div key={`${colIndex}-${linkIndex}`} className="grid gap-2 md:grid-cols-2">
                            <input
                              value={link.label}
                              onChange={(e) =>
                                setFooter((p) => ({
                                  ...p,
                                  columns: p.columns.map((c, i) =>
                                    i === colIndex
                                      ? {
                                          ...c,
                                          links: c.links.map((l, j) => (j === linkIndex ? { ...l, label: e.target.value } : l)),
                                        }
                                      : c,
                                  ),
                                }))
                              }
                              className="w-full rounded-lg border border-[#D9D4C8] px-3 py-2 text-sm focus:border-[#E8A835] focus:outline-none"
                              placeholder="النص"
                            />
                            <div className="flex gap-2">
                              <input
                                value={link.href}
                                onChange={(e) =>
                                  setFooter((p) => ({
                                    ...p,
                                    columns: p.columns.map((c, i) =>
                                      i === colIndex
                                        ? {
                                            ...c,
                                            links: c.links.map((l, j) => (j === linkIndex ? { ...l, href: e.target.value } : l)),
                                          }
                                        : c,
                                    ),
                                  }))
                                }
                                className="flex-1 rounded-lg border border-[#D9D4C8] px-3 py-2 text-sm focus:border-[#E8A835] focus:outline-none"
                                placeholder="/about"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setFooter((p) => ({
                                    ...p,
                                    columns: p.columns.map((c, i) =>
                                      i === colIndex ? { ...c, links: c.links.filter((_, j) => j !== linkIndex) } : c,
                                    ),
                                  }))
                                }
                                className="rounded-lg border border-red-200 px-3 text-red-600 hover:bg-red-50"
                                aria-label="حذف الرابط"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() =>
                            setFooter((p) => ({
                              ...p,
                              columns: p.columns.map((c, i) =>
                                i === colIndex ? { ...c, links: [...c.links, { label: "رابط جديد", href: "/" }] } : c,
                              ),
                            }))
                          }
                          className="inline-flex items-center gap-2 rounded-lg border border-[#D9D4C8] px-3 py-2 text-sm font-semibold text-[#2B2520] hover:bg-[#F5F1E8]"
                        >
                          <Plus size={16} />
                          إضافة رابط
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#2B2520]">أرقام الهاتف (سطر لكل رقم)</label>
                  <textarea
                    value={footer.contact.phones.join("\n")}
                    onChange={(e) =>
                      setFooter((p) => ({ ...p, contact: { ...p.contact, phones: e.target.value.split("\n").filter(Boolean) } }))
                    }
                    className="h-28 w-full rounded-lg border border-[#D9D4C8] px-4 py-3 focus:border-[#E8A835] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#2B2520]">الإيميلات (سطر لكل إيميل)</label>
                  <textarea
                    value={footer.contact.emails.join("\n")}
                    onChange={(e) =>
                      setFooter((p) => ({ ...p, contact: { ...p.contact, emails: e.target.value.split("\n").filter(Boolean) } }))
                    }
                    className="h-28 w-full rounded-lg border border-[#D9D4C8] px-4 py-3 focus:border-[#E8A835] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#2B2520]">Facebook URL</label>
                  <input
                    value={footer.socials.facebook ?? ""}
                    onChange={(e) => setFooter((p) => ({ ...p, socials: { ...p.socials, facebook: e.target.value } }))}
                    className="w-full rounded-lg border border-[#D9D4C8] px-3 py-2 text-sm focus:border-[#E8A835] focus:outline-none"
                    placeholder="https://facebook.com/..."
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#2B2520]">Instagram URL</label>
                  <input
                    value={footer.socials.instagram ?? ""}
                    onChange={(e) => setFooter((p) => ({ ...p, socials: { ...p.socials, instagram: e.target.value } }))}
                    className="w-full rounded-lg border border-[#D9D4C8] px-3 py-2 text-sm focus:border-[#E8A835] focus:outline-none"
                    placeholder="https://instagram.com/..."
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#2B2520]">TikTok URL</label>
                  <input
                    value={footer.socials.tiktok ?? ""}
                    onChange={(e) => setFooter((p) => ({ ...p, socials: { ...p.socials, tiktok: e.target.value } }))}
                    className="w-full rounded-lg border border-[#D9D4C8] px-3 py-2 text-sm focus:border-[#E8A835] focus:outline-none"
                    placeholder="https://tiktok.com/@..."
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#2B2520]">حقوق النشر</label>
                <input
                  value={footer.copyright}
                  onChange={(e) => setFooter((p) => ({ ...p, copyright: e.target.value }))}
                  className="w-full rounded-lg border border-[#D9D4C8] px-4 py-3 focus:border-[#E8A835] focus:outline-none"
                />
              </div>

              <button
                type="button"
                disabled={isSaving}
                onClick={() => saveKey("footer")}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#E8A835] py-3 text-base font-semibold text-white transition hover:bg-[#D9941E] disabled:opacity-60"
              >
                {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                حفظ الفوتر
              </button>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm space-y-4">
              <p className="text-lg font-semibold text-[#2B2520]">معاينة الفوتر</p>
              <div className="rounded-2xl bg-black text-white p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-xl font-bold text-[#E8A835] mb-2">{footerPreview.brand.name}</p>
                    <p className="text-gray-300 text-sm leading-relaxed">{footerPreview.brand.description}</p>
                  </div>
                  {footerPreview.columns.map((col) => (
                    <div key={col.title}>
                      <p className="font-bold mb-2 text-[#E8A835]">{col.title}</p>
                      <ul className="space-y-2 text-sm">
                        {col.links.map((l) => (
                          <li key={`${col.title}-${l.label}`}>{l.label}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                  <div>
                    <p className="font-bold mb-2 text-[#E8A835]">تواصل معنا</p>
                    <div className="space-y-2 text-sm text-gray-300">
                      <div>{footerPreview.contact.phones[0]}</div>
                      <div>{footerPreview.contact.emails[0]}</div>
                    </div>
                  </div>
                </div>
                <div className="mt-6 border-t border-white/15 pt-4 text-sm text-gray-400">{footerPreview.copyright}</div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="contact" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl bg-white p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <p className="text-lg font-semibold text-[#2B2520]">محتوى صفحة التواصل</p>
                <div className="flex items-center gap-3 text-sm text-[#8B6F47]">
                  <span>{contactActive ? "مفعل" : "مخفي"}</span>
                  <Switch checked={contactActive} onCheckedChange={setContactActive} />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#2B2520]">عنوان الصفحة</label>
                  <input
                    value={contact.header.title}
                    onChange={(e) => setContact((p) => ({ ...p, header: { ...p.header, title: e.target.value } }))}
                    className="w-full rounded-lg border border-[#D9D4C8] px-4 py-3 focus:border-[#E8A835] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#2B2520]">وصف قصير</label>
                  <input
                    value={contact.header.subtitle}
                    onChange={(e) => setContact((p) => ({ ...p, header: { ...p.header, subtitle: e.target.value } }))}
                    className="w-full rounded-lg border border-[#D9D4C8] px-4 py-3 focus:border-[#E8A835] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#2B2520]">أرقام الهاتف (سطر لكل رقم)</label>
                  <textarea
                    value={contact.phones.join("\n")}
                    onChange={(e) => setContact((p) => ({ ...p, phones: e.target.value.split("\n").filter(Boolean) }))}
                    className="h-28 w-full rounded-lg border border-[#D9D4C8] px-4 py-3 focus:border-[#E8A835] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#2B2520]">الإيميلات (سطر لكل إيميل)</label>
                  <textarea
                    value={contact.emails.join("\n")}
                    onChange={(e) => setContact((p) => ({ ...p, emails: e.target.value.split("\n").filter(Boolean) }))}
                    className="h-28 w-full rounded-lg border border-[#D9D4C8] px-4 py-3 focus:border-[#E8A835] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#2B2520]">رقم واتساب</label>
                  <input
                    value={contact.whatsapp.phone}
                    onChange={(e) => setContact((p) => ({ ...p, whatsapp: { ...p.whatsapp, phone: e.target.value } }))}
                    className="w-full rounded-lg border border-[#D9D4C8] px-4 py-3 focus:border-[#E8A835] focus:outline-none"
                    placeholder="+20 123 456 7890"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#2B2520]">نص زر واتساب</label>
                  <input
                    value={contact.whatsapp.label}
                    onChange={(e) => setContact((p) => ({ ...p, whatsapp: { ...p.whatsapp, label: e.target.value } }))}
                    className="w-full rounded-lg border border-[#D9D4C8] px-4 py-3 focus:border-[#E8A835] focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-lg font-semibold text-[#2B2520]">ساعات العمل</p>
                  <button
                    type="button"
                    onClick={() => setContact((p) => ({ ...p, workHours: [...p.workHours, { label: "يوم", time: "وقت" }] }))}
                    className="inline-flex items-center gap-2 rounded-lg border border-[#D9D4C8] px-3 py-2 text-sm font-semibold text-[#2B2520] hover:bg-[#F5F1E8]"
                  >
                    <Plus size={16} />
                    إضافة
                  </button>
                </div>
                <div className="space-y-2">
                  {contact.workHours.map((wh, i) => (
                    <div key={i} className="grid gap-2 md:grid-cols-2">
                      <input
                        value={wh.label}
                        onChange={(e) =>
                          setContact((p) => ({ ...p, workHours: p.workHours.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) }))
                        }
                        className="w-full rounded-lg border border-[#D9D4C8] px-3 py-2 text-sm focus:border-[#E8A835] focus:outline-none"
                      />
                      <div className="flex gap-2">
                        <input
                          value={wh.time}
                          onChange={(e) =>
                            setContact((p) => ({ ...p, workHours: p.workHours.map((x, j) => (j === i ? { ...x, time: e.target.value } : x)) }))
                          }
                          className="flex-1 rounded-lg border border-[#D9D4C8] px-3 py-2 text-sm focus:border-[#E8A835] focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setContact((p) => ({ ...p, workHours: p.workHours.filter((_, j) => j !== i) }))}
                          className="rounded-lg border border-red-200 px-3 text-red-600 hover:bg-red-50"
                          aria-label="حذف"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#2B2520]">عنوان الموقع</label>
                  <input
                    value={contact.location.title}
                    onChange={(e) => setContact((p) => ({ ...p, location: { ...p.location, title: e.target.value } }))}
                    className="w-full rounded-lg border border-[#D9D4C8] px-4 py-3 focus:border-[#E8A835] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#2B2520]">تفاصيل العنوان (سطر لكل سطر)</label>
                  <textarea
                    value={contact.location.lines.join("\n")}
                    onChange={(e) => setContact((p) => ({ ...p, location: { ...p.location, lines: e.target.value.split("\n").filter(Boolean) } }))}
                    className="h-28 w-full rounded-lg border border-[#D9D4C8] px-4 py-3 focus:border-[#E8A835] focus:outline-none"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-[#E8E2D1] p-4 space-y-3">
                <p className="text-lg font-semibold text-[#2B2520]">قسم المساعدة السريعة</p>
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#2B2520]">العنوان</label>
                    <input
                      value={contact.quickHelp.title}
                      onChange={(e) => setContact((p) => ({ ...p, quickHelp: { ...p.quickHelp, title: e.target.value } }))}
                      className="w-full rounded-lg border border-[#D9D4C8] px-4 py-3 focus:border-[#E8A835] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#2B2520]">رقم الهاتف</label>
                    <input
                      value={contact.quickHelp.phone}
                      onChange={(e) => setContact((p) => ({ ...p, quickHelp: { ...p.quickHelp, phone: e.target.value } }))}
                      className="w-full rounded-lg border border-[#D9D4C8] px-4 py-3 focus:border-[#E8A835] focus:outline-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-semibold text-[#2B2520]">الوصف</label>
                    <textarea
                      value={contact.quickHelp.description}
                      onChange={(e) => setContact((p) => ({ ...p, quickHelp: { ...p.quickHelp, description: e.target.value } }))}
                      className="h-24 w-full rounded-lg border border-[#D9D4C8] px-4 py-3 focus:border-[#E8A835] focus:outline-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-semibold text-[#2B2520]">نص الزر</label>
                    <input
                      value={contact.quickHelp.ctaLabel}
                      onChange={(e) => setContact((p) => ({ ...p, quickHelp: { ...p.quickHelp, ctaLabel: e.target.value } }))}
                      className="w-full rounded-lg border border-[#D9D4C8] px-4 py-3 focus:border-[#E8A835] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <button
                type="button"
                disabled={isSaving}
                onClick={() => saveKey("contact_page")}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#E8A835] py-3 text-base font-semibold text-white transition hover:bg-[#D9941E] disabled:opacity-60"
              >
                {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                حفظ صفحة التواصل
              </button>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm space-y-4">
              <p className="text-lg font-semibold text-[#2B2520]">معاينة (مختصرة)</p>
              <div className="rounded-xl border border-[#E8E2D1] bg-[#F5F1E8] p-5 space-y-3">
                <p className="text-xl font-bold text-[#2B2520]">{contactPreview.header.title}</p>
                <p className="text-sm text-[#8B6F47]">{contactPreview.header.subtitle}</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="rounded-lg bg-white p-3">
                    <p className="text-sm font-semibold text-[#2B2520] mb-1">الهاتف</p>
                    <p className="text-sm text-[#8B6F47]">{contactPreview.phones[0]}</p>
                  </div>
                  <div className="rounded-lg bg-white p-3">
                    <p className="text-sm font-semibold text-[#2B2520] mb-1">الإيميل</p>
                    <p className="text-sm text-[#8B6F47]">{contactPreview.emails[0]}</p>
                  </div>
                </div>
                <div className="rounded-lg bg-white p-3">
                  <p className="text-sm font-semibold text-[#2B2520] mb-1">واتساب</p>
                  <p className="text-sm text-[#8B6F47]">{contactPreview.whatsapp.label}</p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="about" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl bg-white p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <p className="text-lg font-semibold text-[#2B2520]">محتوى صفحة من نحن</p>
                <div className="flex items-center gap-3 text-sm text-[#8B6F47]">
                  <span>{aboutActive ? "مفعل" : "مخفي"}</span>
                  <Switch checked={aboutActive} onCheckedChange={setAboutActive} />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#2B2520]">عنوان المقال</label>
                  <input
                    value={about.title}
                    onChange={(e) => setAbout((p) => ({ ...p, title: e.target.value }))}
                    className="w-full rounded-lg border border-[#D9D4C8] px-4 py-3 focus:border-[#E8A835] focus:outline-none"
                    placeholder="من نحن"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <label className="block text-sm font-semibold text-[#2B2520]">محتوى المقال</label>
                    <span className="text-xs text-[#8B6F47]">استخدم سطر فارغ للفصل بين الفقرات</span>
                  </div>
                  <textarea
                    value={about.content}
                    onChange={(e) => setAbout((p) => ({ ...p, content: e.target.value }))}
                    className="h-[420px] w-full rounded-lg border border-[#D9D4C8] px-4 py-3 focus:border-[#E8A835] focus:outline-none"
                    placeholder="اكتب محتوى من نحن هنا..."
                  />
                </div>
              </div>

              <button
                type="button"
                disabled={isSaving}
                onClick={() => saveKey("about_page")}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#E8A835] py-3 text-base font-semibold text-white transition hover:bg-[#D9941E] disabled:opacity-60"
              >
                {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                حفظ صفحة من نحن
              </button>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm space-y-4">
              <p className="text-lg font-semibold text-[#2B2520]">معاينة المقال</p>
              <div className="rounded-2xl border border-[#E8E2D1] bg-[#F5F1E8] p-6">
                <article className="rounded-2xl bg-white border border-[#E8E2D1] p-6">
                  <h2 className="text-2xl font-bold text-[#2B2520] mb-4">{aboutPreview.title || "عنوان المقال"}</h2>
                  <div className="space-y-4 text-[#5C5347] leading-8">
                    {(aboutPreview.content || "")
                      .split(/\n\s*\n/g)
                      .map((para) => para.trim())
                      .filter(Boolean)
                      .slice(0, 8)
                      .map((para, idx) => (
                        <p key={idx} className="text-base">
                          {para.split("\n").map((line, j) => (
                            <span key={j}>
                              {line}
                              {j < para.split("\n").length - 1 ? <br /> : null}
                            </span>
                          ))}
                        </p>
                      ))}
                  </div>
                </article>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}


