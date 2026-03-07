'use client'

import { useRouter } from 'next/navigation'
import React from 'react'

type Props = {
  href: string
}

export default function RedirectToNoteModal({ href }: Props) {
  const router = useRouter()

  React.useEffect(() => {
    router.replace(href)
  }, [href, router])

  return (
    <div className="flex min-h-svh items-center justify-center text-sm text-muted-foreground">
      Redirecting to note...
    </div>
  )
}
