import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Recover account',
  robots: {
    index: false,
    follow: false,
  },
}

export default function RecoveryLayout({ children }: React.PropsWithChildren) {
  return children
}
