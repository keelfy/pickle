'use client'

import { Button } from '@/components/ui/button'
import { useEffect } from 'react'

type Props = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: Props) {
  useEffect(() => {
    console.error('View layout error boundary caught:', error)
  }, [error])

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <h2 className="text-xl font-semibold">Failed to load app view</h2>
      <p className="text-sm text-muted-foreground">
        Try reloading this section. If it keeps happening, check server logs.
      </p>
      <Button type="button" onClick={reset}>
        Retry
      </Button>
    </div>
  )
}
