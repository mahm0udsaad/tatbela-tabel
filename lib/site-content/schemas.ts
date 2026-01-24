import { z } from "zod"
import type { AboutPagePayload, ContactPagePayload, FooterPayload, PolicyPagePayload } from "@/lib/site-content/types"

const nonEmptyText = z.string().trim().min(1)

export const footerPayloadSchema: z.ZodType<FooterPayload> = z.object({
  brand: z.object({
    name: nonEmptyText,
    description: z.string().trim().min(1),
  }),
  columns: z
    .array(
      z.object({
        title: nonEmptyText,
        links: z.array(z.object({ label: nonEmptyText, href: nonEmptyText })).min(1),
      }),
    )
    .min(1),
  contact: z.object({
    phones: z.array(nonEmptyText).min(1),
    emails: z.array(nonEmptyText).min(1),
  }),
  socials: z.object({
    facebook: z.string().optional(),
    instagram: z.string().optional(),
    tiktok: z.string().optional(),
  }),
  copyright: nonEmptyText,
})

export const contactPagePayloadSchema: z.ZodType<ContactPagePayload> = z.object({
  header: z.object({
    title: nonEmptyText,
    subtitle: z.string().trim().min(1),
  }),
  phones: z.array(nonEmptyText).min(1),
  emails: z.array(nonEmptyText).min(1),
  whatsapp: z.object({
    phone: nonEmptyText,
    label: nonEmptyText,
  }),
  workHours: z.array(z.object({ label: nonEmptyText, time: nonEmptyText })).min(1),
  location: z.object({
    title: nonEmptyText,
    lines: z.array(nonEmptyText).min(1),
  }),
  quickHelp: z.object({
    title: nonEmptyText,
    description: z.string().trim().min(1),
    phone: nonEmptyText,
    ctaLabel: nonEmptyText,
  }),
})

export const aboutPagePayloadSchema: z.ZodType<AboutPagePayload> = z.object({
  title: nonEmptyText,
  content: z.string().trim().min(1),
})

// Legacy support (previous rich about page payload). If found in DB, we auto-convert to an article.
const aboutLegacyIconKeySchema = z.enum(["flame", "recycle", "handPlatter", "users", "leaf", "rocket", "award"])
const aboutLegacyPayloadSchema = z.object({
  hero: z.object({
    eyebrow: nonEmptyText,
    title: nonEmptyText,
    highlight: nonEmptyText,
    description: z.string().trim().min(1),
    primaryCtaLabel: nonEmptyText,
    primaryCtaUrl: nonEmptyText,
    secondaryCtaLabel: nonEmptyText,
    secondaryCtaUrl: nonEmptyText,
  }),
  stats: z.array(z.object({ value: nonEmptyText, label: nonEmptyText, detail: nonEmptyText })).min(1),
  milestones: z.array(z.object({ year: nonEmptyText, title: nonEmptyText, description: nonEmptyText })).min(1),
  values: z.array(z.object({ title: nonEmptyText, description: nonEmptyText, icon: aboutLegacyIconKeySchema })).min(1),
  sourcingHighlights: z.array(z.object({ region: nonEmptyText, crop: nonEmptyText, note: nonEmptyText })).min(1),
  team: z.array(z.object({ name: nonEmptyText, role: nonEmptyText, focus: nonEmptyText, quote: nonEmptyText })).min(1),
  cta: z.object({
    eyebrow: nonEmptyText,
    title: nonEmptyText,
    description: nonEmptyText,
    primaryCtaLabel: nonEmptyText,
    primaryCtaUrl: nonEmptyText,
    secondaryCtaLabel: nonEmptyText,
    secondaryCtaUrl: nonEmptyText,
  }),
})

export function coerceAboutPagePayload(payload: unknown, fallback: AboutPagePayload): AboutPagePayload {
  const article = aboutPagePayloadSchema.safeParse(payload)
  if (article.success) return article.data

  const legacy = aboutLegacyPayloadSchema.safeParse(payload)
  if (!legacy.success) return fallback

  const legacyData = legacy.data
  const title = `${legacyData.hero.title} ${legacyData.hero.highlight}`.trim()

  const sections: string[] = []
  sections.push(legacyData.hero.description.trim())

  if (legacyData.values.length) {
    sections.push(
      ["قيمنا", ...legacyData.values.map((v) => `- ${v.title}: ${v.description}`)].join("\n"),
    )
  }

  if (legacyData.milestones.length) {
    sections.push(
      [
        "رحلتنا",
        ...legacyData.milestones.map((m) => `- ${m.year} — ${m.title}: ${m.description}`),
      ].join("\n"),
    )
  }

  if (legacyData.sourcingHighlights.length) {
    sections.push(
      [
        "شبكة التوريد",
        ...legacyData.sourcingHighlights.map((s) => `- ${s.region} (${s.crop}): ${s.note}`),
      ].join("\n"),
    )
  }

  return {
    title: title || fallback.title,
    content: sections.join("\n\n").trim() || fallback.content,
  }
}

export function coercePayloadOrDefault<T>(schema: z.ZodType<T>, payload: unknown, fallback: T): T {
  const parsed = schema.safeParse(payload)
  if (parsed.success) return parsed.data
  return fallback
}

export const policyPagePayloadSchema: z.ZodType<PolicyPagePayload> = z.object({
  title: nonEmptyText,
  sections: z.array(
    z.object({
      heading: nonEmptyText,
      content: z.string().trim().min(1),
    })
  ).min(1),
  footer: z.string().optional(),
})


