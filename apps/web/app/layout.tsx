import { Toaster } from '@/components/ui/sonner'
import { getSiteUrlObject } from '@/lib/site-url'
import { cn } from '@/lib/utils'
import AuthStoreProvider from '@/providers/auth-store'
import { GeistSans } from 'geist/font/sans'
import { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import './globals.css'
import RootProviders from './root-providers'

const defaultDescription =
  'Your personal space to track games, movies, series, and anime. Share your opinions and stay in touch with your audience.'

export const metadata: Metadata = {
  metadataBase: getSiteUrlObject(),
  title: {
    default: 'Pickle - Track What You Watch & Play',
    template: '%s | Pickle',
  },
  description: defaultDescription,
  openGraph: {
    type: 'website',
    siteName: 'Pickle',
    title: 'Pickle - Track What You Watch & Play',
    description: defaultDescription,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pickle - Track What You Watch & Play',
    description:
      'Your personal space to track games, movies, series, and anime.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default async function RootLayout({
  children,
}: React.PropsWithChildren) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={cn(GeistSans.className, 'antialiased')}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <RootProviders>
            <AuthStoreProvider user={undefined} session={undefined}>
              {children}
            </AuthStoreProvider>
            <Toaster />
          </RootProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
