import { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Settings',
  robots: {
    index: false,
    follow: false,
  },
}

export default function SettingsLayout({
  children,
}: React.PropsWithChildren) {
  return children
}
