import { Suspense } from 'react'

export default function Layout({ children }: React.PropsWithChildren) {
  return (
    <div className="flex h-svh w-full items-center px-4">
      <Suspense>{children}</Suspense>
    </div>
  )
}
