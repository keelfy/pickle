import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Create account',
  robots: {
    index: false,
    follow: false,
  },
}

export default function RegistrationLayout({
  children,
}: React.PropsWithChildren) {
  return children
}
