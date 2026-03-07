'use client'

import { Button } from '@/components/ui/button'
import { useEffect } from 'react'

type Props = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: Props) {
  useEffect(() => {
    console.error('Settings error boundary caught:', error)
  }, [error])

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <h2 className="text-xl font-semibold">Settings failed to load</h2>
      <p className="text-sm text-muted-foreground">
        We could not render your settings right now.
      </p>
      <Button type="button" onClick={reset}>
        Try again
      </Button>
    </div>
  )
}
