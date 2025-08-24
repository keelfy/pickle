import { Toaster } from '@/components/ui/toaster'
import { fetchUser } from '@/hooks/api-endpoints-server'
import getCurrentSession from '@/hooks/getCurrentSession'
import { cn } from '@/lib/utils'
import AuthStoreProvider from '@/providers/auth-store'
import { GeistSans } from 'geist/font/sans'
import './globals.css'
import RootProviders from './root-providers'

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000'

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: 'pickle',
  description: 'The pickle website',
}

export default async function RootLayout({
  children,
}: React.PropsWithChildren) {
  const session = await getCurrentSession()
  const profile = session?.identity?.id
    ? await fetchUser('md').catch(() => undefined)
    : undefined

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          'container max-w-5xl gap-10',
          GeistSans.className,
          'antialiased',
        )}
      >
        <RootProviders>
          <AuthStoreProvider user={profile} session={session}>
            {children}
          </AuthStoreProvider>
          <Toaster />
        </RootProviders>
      </body>
    </html>
  )
}
