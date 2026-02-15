export const normalizePhone = (input: string) => {
  const raw = input.trim().replace(/\s+/g, '')
  if (!raw) return ''

  if (raw.startsWith('+')) {
    return `+${raw.slice(1).replace(/\D/g, '')}`
  }

  if (raw.startsWith('00')) {
    return `+${raw.slice(2).replace(/\D/g, '')}`
  }

  const digits = raw.replace(/\D/g, '')
  if (!digits) return ''

  if (digits.startsWith('0')) {
    return `+2${digits}`
  }

  if (digits.startsWith('1')) {
    return `+20${digits}`
  }

  if (digits.startsWith('20')) {
    return `+${digits}`
  }

  return `+2${digits}`
}

export const isValidEgyptPhone = (phone: string) => /^\+20\d{10}$/.test(phone)
