"use client"

import { useCallback, useEffect, useState } from "react"
import {
  MessageSquare,
  Send,
  Phone,
  Users,
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import {
  fetchPhoneContactsAction,
  sendBulkSmsAction,
  type PhoneContact,
} from "./actions"

const PAGE_SIZE = 25
const SMS_BATCH_SIZE = 10

const SOURCE_LABELS: Record<PhoneContact["source"], string> = {
  order: "طلب",
  address: "عنوان",
  signin: "تسجيل دخول",
  multiple: "متعدد",
}

const SOURCE_COLORS: Record<PhoneContact["source"], string> = {
  order: "bg-amber-100 text-amber-800",
  address: "bg-blue-100 text-blue-800",
  signin: "bg-purple-100 text-purple-800",
  multiple: "bg-green-100 text-green-800",
}

export default function AdminMarketing() {
  const [contacts, setContacts] = useState<PhoneContact[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [search, setSearch] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [selectedPhones, setSelectedPhones] = useState<Set<string>>(new Set())
  const [allPhones, setAllPhones] = useState<string[]>([])
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [sendProgress, setSendProgress] = useState({ sent: 0, failed: 0, total: 0 })
  const { toast } = useToast()

  const fetchContacts = useCallback(
    async (p: number, q: string) => {
      setLoading(true)
      try {
        const result = await fetchPhoneContactsAction({
          page: p,
          pageSize: PAGE_SIZE,
          search: q || undefined,
        })
        setContacts(result.contacts)
        setTotalPages(result.totalPages)
        setTotalCount(result.total)
      } catch {
        toast({
          title: "خطأ",
          description: "تعذر جلب أرقام الهاتف",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    },
    [toast]
  )

  const fetchAllPhones = useCallback(async (q: string) => {
    try {
      const result = await fetchPhoneContactsAction({
        page: 1,
        pageSize: 100,
        search: q || undefined,
      })
      const totalResults = result.total
      if (totalResults <= 100) {
        setAllPhones(result.contacts.map((c) => c.phone))
      } else {
        const bigResult = await fetchPhoneContactsAction({
          page: 1,
          pageSize: totalResults,
          search: q || undefined,
        })
        setAllPhones(bigResult.contacts.map((c) => c.phone))
      }
    } catch {
      // silent - allPhones used only for select all
    }
  }, [])

  useEffect(() => {
    fetchContacts(page, search)
  }, [page, search, fetchContacts])

  useEffect(() => {
    fetchAllPhones(search)
  }, [search, fetchAllPhones])

  const handleSearch = () => {
    setPage(1)
    setSearch(searchInput)
    setSelectedPhones(new Set())
  }

  const allOnPageSelected =
    contacts.length > 0 && contacts.every((c) => selectedPhones.has(c.phone))

  const handleSelectAllPage = () => {
    setSelectedPhones((prev) => {
      const next = new Set(prev)
      if (allOnPageSelected) {
        for (const c of contacts) next.delete(c.phone)
      } else {
        for (const c of contacts) next.add(c.phone)
      }
      return next
    })
  }

  const handleSelectAllTotal = () => {
    if (selectedPhones.size === totalCount) {
      setSelectedPhones(new Set())
    } else {
      setSelectedPhones(new Set(allPhones))
    }
  }

  const handleSelectPhone = (phone: string) => {
    setSelectedPhones((prev) => {
      const next = new Set(prev)
      if (next.has(phone)) {
        next.delete(phone)
      } else {
        next.add(phone)
      }
      return next
    })
  }

  const smsSegments = message.length > 0 ? Math.ceil(message.length / 70) : 0

  const handleSendSms = async () => {
    if (selectedPhones.size === 0 || !message.trim()) return

    if (
      !confirm(
        `هل أنت متأكد من إرسال الرسالة إلى ${selectedPhones.size} رقم؟\n\nعدد أجزاء الرسالة: ${smsSegments}`
      )
    ) {
      return
    }

    const phones = Array.from(selectedPhones)
    setSending(true)
    setSendProgress({ sent: 0, failed: 0, total: phones.length })

    let totalSent = 0
    let totalFailed = 0

    for (let i = 0; i < phones.length; i += SMS_BATCH_SIZE) {
      const batch = phones.slice(i, i + SMS_BATCH_SIZE)
      try {
        const result = await sendBulkSmsAction({
          phones: batch,
          message: message.trim(),
        })
        totalSent += result.sent
        totalFailed += result.failed
      } catch {
        totalFailed += batch.length
      }
      setSendProgress({ sent: totalSent, failed: totalFailed, total: phones.length })
    }

    setSending(false)
    toast({
      title: totalFailed === 0 ? "تم الإرسال بنجاح" : "تم الإرسال مع بعض الأخطاء",
      description: `تم إرسال ${totalSent} رسالة${totalFailed > 0 ? `، فشل ${totalFailed}` : ""}`,
      variant: totalFailed === 0 ? "default" : "destructive",
    })
    setSelectedPhones(new Set())
    setMessage("")
  }

  const progressPercent =
    sendProgress.total > 0
      ? Math.round(((sendProgress.sent + sendProgress.failed) / sendProgress.total) * 100)
      : 0

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#f39c12] to-[#e08e0a] shadow-md">
          <MessageSquare className="size-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#2B2520]">رسائل SMS التسويقية</h1>
          <p className="text-sm text-[#8B6F47]">إرسال رسائل جماعية للعملاء</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-white p-4 shadow-sm border border-[#D9D4C8]">
          <div className="flex items-center gap-2 text-[#8B6F47]">
            <Phone className="size-4" />
            <span className="text-xs font-medium">إجمالي الأرقام</span>
          </div>
          <p className="mt-1 text-2xl font-bold text-[#2B2520]">{totalCount}</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm border border-[#D9D4C8]">
          <div className="flex items-center gap-2 text-[#8B6F47]">
            <Users className="size-4" />
            <span className="text-xs font-medium">تم التحديد</span>
          </div>
          <p className="mt-1 text-2xl font-bold text-[#2B2520]">
            {selectedPhones.size}
          </p>
        </div>
        {smsSegments > 0 && (
          <div className="rounded-xl bg-white p-4 shadow-sm border border-[#D9D4C8]">
            <div className="flex items-center gap-2 text-[#8B6F47]">
              <Send className="size-4" />
              <span className="text-xs font-medium">أجزاء الرسالة</span>
            </div>
            <p className="mt-1 text-2xl font-bold text-[#2B2520]">{smsSegments}</p>
          </div>
        )}
      </div>

      {/* Compose */}
      <div className="rounded-xl bg-white p-5 shadow-sm border border-[#D9D4C8] space-y-3">
        <label className="text-sm font-semibold text-[#2B2520]">نص الرسالة</label>
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="اكتب نص الرسالة هنا..."
          maxLength={1600}
          disabled={sending}
          className="min-h-[100px] text-right"
          dir="rtl"
        />
        <div className="flex items-center justify-between text-xs text-[#8B6F47]">
          <span>
            {message.length} / 1600 حرف
            {smsSegments > 0 && ` (${smsSegments} جزء SMS)`}
          </span>
          <Button
            onClick={handleSendSms}
            disabled={sending || selectedPhones.size === 0 || !message.trim()}
            className="bg-[#E8A835] text-white hover:bg-[#E8A835]/90 gap-2"
          >
            {sending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                جاري الإرسال... ({sendProgress.sent + sendProgress.failed}/{sendProgress.total})
              </>
            ) : (
              <>
                <Send className="size-4" />
                إرسال SMS ({selectedPhones.size})
              </>
            )}
          </Button>
        </div>

        {/* Progress bar */}
        {sending && (
          <div className="space-y-1">
            <div className="h-2 rounded-full bg-[#F5F1E8] overflow-hidden">
              <div
                className="h-full rounded-full bg-[#E8A835] transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-[#8B6F47]">
              <span>تم إرسال {sendProgress.sent}</span>
              {sendProgress.failed > 0 && (
                <span className="text-red-600">فشل {sendProgress.failed}</span>
              )}
              <span>{progressPercent}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Search + Select All */}
      <div className="rounded-xl bg-white shadow-sm border border-[#D9D4C8] overflow-hidden">
        <div className="flex flex-col gap-3 p-4 border-b border-[#D9D4C8] sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-[#8B6F47]" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="بحث برقم الهاتف أو الاسم..."
                disabled={sending}
                className="w-full rounded-lg border border-[#D9D4C8] bg-[#F9F7F3] py-2 pr-9 pl-3 text-sm text-[#2B2520] placeholder:text-[#8B6F47]/60 focus:border-[#E8A835] focus:outline-none focus:ring-1 focus:ring-[#E8A835]"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSearch}
              disabled={sending}
              className="border-[#D9D4C8] text-[#2B2520]"
            >
              بحث
            </Button>
          </div>

          {totalCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAllTotal}
              disabled={sending}
              className="border-[#D9D4C8] text-[#2B2520]"
            >
              {selectedPhones.size === totalCount
                ? "إلغاء تحديد الكل"
                : `تحديد الكل (${totalCount})`}
            </Button>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F5F1E8] border-b border-[#D9D4C8]">
                <th className="p-3 text-right w-10">
                  <Checkbox
                    checked={allOnPageSelected && contacts.length > 0}
                    onCheckedChange={handleSelectAllPage}
                    disabled={sending || contacts.length === 0}
                  />
                </th>
                <th className="p-3 text-right font-semibold text-[#2B2520]">
                  رقم الهاتف
                </th>
                <th className="p-3 text-right font-semibold text-[#2B2520]">
                  اسم العميل
                </th>
                <th className="p-3 text-right font-semibold text-[#2B2520]">
                  المصدر
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-[#8B6F47]">
                    <Loader2 className="mx-auto size-6 animate-spin mb-2" />
                    جاري التحميل...
                  </td>
                </tr>
              ) : contacts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-[#8B6F47]">
                    لا توجد أرقام هاتف
                  </td>
                </tr>
              ) : (
                contacts.map((contact) => (
                  <tr
                    key={contact.phone}
                    className="border-b border-[#D9D4C8] hover:bg-[#F9F7F3] transition-colors"
                  >
                    <td className="p-3">
                      <Checkbox
                        checked={selectedPhones.has(contact.phone)}
                        onCheckedChange={() => handleSelectPhone(contact.phone)}
                        disabled={sending}
                      />
                    </td>
                    <td className="p-3 font-mono text-[#2B2520]" dir="ltr">
                      {contact.phone}
                    </td>
                    <td className="p-3 text-[#2B2520]">
                      {contact.name || (
                        <span className="text-[#8B6F47]/60">—</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${SOURCE_COLORS[contact.source]}`}
                      >
                        {SOURCE_LABELS[contact.source]}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-[#D9D4C8]">
            <span className="text-sm text-[#8B6F47]">
              صفحة {page} من {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || sending}
                className="size-8 border-[#D9D4C8]"
              >
                <ChevronRight className="size-4" />
              </Button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => {
                  if (p === 1 || p === totalPages) return true
                  if (Math.abs(p - page) <= 1) return true
                  return false
                })
                .map((p, index, array) => {
                  const prevPage = array[index - 1]
                  const showEllipsis = prevPage && p - prevPage > 1
                  return (
                    <span key={p} className="flex items-center">
                      {showEllipsis && (
                        <span className="px-1 text-[#8B6F47]">...</span>
                      )}
                      <Button
                        variant={p === page ? "default" : "outline"}
                        size="icon"
                        onClick={() => setPage(p)}
                        disabled={sending}
                        className={`size-8 ${
                          p === page
                            ? "bg-[#E8A835] text-white hover:bg-[#E8A835]/90"
                            : "border-[#D9D4C8]"
                        }`}
                      >
                        {p}
                      </Button>
                    </span>
                  )
                })}

              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || sending}
                className="size-8 border-[#D9D4C8]"
              >
                <ChevronLeft className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
