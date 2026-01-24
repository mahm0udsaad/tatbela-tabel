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
    tiktok?: string
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

export type AboutPagePayload = {
  title: string
  content: string
}

export type PolicyPagePayload = {
  title: string
  sections: {
    heading: string
    content: string
  }[]
  footer?: string
}


