const DEFAULT_WHATSAPP_NUMBER = '51943974880'
const DEFAULT_INSTAGRAM_HANDLE = 'auralith.pe'

export function normalizeWhatsAppNumber(value?: string | null) {
  const digits = (value ?? '').replace(/\D/g, '')

  if (!digits) {
    return DEFAULT_WHATSAPP_NUMBER
  }

  if (digits.startsWith('51')) {
    return digits
  }

  if (digits.startsWith('0051')) {
    return digits.slice(2)
  }

  return `51${digits}`
}

export function createWhatsAppUrl(
  value?: string | null,
  message?: string,
) {
  const number = normalizeWhatsAppNumber(value)
  const query = message ? `?text=${encodeURIComponent(message)}` : ''

  return `https://wa.me/${number}${query}`
}

export function createTelUrl(value?: string | null) {
  return `tel:+${normalizeWhatsAppNumber(value)}`
}

export function formatPhoneLabel(value?: string | null) {
  const number = normalizeWhatsAppNumber(value)
  const localNumber = number.startsWith('51') ? number.slice(2) : number

  if (localNumber.length === 9) {
    return `+51 ${localNumber.slice(0, 3)} ${localNumber.slice(3, 6)} ${localNumber.slice(6)}`
  }

  return `+${number}`
}

export function normalizeInstagramHandle(value?: string | null) {
  const trimmedValue = (value ?? '').trim()

  if (!trimmedValue) {
    return DEFAULT_INSTAGRAM_HANDLE
  }

  if (trimmedValue.startsWith('http')) {
    try {
      const url = new URL(trimmedValue)
      return url.pathname.replace(/^\/|\/$/g, '') || DEFAULT_INSTAGRAM_HANDLE
    } catch {
      return DEFAULT_INSTAGRAM_HANDLE
    }
  }

  return trimmedValue.replace(/^@/, '').replace(/^instagram\.com\//, '')
}

export function createInstagramUrl(value?: string | null) {
  const trimmedValue = (value ?? '').trim()

  if (trimmedValue.startsWith('http')) {
    return trimmedValue
  }

  return `https://instagram.com/${normalizeInstagramHandle(value)}`
}

export function formatInstagramLabel(value?: string | null) {
  return `@${normalizeInstagramHandle(value)}`
}
