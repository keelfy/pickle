import { Suspense } from 'react'
import { Metadata } from 'next'

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
}

export default function Layout({ children }: React.PropsWithChildren) {
  return (
    <div className="flex h-svh w-full items-center px-4">
      <Suspense>{children}</Suspense>
    </div>
  )
}
