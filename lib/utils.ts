export function formatWhatsAppUrl(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  const withCountry = digits.startsWith('1') ? digits : `1${digits}`
  return `https://wa.me/${withCountry}`
}

export function daysUntil(dateStr: string): number {
  const now = new Date()
  const target = new Date(dateStr)
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

export function daysAgo(dateStr: string): number {
  const now = new Date()
  const target = new Date(dateStr)
  return Math.floor((now.getTime() - target.getTime()) / (1000 * 60 * 60 * 24))
}

export function monthsBetween(startStr: string, endStr: string): number {
  const start = new Date(startStr)
  const end = new Date(endStr)
  return Math.max(
    1,
    (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
  )
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
