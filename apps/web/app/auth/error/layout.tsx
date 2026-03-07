import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Authentication error',
  robots: {
    index: false,
    follow: false,
  },
}

export default function ErrorLayout({ children }: React.PropsWithChildren) {
  return children
}
