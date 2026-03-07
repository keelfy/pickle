import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Verify account',
  robots: {
    index: false,
    follow: false,
  },
}

export default function VerificationLayout({
  children,
}: React.PropsWithChildren) {
  return children
}
