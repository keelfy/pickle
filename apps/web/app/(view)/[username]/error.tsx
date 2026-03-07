'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useEffect } from 'react'

type Props = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: Props) {
  useEffect(() => {
    console.error('Profile segment error boundary caught:', error)
  }, [error])

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <h2 className="text-xl font-semibold">Failed to load this profile</h2>
      <p className="text-sm text-muted-foreground">
        This profile data may be temporarily unavailable.
      </p>
      <div className="flex items-center gap-2">
        <Button type="button" onClick={reset}>
          Retry
        </Button>
        <Button asChild variant="secondary">
          <Link href="/">Back home</Link>
        </Button>
      </div>
    </div>
  )
}
