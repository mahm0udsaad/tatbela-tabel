export type FooterLink = {
  label: string
  href: string
}

export type FooterColumn = {
  title: string
  links: FooterLink[]
}

export type FooterPayload = {
  brand: {
    name: string
    description: string
  }
  columns: FooterColumn[]
  contact: {
    phones: string[]
    emails: string[]
  }
  socials: {
    facebook?: string
    instagram?: string
    twitter?: string
  }
  copyright: string
}

export type ContactPagePayload = {
  header: {
    title: string
    subtitle: string
  }
  phones: string[]
  emails: string[]
  whatsapp: {
    phone: string
    label: string
  }
  workHours: { label: string; time: string }[]
  location: {
    title: string
    lines: string[]
  }
  quickHelp: {
    title: string
    description: string
    phone: string
    ctaLabel: string
  }
}

export type AboutIconKey =
  | "flame"
  | "recycle"
  | "handPlatter"
  | "users"
  | "leaf"
  | "rocket"
  | "award"

export type AboutPagePayload = {
  hero: {
    eyebrow: string
    title: string
    highlight: string
    description: string
    primaryCtaLabel: string
    primaryCtaUrl: string
    secondaryCtaLabel: string
    secondaryCtaUrl: string
  }
  stats: { value: string; label: string; detail: string }[]
  milestones: { year: string; title: string; description: string }[]
  values: { title: string; description: string; icon: AboutIconKey }[]
  sourcingHighlights: { region: string; crop: string; note: string }[]
  team: { name: string; role: string; focus: string; quote: string }[]
  cta: {
    eyebrow: string
    title: string
    description: string
    primaryCtaLabel: string
    primaryCtaUrl: string
    secondaryCtaLabel: string
    secondaryCtaUrl: string
  }
}


