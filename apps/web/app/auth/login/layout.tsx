import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Log in',
  robots: {
    index: false,
    follow: false,
  },
}

export default function LoginLayout({ children }: React.PropsWithChildren) {
  return children
}
