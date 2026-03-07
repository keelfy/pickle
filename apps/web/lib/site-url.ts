const FALLBACK_URL = 'http://localhost:3000'

export function getSiteUrl(): string {
  const fromDomain = process.env.NEXT_PUBLIC_DOMAIN
  if (fromDomain && fromDomain.length > 0) {
    const normalized = fromDomain.startsWith('http')
      ? fromDomain
      : `https://${fromDomain}`
    return normalized.replace(/\/+$/, '')
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`.replace(/\/+$/, '')
  }

  return FALLBACK_URL
}

export function getSiteUrlObject(): URL {
  return new URL(getSiteUrl())
}
