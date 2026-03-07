import { hasLocale } from 'next-intl'
import { cookies, headers } from 'next/headers'
import { getRequestConfig } from 'next-intl/server'
import { defaultLocale, locales } from './config'

const resolveHeaderLocale = (acceptLanguage: string | null) => {
  if (!acceptLanguage) return undefined

  const firstLocale = acceptLanguage.split(',')[0]?.trim().toLowerCase()
  if (!firstLocale) return undefined

  const baseLocale = firstLocale.split('-')[0]
  return baseLocale
}

export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const headerStore = await headers()

  const fromCookie = cookieStore.get('NEXT_LOCALE')?.value
  const fromHeader = resolveHeaderLocale(headerStore.get('accept-language'))
  const requested = fromCookie ?? fromHeader
  const locale = hasLocale(locales, requested) ? requested : defaultLocale

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  }
})
