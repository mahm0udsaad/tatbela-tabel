"use client"

import Link from "next/link"
import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { Facebook, Twitter, Instagram, Mail, Phone } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase"
import { DEFAULT_FOOTER } from "@/lib/site-content/defaults"
import { coercePayloadOrDefault, footerPayloadSchema } from "@/lib/site-content/schemas"

type FooterSettingsRow = {
  is_active: boolean
  payload: unknown
}

export function Footer() {
  const supabase = getSupabaseClient()
  const [isActive, setIsActive] = useState(true)
  const [payload, setPayload] = useState(DEFAULT_FOOTER)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data, error } = await supabase
        .from("page_settings")
        .select("is_active, payload")
        .eq("key", "footer")
        .maybeSingle()

      if (cancelled) return
      if (error) {
        console.error("Failed to load footer settings", error)
        setIsActive(true)
        setPayload(DEFAULT_FOOTER)
        return
      }
      if (!data) {
        setIsActive(true)
        setPayload(DEFAULT_FOOTER)
        return
      }

      const row = data as FooterSettingsRow
      setIsActive(Boolean(row.is_active))
      setPayload(coercePayloadOrDefault(footerPayloadSchema, row.payload, DEFAULT_FOOTER))
    })()
    return () => {
      cancelled = true
    }
  }, [supabase])

  const socialLinks = useMemo(() => {
    const items: { key: string; href: string; icon: React.ReactNode; label: string }[] = []
    if (payload.socials.facebook?.trim()) items.push({ key: "facebook", href: payload.socials.facebook, icon: <Facebook size={20} />, label: "Facebook" })
    if (payload.socials.twitter?.trim()) items.push({ key: "twitter", href: payload.socials.twitter, icon: <Twitter size={20} />, label: "Twitter/X" })
    if (payload.socials.instagram?.trim()) items.push({ key: "instagram", href: payload.socials.instagram, icon: <Instagram size={20} />, label: "Instagram" })
    return items
  }, [payload.socials.facebook, payload.socials.instagram, payload.socials.twitter])

  if (!isActive) return null

  return (
    <footer className="pb-12 bg-brand-green-darker text-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Info */}
          <div>
            <h3 className="text-2xl font-bold text-primary mb-4">{payload.brand.name}</h3>
            <p className="text-white/80 text-sm leading-relaxed">{payload.brand.description}</p>
          </div>

          {payload.columns.map((col) => (
            <div key={col.title}>
              <h4 className="font-bold mb-4 text-primary">{col.title}</h4>
              <ul className="space-y-2 text-sm">
                {col.links.map((link) => (
                  <li key={`${col.title}-${link.label}-${link.href}`}>
                    <Link href={link.href} className="text-white/80 hover:text-white transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact */}
          <div>
            <h4 className="font-bold mb-4 text-primary">تواصل معنا</h4>
            <div className="space-y-3 text-sm">
              {payload.contact.phones.slice(0, 2).map((phone) => (
                <a
                  key={phone}
                  href={`tel:${phone.replace(/[^\d+]/g, "")}`}
                  className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
                >
                  <Phone size={16} />
                  {phone}
                </a>
              ))}
              {payload.contact.emails.slice(0, 2).map((email) => (
                <a
                  key={email}
                  href={`mailto:${email}`}
                  className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
                >
                  <Mail size={16} />
                  {email}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/20 pt-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* Social Links */}
            {socialLinks.length > 0 ? (
              <div className="flex items-center gap-4">
                {socialLinks.map((item) => (
                  <a
                    key={item.key}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={item.label}
                    className="text-white/70 hover:text-white transition-colors"
                  >
                    {item.icon}
                  </a>
                ))}
              </div>
            ) : (
              <div />
            )}

            {/* Copyright */}
            <p className="text-white/70 text-sm">{payload.copyright}</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
