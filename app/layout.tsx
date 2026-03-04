import { Toaster } from '@/components/ui/sonner'
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
  let profile = undefined

  if (session?.identity?.id) {
    try {
      profile = await fetchUser('md')
    } catch (error) {
      console.error('Failed to fetch current user in root layout:', error)
    }
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(GeistSans.className, 'antialiased')}>
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
